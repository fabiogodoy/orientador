package br.com.connectas.orientador.cost;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import static org.mockito.ArgumentMatchers.any;
import java.net.http.*;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
class PtaxClientTest {
    @Test void readsLatestAvailableClosingQuoteAndBuildsBoundedRequest() throws Exception {
        var http = mock(HttpClient.class); HttpResponse<String> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(200);
        when(response.body()).thenReturn("{\"value\":[{\"cotacaoVenda\":5.0441,\"dataHoraCotacao\":\"2026-10-14 13:05:17.833426\"}]}");
        when(http.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn(response);
        var quote = new PtaxClient(http).latest(LocalDate.of(2026,10,15));
        assertEquals(new BigDecimal("5.0441"),quote.rate());
        assertEquals(LocalDate.of(2026,10,14),quote.date());
        var request = org.mockito.ArgumentCaptor.forClass(HttpRequest.class); verify(http).send(request.capture(),any(HttpResponse.BodyHandler.class));
        assertEquals("olinda.bcb.gov.br",request.getValue().uri().getHost());
        assertTrue(request.getValue().uri().toString().contains("$top=1"));
        assertTrue(request.getValue().timeout().orElseThrow().toSeconds() <= 4);
    }
    @Test void rejectsMissingNegativeFutureAndMalformedQuotes() {
        var today = LocalDate.of(2026,10,15);
        for (String body : new String[]{"{}", "{", "{\"value\":[{\"cotacaoVenda\":-1,\"dataHoraCotacao\":\"2026-10-15\"}]}", "{\"value\":[{\"cotacaoVenda\":5,\"dataHoraCotacao\":\"2026-10-16\"}]}"})
            assertThrows(Exception.class, () -> PtaxClient.parse(body,today));
    }
}
