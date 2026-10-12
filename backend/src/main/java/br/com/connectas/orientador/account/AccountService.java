package br.com.connectas.orientador.account;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Locale;
import java.util.UUID;
import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;
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
    private static final long MAX_AVATAR_INPUT_BYTES = 10L * 1024 * 1024;
    private static final int MAX_AVATAR_DIMENSION = 4096;
    private static final long MAX_AVATAR_PIXELS = 16_000_000L;
    private static final int AVATAR_SIZE = 512;
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
        return new AccountResponse(userId, name, email, role, request.accountType(), organizationName, trialEndsAt, null);
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

    @Transactional
    public AccountResponse updateName(UUID userId, String rawName) {
        String name = rawName.trim();
        if (name.isBlank() || name.length() > 120) throw new InvalidProfileException("Informe seu nome com até 120 caracteres.");
        repository.updateName(userId, name);
        Identity identity = currentIdentity(userId);
        log.info("Profile name updated userId={} tenantId={}", identity.id(), identity.tenantId());
        return AccountResponse.from(identity);
    }

    @Transactional
    public AccountResponse updateAvatar(UUID userId, org.springframework.web.multipart.MultipartFile avatar) {
        byte[] normalized = normalizeAvatar(avatar);
        Instant updatedAt = clock.instant();
        repository.updateAvatar(userId, normalized, updatedAt);
        Identity identity = currentIdentity(userId);
        log.info("Profile avatar updated userId={} tenantId={}", identity.id(), identity.tenantId());
        return AccountResponse.from(identity);
    }

    public AccountRepository.StoredAvatar avatar(UUID userId) {
        return repository.findAvatarByUserId(userId);
    }

    @Transactional
    public AccountResponse removeAvatar(UUID userId) {
        repository.removeAvatar(userId);
        Identity identity = currentIdentity(userId);
        log.info("Profile avatar removed userId={} tenantId={}", identity.id(), identity.tenantId());
        return AccountResponse.from(identity);
    }

    private static byte[] normalizeAvatar(org.springframework.web.multipart.MultipartFile avatar) {
        if (avatar == null || avatar.isEmpty()) throw new InvalidProfileException("Escolha uma foto para continuar.");
        if (avatar.getSize() > MAX_AVATAR_INPUT_BYTES) throw new InvalidProfileException("A foto deve ter até 10 MB.");
        try {
            byte[] source = avatar.getBytes();
            BufferedImage image = readPng(source);
            int side = Math.min(image.getWidth(), image.getHeight());
            int sourceX = (image.getWidth() - side) / 2;
            int sourceY = (image.getHeight() - side) / 2;
            BufferedImage output = new BufferedImage(AVATAR_SIZE, AVATAR_SIZE, BufferedImage.TYPE_INT_ARGB);
            Graphics2D graphics = output.createGraphics();
            try {
                graphics.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
                graphics.drawImage(image, 0, 0, AVATAR_SIZE, AVATAR_SIZE, sourceX, sourceY, sourceX + side, sourceY + side, null);
            } finally {
                graphics.dispose();
            }
            ByteArrayOutputStream encoded = new ByteArrayOutputStream();
            if (!ImageIO.write(output, "png", encoded) || encoded.size() > 2 * 1024 * 1024) {
                throw new InvalidProfileException("Não foi possível preparar esta foto.");
            }
            return encoded.toByteArray();
        } catch (IOException exception) {
            throw new InvalidProfileException("A foto enviada não é um PNG válido.");
        }
    }

    private static BufferedImage readPng(byte[] source) throws IOException {
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(source))) {
            java.util.Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) throw new InvalidProfileException("A foto enviada não é um PNG válido.");
            ImageReader reader = readers.next();
            try {
                if (!"png".equalsIgnoreCase(reader.getFormatName())) throw new InvalidProfileException("A foto enviada não é um PNG válido.");
                reader.setInput(input, true, true);
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);
                if (width < 1 || height < 1 || width > MAX_AVATAR_DIMENSION || height > MAX_AVATAR_DIMENSION
                        || (long) width * height > MAX_AVATAR_PIXELS) {
                    throw new InvalidProfileException("A foto tem dimensões maiores que o permitido.");
                }
                BufferedImage image = reader.read(0);
                if (image == null) throw new InvalidProfileException("A foto enviada não é um PNG válido.");
                return image;
            } finally {
                reader.dispose();
            }
        }
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

    public static class InvalidProfileException extends RuntimeException {
        public InvalidProfileException(String message) { super(message); }
    }

    public static class AccountConflictException extends RuntimeException {
    }

    public static class InvalidCredentialsException extends RuntimeException {
    }

    public static class TrialExpiredException extends RuntimeException {
    }
}
