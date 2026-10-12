package br.com.connectas.orientador.call;

import java.time.Instant;

public record TranscriptHistorySegment(int sequenceNumber, TranscriptSpeaker speaker, String text, Instant finalizedAt) {}
