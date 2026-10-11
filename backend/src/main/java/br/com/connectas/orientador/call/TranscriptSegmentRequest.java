package br.com.connectas.orientador.call;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TranscriptSegmentRequest(@Min(1) int sequenceNumber, @NotBlank @Size(max = 12000) String text, @NotNull TranscriptSpeaker speaker) {}
