package br.com.connectas.orientador.cost;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import org.springframework.stereotype.Component;

@Component
public class PtaxClient {
    private final HttpClient http;
    public PtaxClient() { this(HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(2)).build()); }
    PtaxClient(HttpClient http) { this.http = http; }
    public Quote latest(LocalDate today) throws Exception {
        DateTimeFormatter format = DateTimeFormatter.ofPattern("MM-dd-yyyy");
        String url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarPeriodo(dataInicial=@dataInicial,dataFinalCotacao=@dataFinalCotacao)"
                + "?@dataInicial='" + today.minusDays(30).format(format) + "'&@dataFinalCotacao='" + today.format(format)
                + "'&$top=1&$orderby=dataHoraCotacao%20desc&$format=json";
        HttpResponse<String> response = http.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(4)).GET().build(), HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() != 200) throw new IllegalStateException("PTAX unavailable");
        return parse(response.body(), today);
    }
    static Quote parse(String body, LocalDate today) throws Exception {
        JsonNode row = new ObjectMapper().readTree(body).path("value").path(0);
        if (!row.path("cotacaoVenda").isNumber()) throw new IllegalArgumentException("Invalid PTAX rate");
        BigDecimal rate = row.path("cotacaoVenda").decimalValue();
        LocalDate date = LocalDate.parse(row.path("dataHoraCotacao").asText().substring(0, 10));
        if (rate.signum() <= 0 || date.isAfter(today) || date.isBefore(today.minusDays(30))) throw new IllegalArgumentException("Invalid PTAX quote");
        return new Quote(rate, date);
    }
    public record Quote(BigDecimal rate, LocalDate date) {}
}
