package br.com.connectas.orientador.call;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

record KnowledgeBaseRequest(@NotBlank @Size(max = 120) String name, @NotBlank @Size(max = 12000) String content) {}
