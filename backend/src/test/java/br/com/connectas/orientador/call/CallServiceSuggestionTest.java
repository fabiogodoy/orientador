package br.com.connectas.orientador.call;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import br.com.connectas.orientador.account.AccountService;
import br.com.connectas.orientador.account.AccountType;
import br.com.connectas.orientador.account.Identity;
import br.com.connectas.orientador.account.Role;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

class CallServiceSuggestionTest {
    private final UUID userId = UUID.randomUUID();
    private final UUID tenantId = UUID.randomUUID();
    private final UUID callId = UUID.randomUUID();
    private final AccountService accounts = mock(AccountService.class);
    private final JdbcTemplate jdbc = mock(JdbcTemplate.class);
    private final OpenAiRealtimeClient realtime = mock(OpenAiRealtimeClient.class);
    private final CallSuggestionGenerator generator = mock(CallSuggestionGenerator.class);
    private final CallService service = new CallService(jdbc, accounts, realtime, generator, Clock.fixed(Instant.EPOCH, ZoneOffset.UTC));

    @Test
    void generatesOnlyFromAuthorizedOrderedCallSegments() {
        Identity identity = new Identity(userId, tenantId, "Pessoa", "pessoa@example.com", Role.INDIVIDUAL, AccountType.INDIVIDUAL, null, Instant.MAX);
        when(accounts.currentIdentity(userId)).thenReturn(identity);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(callId), eq(tenantId), eq(userId))).thenReturn(1);
        List<SuggestionContextSegment> segments = List.of(
                new SuggestionContextSegment(1, TranscriptSpeaker.USER, "Olá"),
                new SuggestionContextSegment(2, TranscriptSpeaker.CLIENT, "Tenho uma dúvida"));
        when(jdbc.query(anyString(), any(RowMapper.class), eq(callId), eq(tenantId))).thenReturn(segments);
        CallSuggestionResponse expected = new CallSuggestionResponse("Objeção", "Tenho uma dúvida", "Claro, qual ponto é mais importante para você?", List.of("Entenda a dúvida"));
        when(generator.generate(eq(userId), eq(segments))).thenReturn(expected);

        assertEquals(expected, service.suggest(userId, callId));
        verify(generator).generate(userId, segments);
    }

    @Test
    void rejectsGenerationWithoutClientSpeech() {
        Identity identity = new Identity(userId, tenantId, "Pessoa", "pessoa@example.com", Role.INDIVIDUAL, AccountType.INDIVIDUAL, null, Instant.MAX);
        when(accounts.currentIdentity(userId)).thenReturn(identity);
        when(jdbc.queryForObject(anyString(), eq(Integer.class), eq(callId), eq(tenantId), eq(userId))).thenReturn(1);
        when(jdbc.query(anyString(), any(RowMapper.class), eq(callId), eq(tenantId)))
                .thenReturn(List.of(new SuggestionContextSegment(1, TranscriptSpeaker.USER, "Olá")));

        assertThrows(CallService.SuggestionContextUnavailableException.class, () -> service.suggest(userId, callId));
    }
}
