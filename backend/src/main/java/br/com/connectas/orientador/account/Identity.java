package br.com.connectas.orientador.account;

import java.time.Instant;
import java.util.UUID;

public record Identity(UUID id, UUID tenantId, String name, String email, Role role,
                       AccountType accountType, String organizationName, Instant trialEndsAt, Instant avatarUpdatedAt) {
    public boolean trialExpiredAt(Instant now) {
        return !now.isBefore(trialEndsAt);
    }
}
