package br.com.connectas.orientador.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;

import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;

class AccountServiceTest {
    @Test
    void emailIsNormalizedWithoutChangingDomainIdentity() {
        assertEquals("person@example.com", AccountService.normalizeEmail("  Person@Example.COM "));
    }

    @Test
    void trialExpiresAtExclusiveBoundary() {
        Instant end = Instant.parse("2026-10-17T10:00:00Z");
        Identity identity = new Identity(UUID.randomUUID(), UUID.randomUUID(), "Pessoa", "a@example.com",
                Role.INDIVIDUAL, AccountType.INDIVIDUAL, null, end);
        assertFalse(identity.trialExpiredAt(end.minusNanos(1)));
        assertTrue(identity.trialExpiredAt(end));
    }

    @Test
    void currentTermsMustBeAccepted() {
        AccountService service = new AccountService(mock(AccountRepository.class),
                PasswordEncoderFactories.createDelegatingPasswordEncoder(), java.time.Clock.systemUTC());
        RegistrationRequest request = new RegistrationRequest("Pessoa", "a@example.com", "senha-com-12-caracteres",
                AccountType.INDIVIDUAL, null, false, AccountService.TERMS_VERSION);
        assertThrows(AccountService.InvalidRegistrationException.class, () -> service.register(request));
    }
}
