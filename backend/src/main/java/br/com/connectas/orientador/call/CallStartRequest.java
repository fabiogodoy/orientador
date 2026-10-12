package br.com.connectas.orientador.call;

import jakarta.validation.constraints.Size;

public record CallStartRequest(@Size(max = 160) String title) {}
