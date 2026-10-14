package br.com.connectas.orientador.call;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import ch.qos.logback.classic.Logger;
import ch.qos.logback.classic.spi.ILoggingEvent;
import ch.qos.logback.core.read.ListAppender;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.Flow;
import java.util.concurrent.TimeUnit;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.slf4j.LoggerFactory;

class OpenAiSuggestionClientTest {
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient http = mock(HttpClient.class);
    private final OpenAiSuggestionClient client = new OpenAiSuggestionClient("synthetic-test-key", http);
    private final UUID user = UUID.randomUUID();
    private final CallSuggestionResponse suggestion = new CallSuggestionResponse("Pergunta", "Qual é o prazo?", "Vamos confirmar o prazo com a equipe.", List.of("Confirmar disponibilidade"), "Cliente avalia prazo e integração; próximo passo: confirmar disponibilidade.", 0);

    @Test
    void sendsLargerBudgetAndBoundedSchemaForLongCall() throws Exception {
        respond(completed(mapper.writeValueAsString(suggestion)));
        var segments = IntStream.rangeClosed(1, 130).mapToObj(i -> new SuggestionContextSegment(i, TranscriptSpeaker.CLIENT, "Qual é o prazo da integração?")).toList();
        assertEquals(130, client.generate(user, "Resumo anterior", new CallPreparation(null, null, null), segments, 130).summarizedThrough());
        var capture = ArgumentCaptor.forClass(HttpRequest.class);
        verify(http, times(1)).send(capture.capture(), any(HttpResponse.BodyHandler.class));
        var body = mapper.readTree(requestBody(capture.getValue()));
        assertEquals(1200, body.path("max_output_tokens").asInt());
        assertEquals("gpt-6-luna", body.path("model").asText());
        assertFalse(body.path("store").asBoolean());
        assertEquals(1200, body.at("/text/format/schema/properties/contextSummary/maxLength").asInt());
        assertTrue(body.path("instructions").asText().contains("Não acumule falas"));
        assertTrue(body.path("input").asText().contains("sequencia=\"130\""));
    }

    @Test
    void rejectsIncompleteBeforeParsingAndRecoversOnNextAttemptWithoutLoggingContent() throws Exception {
        Logger logger = (Logger) LoggerFactory.getLogger(OpenAiSuggestionClient.class);
        var logs = new ListAppender<ILoggingEvent>(); logs.start(); logger.addAppender(logs);
        try {
            for (String text : List.of("{\"contextSummary\":\"PRIVATE_CONTENT", mapper.writeValueAsString(suggestion))) {
                respond(mapper.writeValueAsString(Map.of("status", "incomplete", "incomplete_details", Map.of("reason", "max_output_tokens"), "usage", Map.of("output_tokens", 1200), "output", output(text))));
                assertThrows(OpenAiSuggestionClient.SuggestionUnavailableException.class, this::generate);
            }
            respond(completed(mapper.writeValueAsString(suggestion)));
            assertEquals(suggestion.contextSummary(), generate().contextSummary());
            String messages = logs.list.stream().map(ILoggingEvent::getFormattedMessage).reduce("", (a, b) -> a + b);
            assertTrue(messages.contains("reason=output_token_limit"));
            assertTrue(messages.contains("outputTokens=1200"));
            assertFalse(messages.contains("PRIVATE_CONTENT"));
            assertFalse(messages.contains("synthetic-test-key"));
            assertFalse(messages.contains(suggestion.contextSummary()));
            verify(http, times(3)).send(any(), any(HttpResponse.BodyHandler.class));
        } finally { logger.detachAppender(logs); logs.stop(); }
    }

    @Test
    void rejectsRefusalMissingOutputMalformedJsonAndOversizedSummary() throws Exception {
        var oversized = new CallSuggestionResponse(suggestion.tipo(), suggestion.trechoCliente(), suggestion.proximaFala(), suggestion.pontosChave(), "a".repeat(1201), 0);
        for (String response : List.of(
                "{", "null", "{\"status\":\"failed\"}",
                "{\"status\":\"completed\",\"output\":[]}",
                "{\"status\":\"completed\",\"output\":[{\"type\":\"message\",\"content\":[{\"type\":\"refusal\",\"refusal\":\"private\"}]}]}",
                completed("{\"tipo\":\"cortado"), completed(mapper.writeValueAsString(oversized)))) {
            respond(response);
            assertThrows(OpenAiSuggestionClient.SuggestionUnavailableException.class, this::generate);
        }
    }

    @Test
    void rejectsHttpFailureWithoutRetry() throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(429);
        when(response.body()).thenReturn("PRIVATE_PROVIDER_ERROR");
        when(http.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        assertThrows(OpenAiSuggestionClient.SuggestionUnavailableException.class, this::generate);
        verify(http, times(1)).send(any(), any(HttpResponse.BodyHandler.class));
    }

    private CallSuggestionResponse generate() {
        return client.generate(user, "", new CallPreparation(null, null, null), List.of(new SuggestionContextSegment(1, TranscriptSpeaker.CLIENT, "Qual é o prazo?")), 1);
    }

    private List<?> output(String text) { return List.of(Map.of("type", "message", "content", List.of(Map.of("type", "output_text", "text", text)))); }
    private String completed(String text) throws Exception { return mapper.writeValueAsString(Map.of("status", "completed", "output", output(text))); }
    private void respond(String body) throws Exception {
        HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200); when(response.body()).thenReturn(body);
        when(http.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn(response);
    }

    private static String requestBody(HttpRequest request) throws Exception {
        var bytes = new java.io.ByteArrayOutputStream();
        var completed = new CompletableFuture<String>();
        request.bodyPublisher().orElseThrow().subscribe(new Flow.Subscriber<ByteBuffer>() {
            public void onSubscribe(Flow.Subscription subscription) { subscription.request(Long.MAX_VALUE); }
            public void onNext(ByteBuffer item) { byte[] part = new byte[item.remaining()]; item.get(part); bytes.writeBytes(part); }
            public void onError(Throwable error) { completed.completeExceptionally(error); }
            public void onComplete() { completed.complete(bytes.toString(StandardCharsets.UTF_8)); }
        });
        return completed.get(5, TimeUnit.SECONDS);
    }
}
