package br.com.connectas.orientador.call;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
record CallSuggestionRequest(@Size(max = 12000) String contextSummary, @Min(0) @Max(1_000_000) int summarizedThrough) {}
