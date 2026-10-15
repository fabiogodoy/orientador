package br.com.connectas.orientador.call;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import br.com.connectas.orientador.cost.ProviderUsage;
import java.net.http.*;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Test;
class GroqTranscriptionClientTest {
    @Test void recordsProviderDurationEvenWhenTextIsEmpty() throws Exception {
        var http = mock(HttpClient.class); HttpResponse<String> response = mock(HttpResponse.class);
        when(http.send(any(),any(HttpResponse.BodyHandler.class))).thenReturn(response);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"text\":\"\",\"duration\":6}");
        var usage = new AtomicReference<ProviderUsage>();
        assertThrows(GroqTranscriptionClient.TranscriptionUnavailableException.class, () -> new GroqTranscriptionClient("test",http).transcribe(new byte[]{1},usage::set));
        assertNotNull(usage.get().costUsd());
        when(response.body()).thenReturn("{\"text\":\"Olá\",\"duration\":6}");
        assertEquals("Olá", new GroqTranscriptionClient("test",http).transcribe(new byte[]{1},usage::set));
    }
}
