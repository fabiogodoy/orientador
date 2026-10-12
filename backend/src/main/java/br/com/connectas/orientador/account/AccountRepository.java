package br.com.connectas.orientador.account;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
public class AccountRepository {
    private static final String SELECT_IDENTITY = """
            SELECT u.id, u.tenant_id, u.name, u.email, u.password_hash, u.role,
                   t.type, t.name AS organization_name, t.trial_ends_at, u.avatar_updated_at
            FROM users u JOIN tenants t ON t.id = u.tenant_id
            """;

    private final JdbcTemplate jdbc;

    public AccountRepository(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public Optional<StoredAccount> findByEmail(String email) {
        return jdbc.query(SELECT_IDENTITY + " WHERE u.email = ?", AccountRepository::mapAccount, email)
                .stream().findFirst();
    }

    public Optional<Identity> findIdentityById(UUID id) {
        return jdbc.query(SELECT_IDENTITY + " WHERE u.id = ?", (rs, row) -> mapAccount(rs, row).identity(), id)
                .stream().findFirst();
    }

    public void createTenant(UUID id, AccountType type, String name, Instant start, Instant end) {
        jdbc.update("INSERT INTO tenants (id, type, name, trial_started_at, trial_ends_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
                id, type.name(), name, Timestamp.from(start), Timestamp.from(end), Timestamp.from(start));
    }

    public void createUser(UUID id, UUID tenantId, String name, String email, String passwordHash,
                           Role role, Instant createdAt) {
        jdbc.update("INSERT INTO users (id, tenant_id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
                id, tenantId, name, email, passwordHash, role.name(), Timestamp.from(createdAt));
    }

    public void recordAcceptance(UUID userId, String version, Instant acceptedAt) {
        jdbc.update("INSERT INTO terms_acceptances (user_id, version, accepted_at) VALUES (?, ?, ?)",
                userId, version, Timestamp.from(acceptedAt));
    }

    public void updateName(UUID userId, String name) {
        jdbc.update("UPDATE users SET name = ? WHERE id = ?", name, userId);
    }

    public void updateAvatar(UUID userId, byte[] content, Instant updatedAt) {
        jdbc.update("UPDATE users SET avatar_content = ?, avatar_media_type = 'image/png', avatar_updated_at = ? WHERE id = ?",
                content, Timestamp.from(updatedAt), userId);
    }

    public void removeAvatar(UUID userId) {
        jdbc.update("UPDATE users SET avatar_content = NULL, avatar_media_type = NULL, avatar_updated_at = NULL WHERE id = ?", userId);
    }

    public StoredAvatar findAvatarByUserId(UUID userId) {
        return jdbc.query("SELECT avatar_content, avatar_media_type FROM users WHERE id = ? AND avatar_content IS NOT NULL",
                        (rs, row) -> new StoredAvatar(rs.getBytes("avatar_content"), rs.getString("avatar_media_type")), userId)
                .stream().findFirst().orElse(null);
    }

    private static StoredAccount mapAccount(ResultSet rs, int row) throws SQLException {
        Identity identity = new Identity(
                rs.getObject("id", UUID.class),
                rs.getObject("tenant_id", UUID.class),
                rs.getString("name"),
                rs.getString("email"),
                Role.valueOf(rs.getString("role")),
                AccountType.valueOf(rs.getString("type")),
                rs.getString("organization_name"),
                rs.getTimestamp("trial_ends_at").toInstant(),
                rs.getTimestamp("avatar_updated_at") == null ? null : rs.getTimestamp("avatar_updated_at").toInstant());
        return new StoredAccount(identity, rs.getString("password_hash"));
    }

    public record StoredAccount(Identity identity, String passwordHash) {
    }

    public record StoredAvatar(byte[] content, String mediaType) {
    }
}
