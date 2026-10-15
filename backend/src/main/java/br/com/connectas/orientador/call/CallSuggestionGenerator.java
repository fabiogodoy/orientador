package br.com.connectas.orientador.call;

import java.util.List;
import java.util.UUID;

interface CallSuggestionGenerator {
    CallSuggestionResponse generate(UUID userId, String summary, CallPreparation preparation, List<SuggestionContextSegment> segments, int summarizedThrough);
    default CallSuggestionResponse generateMetered(UUID userId, String summary, CallPreparation preparation, List<SuggestionContextSegment> segments, int summarizedThrough,
            java.util.function.Consumer<br.com.connectas.orientador.cost.ProviderUsage> onUsage) {
        return generate(userId, summary, preparation, segments, summarizedThrough);
    }
}
