package br.com.connectas.orientador.call;

import java.util.List;
import java.util.UUID;

interface CallSuggestionGenerator {
    CallSuggestionResponse generate(UUID userId, String summary, CallPreparation preparation, List<SuggestionContextSegment> segments, int summarizedThrough);
}
