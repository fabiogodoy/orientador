package br.com.connectas.orientador.call;

import java.util.List;

public record MeetingAnalysis(String overview, List<String> decisions, List<String> nextSteps, List<String> risks,
                              List<String> keyPoints, List<String> participants, String temperature,
                              String temperatureReason) {}
