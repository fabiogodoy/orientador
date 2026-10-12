package br.com.connectas.orientador.call;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CallTitleRequest(@NotBlank @Size(max = 160) String title, boolean automatic) {}
