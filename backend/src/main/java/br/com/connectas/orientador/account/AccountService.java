package br.com.connectas.orientador.account;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Locale;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AccountService {
    public static final String TERMS_VERSION = "2026-10-10";
    private static final Duration TRIAL_DURATION = Duration.ofDays(7);
    private static final Logger log = LoggerFactory.getLogger(AccountService.class);

    private final AccountRepository repository;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public AccountService(AccountRepository repository, PasswordEncoder passwordEncoder, Clock clock) {
        this.repository = repository;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Transactional
    public AccountResponse register(RegistrationRequest request) {
        String email = normalizeEmail(request.email());
        String name = request.name().trim();
        String organizationName = request.organizationName() == null ? null : request.organizationName().trim();
        validateRegistration(request, organizationName);
        if (repository.findByEmail(email).isPresent()) {
            throw new AccountConflictException();
        }

        Instant now = clock.instant();
        Instant trialEndsAt = now.plus(TRIAL_DURATION);
        UUID tenantId = UUID.randomUUID();
        UUID userId = UUID.randomUUID();
        Role role = request.accountType() == AccountType.ORGANIZATION
                ? Role.ORGANIZATION_MANAGER : Role.INDIVIDUAL;
        try {
            repository.createTenant(tenantId, request.accountType(), organizationName, now, trialEndsAt);
            repository.createUser(userId, tenantId, name, email,
                    passwordEncoder.encode(request.password()), role, now);
            repository.recordAcceptance(userId, TERMS_VERSION, now);
        } catch (DuplicateKeyException exception) {
            throw new AccountConflictException();
        }
        log.info("Account registered type={} tenantId={} userId={}", request.accountType(), tenantId, userId);
        return new AccountResponse(userId, name, email, role, request.accountType(), organizationName, trialEndsAt);
    }

    public Identity authenticate(LoginRequest request) {
        String email = normalizeEmail(request.email());
        AccountRepository.StoredAccount account = repository.findByEmail(email)
                .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), account.passwordHash())) {
            throw new InvalidCredentialsException();
        }
        if (account.identity().trialExpiredAt(clock.instant())) {
            log.warn("Trial access rejected userId={} tenantId={}", account.identity().id(), account.identity().tenantId());
            throw new TrialExpiredException();
        }
        return account.identity();
    }

    public Identity currentIdentity(UUID userId) {
        return repository.findIdentityById(userId).orElseThrow(InvalidCredentialsException::new);
    }

    public static String normalizeEmail(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }

    private static void validateRegistration(RegistrationRequest request, String organizationName) {
        if (!request.termsAccepted() || !TERMS_VERSION.equals(request.termsVersion())) {
            throw new InvalidRegistrationException("É necessário aceitar a versão atual dos Termos de Uso.");
        }
        if (request.accountType() == AccountType.ORGANIZATION) {
            if (organizationName == null || organizationName.isBlank() || organizationName.length() > 160) {
                throw new InvalidRegistrationException("Informe o nome da organização (até 160 caracteres).");
            }
        } else if (organizationName != null && !organizationName.isBlank()) {
            throw new InvalidRegistrationException("Uma conta individual não informa organização.");
        }
    }

    public static class InvalidRegistrationException extends RuntimeException {
        public InvalidRegistrationException(String message) { super(message); }
    }

    public static class AccountConflictException extends RuntimeException {
    }

    public static class InvalidCredentialsException extends RuntimeException {
    }

    public static class TrialExpiredException extends RuntimeException {
    }
}
