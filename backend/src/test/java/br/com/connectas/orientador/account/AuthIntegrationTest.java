package br.com.connectas.orientador.account;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.net.CookieManager;
import java.net.CookiePolicy;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.sql.Timestamp;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicReference;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(AuthIntegrationTest.TestClockConfig.class)
class AuthIntegrationTest {
    private static final Instant START = Instant.parse("2026-10-10T10:00:00Z");
    private static final Pattern TOKEN = Pattern.compile("\"token\":\"([^\"]+)\"");

    @Container
    static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");

    @DynamicPropertySource
    static void database(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("server.servlet.session.cookie.secure", () -> false);
    }

    @LocalServerPort
    int port;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MutableClock clock;

    HttpClient client;
    String token;

    @BeforeEach
    void setup() throws Exception {
        clock.set(START);
        CookieManager cookies = new CookieManager(null, CookiePolicy.ACCEPT_ALL);
        client = HttpClient.newBuilder().cookieHandler(cookies).build();
        token = extract(TOKEN, send("GET", "/api/auth/csrf", null, null).body());
        assertTrue(postgres.getJdbcUrl().contains("localhost") || postgres.getJdbcUrl().contains("127.0.0.1"));
        assertFalse(postgres.getJdbcUrl().contains("desenv_orientador"));
    }

    @AfterEach
    void resetClock() {
        clock.set(START);
    }

    @Test
    void individualRegistrationPersistsAcceptanceAndHashAndPreventsDuplicates() throws Exception {
        String email = uniqueEmail();
        HttpResponse<String> created = register(email, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        assertEquals(201, created.statusCode(), created.body());
        assertTrue(created.body().contains("\"role\":\"INDIVIDUAL\""));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM users WHERE email = ?", Integer.class, email));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM terms_acceptances a JOIN users u ON u.id=a.user_id WHERE u.email=? AND a.version=?", Integer.class, email, AccountService.TERMS_VERSION));
        assertTrue(jdbc.queryForObject("SELECT password_hash FROM users WHERE email=?", String.class, email).startsWith("{bcrypt}"));
        assertEquals(START.plusSeconds(7L * 24 * 60 * 60), jdbc.queryForObject(
                "SELECT t.trial_ends_at FROM tenants t JOIN users u ON u.tenant_id=t.id WHERE u.email=?",
                java.time.OffsetDateTime.class, email).toInstant());
        int tenants = jdbc.queryForObject("SELECT count(*) FROM tenants", Integer.class);
        assertEquals(409, register(email, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION).statusCode());
        assertEquals(tenants, jdbc.queryForObject("SELECT count(*) FROM tenants", Integer.class));
    }

    @Test
    void organizationGetsSeparateTenantAndOnlyOneManager() throws Exception {
        String individual = uniqueEmail();
        String manager = uniqueEmail();
        assertEquals(201, register(individual, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION).statusCode());
        HttpResponse<String> created = register(manager, "ORGANIZATION", "Equipe Aurora", true, AccountService.TERMS_VERSION);
        assertEquals(201, created.statusCode());
        assertTrue(created.body().contains("\"role\":\"ORGANIZATION_MANAGER\""));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM users WHERE email=? AND role='ORGANIZATION_MANAGER'", Integer.class, manager));
        UUID individualTenant = jdbc.queryForObject("SELECT tenant_id FROM users WHERE email=?", UUID.class, individual);
        UUID organizationTenant = jdbc.queryForObject("SELECT tenant_id FROM users WHERE email=?", UUID.class, manager);
        assertNotEquals(individualTenant, organizationTenant);
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM users WHERE tenant_id=?", Integer.class, organizationTenant));
    }

    @Test
    void termsAndAdministrativePayloadAreRejected() throws Exception {
        String email = uniqueEmail();
        assertEquals(400, register(email, "INDIVIDUAL", null, false, AccountService.TERMS_VERSION).statusCode());
        assertEquals(400, register(email, "INDIVIDUAL", null, true, "old-version").statusCode());
        assertEquals(400, post("/api/auth/register", registrationJson(email, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION)
                .replace("\"termsVersion\"", "\"role\":\"PLATFORM_ADMIN\",\"termsVersion\"")).statusCode());
        assertEquals(0, jdbc.queryForObject("SELECT count(*) FROM users WHERE email=?", Integer.class, email));
    }

    @Test
    void loginRequiresPasswordAndCsrfAndLogoutInvalidatesSession() throws Exception {
        String email = uniqueEmail();
        register(email, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        assertNotEquals(200, send("POST", "/api/auth/login", loginJson(email), "bad-token").statusCode());
        assertEquals(401, post("/api/auth/login", "{\"email\":\"" + email + "\",\"password\":\"wrong\"}").statusCode());
        assertEquals(200, post("/api/auth/login", loginJson(email)).statusCode());
        HttpResponse<String> me = send("GET", "/api/auth/me", null, null);
        assertEquals(200, me.statusCode());
        assertTrue(me.body().contains(email));
        assertEquals(204, post("/api/auth/logout", "{}").statusCode());
        assertEquals(401, send("GET", "/api/auth/me", null, null).statusCode());
    }

    @Test
    void expiredTrialBlocksOldSessionAndNewLogin() throws Exception {
        String email = uniqueEmail();
        register(email, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        assertEquals(200, post("/api/auth/login", loginJson(email)).statusCode());
        clock.set(START.plusSeconds(7L * 24 * 60 * 60));
        HttpResponse<String> oldSession = send("GET", "/api/auth/me", null, null);
        assertEquals(403, oldSession.statusCode());
        assertTrue(oldSession.body().contains("TRIAL_EXPIRED"));
        token = extract(TOKEN, send("GET", "/api/auth/csrf", null, null).body());
        assertEquals(403, post("/api/auth/login", loginJson(email)).statusCode());
    }

    @Test
    void corsAllowsOnlyConfiguredFrontend() throws Exception {
        HttpRequest allowed = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/csrf"))
                .header("Origin", "http://localhost:5173").GET().build();
        HttpRequest foreign = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/auth/csrf"))
                .header("Origin", "https://foreign.example").GET().build();
        assertEquals("http://localhost:5173", client.send(allowed, HttpResponse.BodyHandlers.ofString())
                .headers().firstValue("Access-Control-Allow-Origin").orElse(null));
        assertTrue(client.send(foreign, HttpResponse.BodyHandlers.ofString())
                .headers().firstValue("Access-Control-Allow-Origin").isEmpty());
    }

    @Test
    void finalizedTranscriptIsPersistedForTheAuthenticatedCallOnly() throws Exception {
        String ownerEmail = uniqueEmail();
        register(ownerEmail, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        assertEquals(200, post("/api/auth/login", loginJson(ownerEmail)).statusCode());
        UUID ownerId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, ownerEmail);
        UUID tenantId = jdbc.queryForObject("SELECT tenant_id FROM users WHERE email=?", UUID.class, ownerEmail);
        UUID callId = UUID.randomUUID();
        jdbc.update("INSERT INTO call_sessions (id, tenant_id, user_id, status, started_at) VALUES (?, ?, ?, 'ACTIVE', ?)", callId, tenantId, ownerId, Timestamp.from(START));

        HttpResponse<String> persisted = post("/api/calls/" + callId + "/segments", "{\"sequenceNumber\":1,\"text\":\" Trecho final da conversa. \"}");
        assertEquals(204, persisted.statusCode(), persisted.body());
        assertEquals("Trecho final da conversa.", jdbc.queryForObject("SELECT text FROM transcript_segments WHERE call_session_id=?", String.class, callId));
        assertEquals(204, post("/api/calls/" + callId + "/end", "{}").statusCode());
        assertEquals("ENDED", jdbc.queryForObject("SELECT status FROM call_sessions WHERE id=?", String.class, callId));
        assertEquals(404, post("/api/calls/" + callId + "/segments", "{\"sequenceNumber\":2,\"text\":\"Não deve entrar.\"}").statusCode());
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM transcript_segments WHERE call_session_id=?", Integer.class, callId));
    }

    private HttpResponse<String> register(String email, String type, String organization, boolean accepted, String version) throws Exception {
        return post("/api/auth/register", registrationJson(email, type, organization, accepted, version));
    }

    private static String registrationJson(String email, String type, String organization, boolean accepted, String version) {
        String organizationJson = organization == null ? "null" : "\"" + organization + "\"";
        return "{\"name\":\"Pessoa Teste\",\"email\":\"" + email + "\",\"password\":\"senha-segura-123\",\"accountType\":\"" + type
                + "\",\"organizationName\":" + organizationJson + ",\"termsAccepted\":" + accepted + ",\"termsVersion\":\"" + version + "\"}";
    }

    private static String loginJson(String email) {
        return "{\"email\":\"" + email + "\",\"password\":\"senha-segura-123\"}";
    }

    private String uniqueEmail() {
        return UUID.randomUUID() + "@example.com";
    }

    private HttpResponse<String> post(String path, String body) throws Exception {
        return send("POST", path, body, token);
    }

    private HttpResponse<String> send(String method, String path, String body, String csrf) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (csrf != null) request.header("X-CSRF-TOKEN", csrf);
        if (method.equals("POST")) request.header("Content-Type", "application/json").POST(HttpRequest.BodyPublishers.ofString(body));
        else request.GET();
        return client.send(request.build(), HttpResponse.BodyHandlers.ofString());
    }

    private static String extract(Pattern pattern, String input) {
        Matcher matcher = pattern.matcher(input);
        assertTrue(matcher.find(), "CSRF token missing: " + input);
        return matcher.group(1);
    }

    @TestConfiguration
    static class TestClockConfig {
        @Bean @Primary
        MutableClock mutableClock() {
            return new MutableClock();
        }
    }

    static class MutableClock extends Clock {
        private final AtomicReference<Instant> now = new AtomicReference<>(START);
        void set(Instant instant) { now.set(instant); }
        @Override public ZoneId getZone() { return ZoneId.of("UTC"); }
        @Override public Clock withZone(ZoneId zone) { return this; }
        @Override public Instant instant() { return now.get(); }
    }
}
