package br.com.connectas.orientador.call;

import java.util.List;
import java.util.UUID;

interface MeetingAnalysisGenerator {
    MeetingAnalysis generate(UUID userId, List<SuggestionContextSegment> segments);
}
