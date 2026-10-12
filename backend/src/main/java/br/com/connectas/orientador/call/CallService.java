package br.com.connectas.orientador.call;

import br.com.connectas.orientador.account.AccountService;
import br.com.connectas.orientador.account.Identity;
import br.com.connectas.orientador.account.Role;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CallService {
    static final String FALLBACK_TITLE = "Reunião sem título";
    static final int HISTORY_PAGE_SIZE = 20;
    private static final Logger log = LoggerFactory.getLogger(CallService.class);
    private final JdbcTemplate jdbc;
    private final AccountService accounts;
    private final OpenAiRealtimeClient realtime;
    private final CallSuggestionGenerator suggestions;
    private final Clock clock;
    CallService(JdbcTemplate jdbc, AccountService accounts, OpenAiRealtimeClient realtime, CallSuggestionGenerator suggestions, Clock clock) {
        this.jdbc = jdbc; this.accounts = accounts; this.realtime = realtime; this.suggestions = suggestions; this.clock = clock;
    }

    @Transactional
    CallSessionResponse start(UUID userId, String requestedTitle) {
        Identity identity = accounts.currentIdentity(userId);
        UUID id = UUID.randomUUID(); Instant now = clock.instant();
        String title = normalizeTitle(requestedTitle);
        jdbc.update("insert into call_sessions (id, tenant_id, user_id, title, status, started_at) values (?, ?, ?, ?, 'ACTIVE', ?)", id, identity.tenantId(), identity.id(), title, Timestamp.from(now));
        CallSessionResponse response = new CallSessionResponse(id, realtime.createClientSecret(identity.id()), title);
        log.info("Realtime transcription started callId={} tenantId={}", id, identity.tenantId());
        return response;
    }

    @Transactional
    String updateTitle(UUID userId, UUID sessionId, String requestedTitle, boolean automatic) {
        Identity identity = accounts.currentIdentity(userId);
        String title = normalizeTitle(requestedTitle);
        int updated = jdbc.update("update call_sessions set title=? where id=? and tenant_id=? and user_id=? and (?=false or title=?)", title, sessionId, identity.tenantId(), identity.id(), automatic, FALLBACK_TITLE);
        if (updated == 1) {
            log.info("Call title updated callId={} tenantId={}", sessionId, identity.tenantId());
            return title;
        }
        String currentTitle = jdbc.query("select title from call_sessions where id=? and tenant_id=? and user_id=?", resultSet -> resultSet.next() ? resultSet.getString(1) : null, sessionId, identity.tenantId(), identity.id());
        if (currentTitle == null) throw new CallNotFoundException();
        return currentTitle;
    }

    TranscriptionSecretResponse createTranscriptionSecret(UUID userId, UUID sessionId) {
        Identity identity = accounts.currentIdentity(userId);
        Integer active = jdbc.queryForObject("select count(*) from call_sessions where id=? and tenant_id=? and user_id=? and status='ACTIVE'", Integer.class, sessionId, identity.tenantId(), identity.id());
        if (active == null || active != 1) throw new CallNotFoundException();
        return new TranscriptionSecretResponse(realtime.createClientSecret(identity.id()));
    }

    @Transactional
    void append(UUID userId, UUID sessionId, TranscriptSegmentRequest request) {
        Identity identity = accounts.currentIdentity(userId); Instant now = clock.instant();
        int inserted = jdbc.update("insert into transcript_segments (id, call_session_id, tenant_id, sequence_number, text, speaker, finalized_at, created_at) select ?, id, tenant_id, ?, ?, ?, ?, ? from call_sessions where id=? and tenant_id=? and user_id=? and status='ACTIVE'", UUID.randomUUID(), request.sequenceNumber(), request.text().trim(), request.speaker().name(), Timestamp.from(now), Timestamp.from(now), sessionId, identity.tenantId(), identity.id());
        if (inserted != 1) throw new CallNotFoundException();
        log.info("Realtime transcript segment persisted callId={} tenantId={} sequenceNumber={} speaker={}", sessionId, identity.tenantId(), request.sequenceNumber(), request.speaker());
    }

    CallSuggestionResponse suggest(UUID userId, UUID sessionId) {
        Identity identity = accounts.currentIdentity(userId);
        Integer active = jdbc.queryForObject("select count(*) from call_sessions where id=? and tenant_id=? and user_id=? and status='ACTIVE'", Integer.class,
                sessionId, identity.tenantId(), identity.id());
        if (active == null || active != 1) throw new CallNotFoundException();
        List<SuggestionContextSegment> segments = jdbc.query("select sequence_number, speaker, text from transcript_segments where call_session_id=? and tenant_id=? order by sequence_number",
                (resultSet, rowNumber) -> new SuggestionContextSegment(resultSet.getInt("sequence_number"), TranscriptSpeaker.valueOf(resultSet.getString("speaker")), resultSet.getString("text")), sessionId, identity.tenantId());
        if (segments.stream().noneMatch(segment -> segment.speaker() == TranscriptSpeaker.CLIENT)) throw new SuggestionContextUnavailableException();
        long startedAt = System.nanoTime();
        try {
            CallSuggestionResponse suggestion = suggestions.generate(identity.id(), List.copyOf(segments));
            log.info("Suggestion generated callId={} tenantId={} durationMs={} segmentCount={}", sessionId, identity.tenantId(), (System.nanoTime() - startedAt) / 1_000_000, segments.size());
            return suggestion;
        } catch (OpenAiSuggestionClient.SuggestionUnavailableException exception) {
            log.warn("Suggestion unavailable callId={} tenantId={} durationMs={}", sessionId, identity.tenantId(), (System.nanoTime() - startedAt) / 1_000_000);
            throw exception;
        }
    }

    @Transactional
    void end(UUID userId, UUID sessionId) {
        Identity identity = accounts.currentIdentity(userId);
        int updated = jdbc.update("update call_sessions set status='ENDED', ended_at=? where id=? and tenant_id=? and user_id=? and status='ACTIVE'", Timestamp.from(clock.instant()), sessionId, identity.tenantId(), identity.id());
        if (updated != 1) throw new CallNotFoundException();
        log.info("Realtime transcription ended callId={} tenantId={}", sessionId, identity.tenantId());
    }

    CallHistoryPage history(UUID userId, int page) {
        if (page < 0) throw new CallNotFoundException();
        Identity viewer = accounts.currentIdentity(userId);
        AccessScope scope = accessScope(viewer);
        Integer total = jdbc.queryForObject("select count(*) from call_sessions c where " + scope.where(), Integer.class, scope.parameters());
        List<CallHistoryItem> items = jdbc.query("select c.id, c.title, c.started_at, c.ended_at, c.user_id, u.name as owner_name "
                        + "from call_sessions c join users u on u.id=c.user_id where " + scope.where()
                        + " order by c.started_at desc, c.id desc limit ? offset ?",
                (resultSet, row) -> historyItem(resultSet.getObject("id", UUID.class), resultSet.getString("title"),
                        resultSet.getTimestamp("started_at").toInstant(), resultSet.getTimestamp("ended_at").toInstant(),
                        resultSet.getObject("user_id", UUID.class), resultSet.getString("owner_name")),
                withPaging(scope.parameters(), page));
        log.info("Call history listed viewerId={} tenantId={} role={} page={} total={}", viewer.id(), viewer.tenantId(), viewer.role(), page, total);
        return new CallHistoryPage(List.copyOf(items), page, HISTORY_PAGE_SIZE, total == null ? 0 : total);
    }

    CallHistoryDetail detail(UUID userId, UUID sessionId) {
        Identity viewer = accounts.currentIdentity(userId);
        AccessScope scope = accessScope(viewer);
        List<CallHistoryItem> calls = jdbc.query("select c.id, c.title, c.started_at, c.ended_at, c.user_id, u.name as owner_name "
                        + "from call_sessions c join users u on u.id=c.user_id where c.id=? and " + scope.where(),
                (resultSet, row) -> historyItem(resultSet.getObject("id", UUID.class), resultSet.getString("title"),
                        resultSet.getTimestamp("started_at").toInstant(), resultSet.getTimestamp("ended_at").toInstant(),
                        resultSet.getObject("user_id", UUID.class), resultSet.getString("owner_name")),
                withSessionId(sessionId, scope.parameters()));
        if (calls.isEmpty()) throw new CallNotFoundException();
        CallHistoryItem call = calls.getFirst();
        List<TranscriptHistorySegment> segments = jdbc.query("select sequence_number, speaker, text, finalized_at from transcript_segments "
                        + "where call_session_id=? and tenant_id=? order by sequence_number",
                (resultSet, row) -> new TranscriptHistorySegment(resultSet.getInt("sequence_number"),
                        TranscriptSpeaker.valueOf(resultSet.getString("speaker")), resultSet.getString("text"),
                        resultSet.getTimestamp("finalized_at").toInstant()), sessionId, viewer.role() == Role.PLATFORM_ADMIN ? tenantFor(call.sessionId()) : viewer.tenantId());
        log.info("Call history detail viewed viewerId={} tenantId={} role={} callId={}", viewer.id(), viewer.tenantId(), viewer.role(), sessionId);
        return new CallHistoryDetail(call.sessionId(), call.title(), call.startedAt(), call.endedAt(), call.durationSeconds(),
                call.ownerId(), call.ownerName(), List.copyOf(segments));
    }

    private UUID tenantFor(UUID sessionId) {
        return jdbc.queryForObject("select tenant_id from call_sessions where id=?", UUID.class, sessionId);
    }

    private static CallHistoryItem historyItem(UUID id, String title, Instant startedAt, Instant endedAt, UUID ownerId, String ownerName) {
        return new CallHistoryItem(id, title, startedAt, endedAt, endedAt.getEpochSecond() - startedAt.getEpochSecond(), ownerId, ownerName);
    }

    private static Object[] withPaging(Object[] parameters, int page) {
        Object[] values = java.util.Arrays.copyOf(parameters, parameters.length + 2);
        values[parameters.length] = HISTORY_PAGE_SIZE;
        values[parameters.length + 1] = page * HISTORY_PAGE_SIZE;
        return values;
    }

    private static Object[] withSessionId(UUID sessionId, Object[] parameters) {
        Object[] values = new Object[parameters.length + 1];
        values[0] = sessionId;
        System.arraycopy(parameters, 0, values, 1, parameters.length);
        return values;
    }

    private static AccessScope accessScope(Identity identity) {
        return switch (identity.role()) {
            case PLATFORM_ADMIN -> new AccessScope("c.status='ENDED'", new Object[] {});
            case ORGANIZATION_MANAGER -> new AccessScope("c.status='ENDED' and c.tenant_id=?", new Object[] { identity.tenantId() });
            default -> new AccessScope("c.status='ENDED' and c.tenant_id=? and c.user_id=?", new Object[] { identity.tenantId(), identity.id() });
        };
    }

    private record AccessScope(String where, Object[] parameters) {}

    private static String normalizeTitle(String title) {
        if (title == null) return FALLBACK_TITLE;
        String normalized = title.trim();
        return normalized.isEmpty() ? FALLBACK_TITLE : normalized;
    }
    public static class CallNotFoundException extends RuntimeException {}
    public static class SuggestionContextUnavailableException extends RuntimeException {}
}
