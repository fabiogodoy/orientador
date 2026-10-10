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
                   t.type, t.name AS organization_name, t.trial_ends_at
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

    private static StoredAccount mapAccount(ResultSet rs, int row) throws SQLException {
        Identity identity = new Identity(
                rs.getObject("id", UUID.class),
                rs.getObject("tenant_id", UUID.class),
                rs.getString("name"),
                rs.getString("email"),
                Role.valueOf(rs.getString("role")),
                AccountType.valueOf(rs.getString("type")),
                rs.getString("organization_name"),
                rs.getTimestamp("trial_ends_at").toInstant());
        return new StoredAccount(identity, rs.getString("password_hash"));
    }

    public record StoredAccount(Identity identity, String passwordHash) {
    }
}
