package br.com.connectas.orientador.call;

import br.com.connectas.orientador.account.AccountService;
import br.com.connectas.orientador.account.Identity;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CallService {
    private static final Logger log = LoggerFactory.getLogger(CallService.class);
    private final JdbcTemplate jdbc;
    private final AccountService accounts;
    private final OpenAiRealtimeClient realtime;
    private final Clock clock;
    CallService(JdbcTemplate jdbc, AccountService accounts, OpenAiRealtimeClient realtime, Clock clock) { this.jdbc = jdbc; this.accounts = accounts; this.realtime = realtime; this.clock = clock; }

    @Transactional
    CallSessionResponse start(UUID userId) {
        Identity identity = accounts.currentIdentity(userId);
        UUID id = UUID.randomUUID(); Instant now = clock.instant();
        jdbc.update("insert into call_sessions (id, tenant_id, user_id, status, started_at) values (?, ?, ?, 'ACTIVE', ?)", id, identity.tenantId(), identity.id(), Timestamp.from(now));
        CallSessionResponse response = new CallSessionResponse(id, realtime.createClientSecret(identity.id()));
        log.info("Realtime transcription started callId={} tenantId={}", id, identity.tenantId());
        return response;
    }

    @Transactional
    void append(UUID userId, UUID sessionId, TranscriptSegmentRequest request) {
        Identity identity = accounts.currentIdentity(userId); Instant now = clock.instant();
        int inserted = jdbc.update("insert into transcript_segments (id, call_session_id, tenant_id, sequence_number, text, finalized_at, created_at) select ?, id, tenant_id, ?, ?, ?, ? from call_sessions where id=? and tenant_id=? and user_id=? and status='ACTIVE'", UUID.randomUUID(), request.sequenceNumber(), request.text().trim(), Timestamp.from(now), Timestamp.from(now), sessionId, identity.tenantId(), identity.id());
        if (inserted != 1) throw new CallNotFoundException();
        log.info("Realtime transcript segment persisted callId={} tenantId={} sequenceNumber={}", sessionId, identity.tenantId(), request.sequenceNumber());
    }

    @Transactional
    void end(UUID userId, UUID sessionId) {
        Identity identity = accounts.currentIdentity(userId);
        int updated = jdbc.update("update call_sessions set status='ENDED', ended_at=? where id=? and tenant_id=? and user_id=? and status='ACTIVE'", Timestamp.from(clock.instant()), sessionId, identity.tenantId(), identity.id());
        if (updated != 1) throw new CallNotFoundException();
        log.info("Realtime transcription ended callId={} tenantId={}", sessionId, identity.tenantId());
    }
    public static class CallNotFoundException extends RuntimeException {}
}
