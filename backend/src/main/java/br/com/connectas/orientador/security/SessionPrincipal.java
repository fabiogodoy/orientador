package br.com.connectas.orientador.security;

import java.io.Serializable;
import java.util.UUID;

public record SessionPrincipal(UUID userId) implements Serializable {
}
