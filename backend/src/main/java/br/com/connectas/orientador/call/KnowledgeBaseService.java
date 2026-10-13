package br.com.connectas.orientador.call;

import br.com.connectas.orientador.account.AccountService;
import br.com.connectas.orientador.account.Identity;
import br.com.connectas.orientador.account.Role;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class KnowledgeBaseService {
    private static final Logger log = LoggerFactory.getLogger(KnowledgeBaseService.class);
    private final JdbcTemplate jdbc;
    private final AccountService accounts;
    private final Clock clock;

    KnowledgeBaseService(JdbcTemplate jdbc, AccountService accounts, Clock clock) {
        this.jdbc = jdbc;
        this.accounts = accounts;
        this.clock = clock;
    }

    List<KnowledgeBaseResponse> list(UUID userId) {
        Identity identity = accounts.currentIdentity(userId);
        return List.copyOf(jdbc.query("select id, name, content, created_by_user_id, updated_at from knowledge_bases where tenant_id=? order by updated_at desc, id desc",
                (rs, row) -> response(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("content"), rs.getObject("created_by_user_id", UUID.class), rs.getTimestamp("updated_at").toInstant()), identity.tenantId()));
    }

    @Transactional
    KnowledgeBaseResponse create(UUID userId, KnowledgeBaseRequest request) {
        Identity identity = accounts.currentIdentity(userId);
        Instant now = clock.instant();
        UUID id = UUID.randomUUID();
        jdbc.update("insert into knowledge_bases (id, tenant_id, created_by_user_id, name, content, created_at, updated_at) values (?, ?, ?, ?, ?, ?, ?)",
                id, identity.tenantId(), identity.id(), normalize(request.name()), normalize(request.content()), Timestamp.from(now), Timestamp.from(now));
        log.info("Knowledge base created knowledgeBaseId={} tenantId={} creatorId={}", id, identity.tenantId(), identity.id());
        return find(identity, id);
    }

    @Transactional
    KnowledgeBaseResponse update(UUID userId, UUID id, KnowledgeBaseRequest request) {
        Identity identity = accounts.currentIdentity(userId);
        int updated = jdbc.update("update knowledge_bases set name=?, content=?, updated_at=? where id=? and tenant_id=? and (created_by_user_id=? or ?=true)",
                normalize(request.name()), normalize(request.content()), Timestamp.from(clock.instant()), id, identity.tenantId(), identity.id(), canManageAny(identity));
        if (updated != 1) throw new KnowledgeBaseNotFoundException();
        log.info("Knowledge base updated knowledgeBaseId={} tenantId={} actorId={}", id, identity.tenantId(), identity.id());
        return find(identity, id);
    }

    @Transactional
    void delete(UUID userId, UUID id) {
        Identity identity = accounts.currentIdentity(userId);
        int deleted = jdbc.update("delete from knowledge_bases where id=? and tenant_id=? and (created_by_user_id=? or ?=true)", id, identity.tenantId(), identity.id(), canManageAny(identity));
        if (deleted != 1) throw new KnowledgeBaseNotFoundException();
        log.info("Knowledge base deleted knowledgeBaseId={} tenantId={} actorId={}", id, identity.tenantId(), identity.id());
    }

    KnowledgeBaseSnapshot snapshot(Identity identity, UUID id) {
        List<KnowledgeBaseSnapshot> bases = jdbc.query("select name, content from knowledge_bases where id=? and tenant_id=?",
                (rs, row) -> new KnowledgeBaseSnapshot(rs.getString("name"), rs.getString("content")), id, identity.tenantId());
        if (bases.isEmpty()) throw new KnowledgeBaseNotFoundException();
        return bases.getFirst();
    }

    private KnowledgeBaseResponse find(Identity identity, UUID id) {
        List<KnowledgeBaseResponse> bases = jdbc.query("select id, name, content, created_by_user_id, updated_at from knowledge_bases where id=? and tenant_id=?",
                (rs, row) -> response(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("content"), rs.getObject("created_by_user_id", UUID.class), rs.getTimestamp("updated_at").toInstant()), id, identity.tenantId());
        if (bases.isEmpty()) throw new KnowledgeBaseNotFoundException();
        return bases.getFirst();
    }

    private static KnowledgeBaseResponse response(UUID id, String name, String content, UUID creator, Instant updatedAt) {
        return new KnowledgeBaseResponse(id, name, content, creator, updatedAt);
    }
    private static boolean canManageAny(Identity identity) { return identity.role() == Role.ORGANIZATION_MANAGER; }
    private static String normalize(String value) { return value.trim(); }
    public static class KnowledgeBaseNotFoundException extends RuntimeException {}
    record KnowledgeBaseSnapshot(String name, String content) {}
}
