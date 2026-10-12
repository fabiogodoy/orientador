package br.com.connectas.orientador.call;

import br.com.connectas.orientador.account.AccountService;
import br.com.connectas.orientador.account.Identity;
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

    private static String normalizeTitle(String title) {
        if (title == null) return FALLBACK_TITLE;
        String normalized = title.trim();
        return normalized.isEmpty() ? FALLBACK_TITLE : normalized;
    }
    public static class CallNotFoundException extends RuntimeException {}
    public static class SuggestionContextUnavailableException extends RuntimeException {}
}
