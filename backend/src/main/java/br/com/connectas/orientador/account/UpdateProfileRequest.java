package br.com.connectas.orientador.account;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "Informe seu nome.")
        @Size(max = 120, message = "O nome deve ter no máximo 120 caracteres.")
        String name) {
}
