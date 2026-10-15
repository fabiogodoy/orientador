package br.com.connectas.orientador.cost;
import static org.junit.jupiter.api.Assertions.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;
class ProviderUsageTest {
    private final ObjectMapper json = new ObjectMapper();
    @Test void appliesMinimumAudioChargeAndKeepsMicroAmounts() throws Exception {
        assertEquals(new BigDecimal("0.000111111111"), ProviderUsage.groq(json.readTree("{\"duration\":5.2}")).costUsd());
        assertEquals(new BigDecimal("0.000166666667"), ProviderUsage.groq(json.readTree("{\"duration\":15}")).costUsd());
        assertNull(ProviderUsage.groq(json.readTree("{}")).costUsd());
        assertNull(ProviderUsage.groq(json.readTree("{\"duration\":-1}")).costUsd());
    }
    @Test void pricesUncachedCachedAndOutputSeparately() throws Exception {
        var usage = ProviderUsage.suggestion(json.readTree("{\"usage\":{\"input_tokens\":1000,\"input_tokens_details\":{\"cached_tokens\":200},\"output_tokens\":100}}"));
        assertEquals(new BigDecimal("0.000132000000"), usage.costUsd());
        assertTrue(usage.units().contains("inputRate"));
        assertEquals(new BigDecimal("0.060000750000"), ProviderUsage.suggestion(json.readTree("{\"usage\":{\"input_tokens\":300000,\"output_tokens\":1}}")).costUsd());
    }
    @Test void missingOrInconsistentUsageIsNotFree() throws Exception {
        for (String body : new String[]{"{}", "{\"usage\":{\"input_tokens\":-1,\"output_tokens\":2}}", "{\"usage\":{\"input_tokens\":2,\"output_tokens\":2,\"input_tokens_details\":{\"cached_tokens\":3}}}"})
            assertNull(ProviderUsage.suggestion(json.readTree(body)).costUsd());
    }
    @Test void periodUsesInclusiveCivilDays() {
        var date = LocalDate.of(2026,10,15);
        assertEquals(date, CostService.startDate("TODAY",date));
        assertEquals(date.minusDays(6), CostService.startDate("WEEK",date));
        assertEquals(date.minusDays(29), CostService.startDate("MONTH",date));
        assertNull(CostService.startDate("ALL",date));
        assertThrows(Exception.class, () -> CostService.startDate("bad",date));
    }
}
