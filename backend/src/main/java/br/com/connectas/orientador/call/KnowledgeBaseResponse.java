package br.com.connectas.orientador.call;

import java.time.Instant;
import java.util.UUID;

record KnowledgeBaseResponse(UUID id, String name, String content, UUID createdByUserId, Instant updatedAt) {}
