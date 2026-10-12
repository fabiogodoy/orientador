package br.com.connectas.orientador.account;

import java.time.Instant;
import java.util.UUID;

public record AccountResponse(UUID id, String name, String email, Role role,
                              AccountType accountType, String organizationName, Instant trialEndsAt, Instant avatarUpdatedAt) {
    public static AccountResponse from(Identity identity) {
        return new AccountResponse(identity.id(), identity.name(), identity.email(), identity.role(),
                identity.accountType(), identity.organizationName(), identity.trialEndsAt(), identity.avatarUpdatedAt());
    }
}
