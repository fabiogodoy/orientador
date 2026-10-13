package br.com.connectas.orientador.call;

import java.util.UUID;

public record CallSessionResponse(UUID sessionId, String title) {}
