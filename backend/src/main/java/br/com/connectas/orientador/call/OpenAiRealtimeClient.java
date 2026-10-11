package br.com.connectas.orientador.call;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Duration;
import java.util.HexFormat;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class OpenAiRealtimeClient {
    private static final Logger log = LoggerFactory.getLogger(OpenAiRealtimeClient.class);
    private final HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(10)).build();
    private final String apiKey;
    private static final Pattern SECRET_VALUE = Pattern.compile("\\\"value\\\"\\s*:\\s*\\\"([^\\\"]+)\\\"");

    OpenAiRealtimeClient(@Value("${app.openai.api-key:}") String apiKey) {
        this.apiKey = apiKey;
    }

    String createClientSecret(UUID userId) {
        if (apiKey.isBlank()) {
            log.warn("Realtime client secret unavailable reason=api_key_missing");
            throw new RealtimeUnavailableException();
        }
        try {
            String body = "{\"session\":{\"type\":\"transcription\",\"audio\":{\"input\":{\"transcription\":{\"model\":\"gpt-live-transcribe\",\"languages\":[\"pt\"],\"delay\":\"low\"},\"turn_detection\":null}}}}";
            HttpRequest request = HttpRequest.newBuilder(URI.create("https://api.openai.com/v1/realtime/client_secrets"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .header("OpenAI-Safety-Identifier", safetyIdentifier(userId))
                    .POST(HttpRequest.BodyPublishers.ofString(body, StandardCharsets.UTF_8)).build();
            HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("Realtime client secret unavailable reason=provider_rejected status={}", response.statusCode());
                throw new RealtimeUnavailableException();
            }
            Matcher value = SECRET_VALUE.matcher(response.body());
            if (!value.find() || value.group(1).isBlank()) {
                log.warn("Realtime client secret unavailable reason=provider_secret_missing");
                throw new RealtimeUnavailableException();
            }
            return value.group(1);
        } catch (Exception exception) {
            if (exception instanceof RealtimeUnavailableException unavailable) throw unavailable;
            log.warn("Realtime client secret unavailable reason=transport_failure exception={}", exception.getClass().getSimpleName());
            throw new RealtimeUnavailableException();
        }
    }

    private static String safetyIdentifier(UUID userId) throws Exception {
        return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(userId.toString().getBytes(StandardCharsets.UTF_8)));
    }

    public static class RealtimeUnavailableException extends RuntimeException {}
}
