package br.com.connectas.orientador.cost;

import com.fasterxml.jackson.databind.JsonNode;
import java.math.BigDecimal;
import java.math.RoundingMode;

/** Only metering metadata; never provider text, audio or credentials. */
public record ProviderUsage(String provider, String model, String tariffVersion, String units, BigDecimal costUsd) {
    public static ProviderUsage groq(JsonNode response) {
        JsonNode duration = response.path("duration");
        if (!duration.isNumber() || duration.decimalValue().signum() <= 0) return unknown("groq", "whisper-large-v3-turbo");
        BigDecimal seconds = duration.decimalValue().max(BigDecimal.TEN);
        return new ProviderUsage("groq", "whisper-large-v3-turbo", "groq-2026-10-15",
                "{\"billedSeconds\":" + seconds.toPlainString() + ",\"usdPerHour\":0.04}",
                seconds.multiply(new BigDecimal("0.04")).divide(new BigDecimal("3600"), 12, RoundingMode.HALF_UP));
    }

    public static ProviderUsage suggestion(JsonNode response) {
        JsonNode usage = response.path("usage");
        JsonNode input = usage.path("input_tokens"), output = usage.path("output_tokens");
        JsonNode cachedNode = usage.path("input_tokens_details").path("cached_tokens");
        if (!input.canConvertToLong() || !output.canConvertToLong()) return unknown("openai", "gpt-6-luna");
        long in = input.asLong(), out = output.asLong(), cached = cachedNode.isMissingNode() ? 0 : cachedNode.asLong(-1);
        if (in < 0 || out < 0 || cached < 0 || cached > in) return unknown("openai", "gpt-6-luna");
        BigDecimal inputRate = new BigDecimal(in > 272_000 ? "0.20" : "0.10");
        BigDecimal cachedRate = new BigDecimal(in > 272_000 ? "0.02" : "0.01");
        BigDecimal outputRate = new BigDecimal(in > 272_000 ? "0.75" : "0.50");
        BigDecimal cost = BigDecimal.valueOf(in - cached).multiply(inputRate)
                .add(BigDecimal.valueOf(cached).multiply(cachedRate)).add(BigDecimal.valueOf(out).multiply(outputRate))
                .divide(new BigDecimal("1000000"), 12, RoundingMode.HALF_UP);
        return new ProviderUsage("openai", "gpt-6-luna", "openai-2026-10-15",
                "{\"inputTokens\":" + in + ",\"cachedTokens\":" + cached + ",\"outputTokens\":" + out
                        + ",\"inputRate\":" + inputRate + ",\"cachedRate\":" + cachedRate + ",\"outputRate\":" + outputRate + "}", cost);
    }

    private static ProviderUsage unknown(String provider, String model) {
        return new ProviderUsage(provider, model, null, "{}", null);
    }
}
