package br.com.connectas.orientador.call;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.List;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

@Component
public class GroqTranscriptionClient {
    private static final Logger log = LoggerFactory.getLogger(GroqTranscriptionClient.class);
    private static final URI ENDPOINT = URI.create("https://api.groq.com/openai/v1/audio/transcriptions");
    private final HttpClient client;
    private final ObjectMapper mapper = new ObjectMapper();
    private final String apiKey;

    @org.springframework.beans.factory.annotation.Autowired
    GroqTranscriptionClient(@Value("${app.groq.api-key:}") String apiKey) {
        this(apiKey, HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(3)).build());
    }
    GroqTranscriptionClient(String apiKey, HttpClient client) { this.apiKey = apiKey; this.client = client; }

    String transcribe(byte[] audio) { return transcribe(audio, usage -> {}); }

    String transcribe(byte[] audio, java.util.function.Consumer<br.com.connectas.orientador.cost.ProviderUsage> onUsage) {
        if (apiKey.isBlank()) throw new TranscriptionUnavailableException();
        try {
            String boundary = "orientador-" + java.util.UUID.randomUUID();
            List<byte[]> parts = List.of(
                    bytes("--" + boundary + "\r\nContent-Disposition: form-data; name=\"model\"\r\n\r\nwhisper-large-v3-turbo\r\n"),
                    bytes("--" + boundary + "\r\nContent-Disposition: form-data; name=\"response_format\"\r\n\r\nverbose_json\r\n"),
                    bytes("--" + boundary + "\r\nContent-Disposition: form-data; name=\"temperature\"\r\n\r\n0\r\n"),
                    bytes("--" + boundary + "\r\nContent-Disposition: form-data; name=\"file\"; filename=\"chunk.webm\"\r\nContent-Type: audio/webm\r\n\r\n"), audio,
                    bytes("\r\n--" + boundary + "--\r\n"));
            HttpResponse<String> response = client.send(HttpRequest.newBuilder(ENDPOINT).timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + apiKey).header("Content-Type", "multipart/form-data; boundary=" + boundary)
                    .POST(HttpRequest.BodyPublishers.ofByteArrays(parts)).build(), HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() / 100 != 2) {
                log.warn("Groq transcription rejected status={}", response.statusCode());
                throw new TranscriptionUnavailableException();
            }
            JsonNode payload = mapper.readTree(response.body());
            onUsage.accept(br.com.connectas.orientador.cost.ProviderUsage.groq(payload));
            String text = payload.path("text").asText().trim();
            if (text.isBlank()) throw new TranscriptionUnavailableException();
            return text;
        } catch (TranscriptionUnavailableException exception) { throw exception;
        } catch (Exception exception) {
            log.warn("Groq transcription unavailable reason={}", exception.getClass().getSimpleName());
            throw new TranscriptionUnavailableException();
        }
    }
    private static byte[] bytes(String value) { return value.getBytes(java.nio.charset.StandardCharsets.UTF_8); }
    public static class TranscriptionUnavailableException extends RuntimeException {}
}
