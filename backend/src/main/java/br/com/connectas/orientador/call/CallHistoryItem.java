package br.com.connectas.orientador.call;

import java.time.Instant;
import java.util.UUID;

public record CallHistoryItem(UUID sessionId, String title, Instant startedAt, Instant endedAt,
                              long durationSeconds, UUID ownerId, String ownerName) {}
