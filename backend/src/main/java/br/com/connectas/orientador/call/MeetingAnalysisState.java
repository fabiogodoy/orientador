package br.com.connectas.orientador.call;

public record MeetingAnalysisState(MeetingAnalysisStatus status, MeetingAnalysis analysis) {
    static MeetingAnalysisState absent() { return new MeetingAnalysisState(MeetingAnalysisStatus.ABSENT, null); }
}
