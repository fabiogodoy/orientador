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
import java.nio.charset.StandardCharsets;
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
    private static final Pattern ID = Pattern.compile("\"id\":\"([^\"]+)\"");

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
        HttpRequest titlePreflight = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/calls/00000000-0000-0000-0000-000000000000/title"))
                .header("Origin", "http://localhost:5173")
                .header("Access-Control-Request-Method", "PATCH")
                .method("OPTIONS", HttpRequest.BodyPublishers.noBody()).build();
        assertEquals("http://localhost:5173", client.send(allowed, HttpResponse.BodyHandlers.ofString())
                .headers().firstValue("Access-Control-Allow-Origin").orElse(null));
        assertTrue(client.send(foreign, HttpResponse.BodyHandlers.ofString())
                .headers().firstValue("Access-Control-Allow-Origin").isEmpty());
        assertTrue(client.send(titlePreflight, HttpResponse.BodyHandlers.ofString())
                .headers().firstValue("Access-Control-Allow-Methods").orElse("").contains("PATCH"));
    }

    @Test
    void authenticatedUserCanUpdateAndRemoveOnlyTheirProfileData() throws Exception {
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE version='05'", Integer.class));
        String email = uniqueEmail();
        register(email, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        assertEquals(200, post("/api/auth/login", loginJson(email)).statusCode());

        HttpResponse<String> renamed = patch("/api/profile", "{\"name\":\" Pessoa Renomeada \"}");
        assertEquals(200, renamed.statusCode(), renamed.body());
        assertTrue(renamed.body().contains("Pessoa Renomeada"));
        assertEquals("Pessoa Renomeada", jdbc.queryForObject("SELECT name FROM users WHERE email=?", String.class, email));
        assertEquals(400, patch("/api/profile", "{\"name\":\" \"}").statusCode());

        java.awt.image.BufferedImage sourceAvatar = new java.awt.image.BufferedImage(1, 1, java.awt.image.BufferedImage.TYPE_INT_ARGB);
        java.io.ByteArrayOutputStream encodedAvatar = new java.io.ByteArrayOutputStream();
        javax.imageio.ImageIO.write(sourceAvatar, "png", encodedAvatar);
        byte[] png = encodedAvatar.toByteArray();
        HttpResponse<String> uploaded = uploadAvatar(png);
        assertEquals(200, uploaded.statusCode(), uploaded.body());
        assertTrue(uploaded.body().contains("avatarUpdatedAt"));
        HttpResponse<byte[]> avatar = client.send(HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/profile/avatar"))
                .GET().build(), HttpResponse.BodyHandlers.ofByteArray());
        assertEquals(200, avatar.statusCode());
        assertEquals("image/png", avatar.headers().firstValue("Content-Type").orElse(null));
        java.awt.image.BufferedImage decodedAvatar = javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(avatar.body()));
        assertEquals(512, decodedAvatar.getWidth());
        assertEquals(512, decodedAvatar.getHeight());
        assertEquals(200, delete("/api/profile/avatar").statusCode());
        assertEquals(404, send("GET", "/api/profile/avatar", null, null).statusCode());
    }

    @Test
    void finalizedTranscriptIsPersistedForTheAuthenticatedCallOnly() throws Exception {
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE version='02'", Integer.class));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE version='03'", Integer.class));
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE version='04'", Integer.class));
        String ownerEmail = uniqueEmail();
        String otherEmail = uniqueEmail();
        register(ownerEmail, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        register(otherEmail, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        assertEquals(200, post("/api/auth/login", loginJson(ownerEmail)).statusCode());
        UUID ownerId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, ownerEmail);
        UUID tenantId = jdbc.queryForObject("SELECT tenant_id FROM users WHERE email=?", UUID.class, ownerEmail);
        UUID otherId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, otherEmail);
        UUID otherTenantId = jdbc.queryForObject("SELECT tenant_id FROM users WHERE email=?", UUID.class, otherEmail);
        UUID callId = UUID.randomUUID();
        jdbc.update("INSERT INTO call_sessions (id, tenant_id, user_id, status, started_at) VALUES (?, ?, ?, 'ACTIVE', ?)", callId, tenantId, ownerId, Timestamp.from(START));
        UUID otherCallId = UUID.randomUUID();
        jdbc.update("INSERT INTO call_sessions (id, tenant_id, user_id, status, started_at) VALUES (?, ?, ?, 'ACTIVE', ?)", otherCallId, otherTenantId, otherId, Timestamp.from(START));

        assertEquals("Reunião sem título", jdbc.queryForObject("SELECT title FROM call_sessions WHERE id=?", String.class, callId));
        assertEquals(400, patch("/api/calls/" + callId + "/title", "{\"title\":\" \",\"automatic\":false}").statusCode());
        HttpResponse<String> titled = patch("/api/calls/" + callId + "/title", "{\"title\":\" Discovery do trimestre \",\"automatic\":false}");
        assertEquals(200, titled.statusCode(), titled.body());
        assertTrue(titled.body().contains("Discovery do trimestre"));
        assertEquals("Discovery do trimestre", jdbc.queryForObject("SELECT title FROM call_sessions WHERE id=?", String.class, callId));
        assertEquals(200, patch("/api/calls/" + callId + "/title", "{\"title\":\"Outra aba\",\"automatic\":true}").statusCode());
        assertEquals("Discovery do trimestre", jdbc.queryForObject("SELECT title FROM call_sessions WHERE id=?", String.class, callId));
        assertEquals(404, patch("/api/calls/" + otherCallId + "/title", "{\"title\":\"Tentativa externa\",\"automatic\":false}").statusCode());

        assertEquals(400, post("/api/calls/" + callId + "/segments", "{\"sequenceNumber\":1,\"text\":\"Fala inválida.\",\"speaker\":\"BOT\"}").statusCode());
        HttpResponse<String> persisted = post("/api/calls/" + callId + "/segments", "{\"sequenceNumber\":1,\"text\":\" Trecho final da conversa. \",\"speaker\":\"CLIENT\"}");
        assertEquals(204, persisted.statusCode(), persisted.body());
        assertEquals("Trecho final da conversa.", jdbc.queryForObject("SELECT text FROM transcript_segments WHERE call_session_id=?", String.class, callId));
        assertEquals("CLIENT", jdbc.queryForObject("SELECT speaker FROM transcript_segments WHERE call_session_id=?", String.class, callId));
        assertEquals(204, post("/api/calls/" + callId + "/end", "{}").statusCode());
        assertEquals("ENDED", jdbc.queryForObject("SELECT status FROM call_sessions WHERE id=?", String.class, callId));
        assertEquals(200, patch("/api/calls/" + callId + "/title", "{\"title\":\"Discovery final\",\"automatic\":false}").statusCode());
        assertEquals("Discovery final", jdbc.queryForObject("SELECT title FROM call_sessions WHERE id=?", String.class, callId));
        assertEquals(404, post("/api/calls/" + callId + "/segments", "{\"sequenceNumber\":2,\"text\":\"Não deve entrar.\",\"speaker\":\"USER\"}").statusCode());
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM transcript_segments WHERE call_session_id=?", Integer.class, callId));
    }

    @Test
    void knowledgeBasesArePaginatedSearchableAndLogicallyDeletedWithActor() throws Exception {
        String email = uniqueEmail();
        register(email, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        UUID userId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, email);
        assertEquals(200, post("/api/auth/login", loginJson(email)).statusCode());

        HttpResponse<String> first = post("/api/knowledge-bases", "{\"name\":\"Produtos estratégicos\",\"content\":\"Tabela comercial aprovada.\"}");
        assertEquals(201, first.statusCode(), first.body());
        UUID firstId = UUID.fromString(extract(ID, first.body()));
        for (int index = 0; index < 20; index++) {
            assertEquals(201, post("/api/knowledge-bases", "{\"name\":\"Base paginada " + index + "\",\"content\":\"Conteúdo " + index + "\"}").statusCode());
        }

        String firstPage = send("GET", "/api/knowledge-bases?page=0", null, null).body();
        assertEquals(20, firstPage.split("\\\"id\\\"", -1).length - 1);
        String secondPage = send("GET", "/api/knowledge-bases?page=1", null, null).body();
        assertTrue(secondPage.contains("\"page\":1"));
        assertEquals(1, secondPage.split("\\\"id\\\"", -1).length - 1);
        assertTrue(send("GET", "/api/knowledge-bases?page=0&query=estrat", null, null).body().contains("Produtos estratégicos"));

        assertEquals(204, delete("/api/knowledge-bases/" + firstId).statusCode());
        assertEquals(userId, jdbc.queryForObject("SELECT deleted_by_user_id FROM knowledge_bases WHERE id=?", UUID.class, firstId));
        assertTrue(jdbc.queryForObject("SELECT deleted_at IS NOT NULL FROM knowledge_bases WHERE id=?", Boolean.class, firstId));
        assertFalse(send("GET", "/api/knowledge-bases?page=0&query=estrat", null, null).body().contains("Produtos estratégicos"));
        assertFalse(send("GET", "/api/knowledge-bases/options?query=estrat", null, null).body().contains("Produtos estratégicos"));
        assertEquals(404, delete("/api/knowledge-bases/" + firstId).statusCode());
        assertEquals(404, send("POST", "/api/calls", "{\"knowledgeBaseId\":\"" + firstId + "\"}", token).statusCode());
    }

    @Test
    void historyShowsOnlyEndedCallsWithinTheAuthorizedScope() throws Exception {
        assertEquals(1, jdbc.queryForObject("SELECT count(*) FROM flyway_schema_history WHERE version='06'", Integer.class));
        String managerEmail = uniqueEmail();
        String outsiderEmail = uniqueEmail();
        register(managerEmail, "ORGANIZATION", "Equipe Aurora", true, AccountService.TERMS_VERSION);
        register(outsiderEmail, "INDIVIDUAL", null, true, AccountService.TERMS_VERSION);
        UUID managerId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, managerEmail);
        UUID organizationTenant = jdbc.queryForObject("SELECT tenant_id FROM users WHERE email=?", UUID.class, managerEmail);
        UUID outsiderId = jdbc.queryForObject("SELECT id FROM users WHERE email=?", UUID.class, outsiderEmail);
        UUID outsiderTenant = jdbc.queryForObject("SELECT tenant_id FROM users WHERE email=?", UUID.class, outsiderEmail);
        UUID memberId = UUID.randomUUID();
        jdbc.update("INSERT INTO users (id, tenant_id, name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, 'ORGANIZATION_MEMBER', ?)", memberId, organizationTenant, "Membro Aurora", uniqueEmail(), "{bcrypt}unused", Timestamp.from(START));
        UUID managerCall = endedCall(managerId, organizationTenant, "Reunião do gestor", START.plusSeconds(60));
        UUID memberCall = endedCall(memberId, organizationTenant, "Reunião do membro", START.plusSeconds(120));
        UUID outsiderCall = endedCall(outsiderId, outsiderTenant, "Reunião externa", START.plusSeconds(180));
        jdbc.update("INSERT INTO call_sessions (id, tenant_id, user_id, title, status, started_at) VALUES (?, ?, ?, ?, 'ACTIVE', ?)", UUID.randomUUID(), organizationTenant, managerId, "Call ativa", Timestamp.from(START));
        jdbc.update("INSERT INTO transcript_segments (id, call_session_id, tenant_id, sequence_number, text, speaker, finalized_at, created_at) VALUES (?, ?, ?, 1, 'Trecho autorizado', 'CLIENT', ?, ?)", UUID.randomUUID(), memberCall, organizationTenant, Timestamp.from(START), Timestamp.from(START));

        assertEquals(200, post("/api/auth/login", loginJson(managerEmail)).statusCode());
        String managerHistory = send("GET", "/api/calls?page=0", null, null).body();
        assertTrue(managerHistory.contains("Reunião do gestor"));
        assertTrue(managerHistory.contains("Reunião do membro"));
        assertFalse(managerHistory.contains("Reunião externa"));
        assertFalse(managerHistory.contains("Call ativa"));
        assertEquals(200, send("GET", "/api/calls/" + memberCall, null, null).statusCode());
        assertEquals(404, send("GET", "/api/calls/" + outsiderCall, null, null).statusCode());

        for (int index = 0; index < 19; index++) {
            endedCall(managerId, organizationTenant, "Reunião paginada " + index, START.plusSeconds(300L + index));
        }
        String firstPage = send("GET", "/api/calls?page=0", null, null).body();
        assertEquals(20, firstPage.split("\\\"sessionId\\\"", -1).length - 1);
        assertTrue(send("GET", "/api/calls?page=1", null, null).body().contains("Reunião do gestor"));

        jdbc.update("UPDATE users SET role='PLATFORM_ADMIN' WHERE id=?", managerId);
        assertTrue(send("GET", "/api/calls?page=0", null, null).body().contains("Reunião externa"));
        assertEquals(200, send("GET", "/api/calls/" + outsiderCall, null, null).statusCode());
        assertFalse(send("GET", "/api/calls/" + managerCall, null, null).body().contains("Trecho autorizado"));
    }

    private UUID endedCall(UUID userId, UUID tenantId, String title, Instant startedAt) {
        UUID callId = UUID.randomUUID();
        jdbc.update("INSERT INTO call_sessions (id, tenant_id, user_id, title, status, started_at, ended_at) VALUES (?, ?, ?, ?, 'ENDED', ?, ?)", callId, tenantId, userId, title, Timestamp.from(startedAt), Timestamp.from(startedAt.plusSeconds(600)));
        return callId;
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

    private HttpResponse<String> patch(String path, String body) throws Exception {
        return send("PATCH", path, body, token);
    }

    private HttpResponse<String> delete(String path) throws Exception {
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .header("X-CSRF-TOKEN", token).DELETE().build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> uploadAvatar(byte[] png) throws Exception {
        String boundary = "profile-test-boundary";
        byte[] prefix = ("--" + boundary + "\r\nContent-Disposition: form-data; name=\"avatar\"; filename=\"avatar.png\"\r\n"
                + "Content-Type: image/png\r\n\r\n").getBytes(StandardCharsets.UTF_8);
        byte[] suffix = ("\r\n--" + boundary + "--\r\n").getBytes(StandardCharsets.UTF_8);
        byte[] body = new byte[prefix.length + png.length + suffix.length];
        System.arraycopy(prefix, 0, body, 0, prefix.length);
        System.arraycopy(png, 0, body, prefix.length, png.length);
        System.arraycopy(suffix, 0, body, prefix.length + png.length, suffix.length);
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + "/api/profile/avatar"))
                .header("X-CSRF-TOKEN", token).header("Content-Type", "multipart/form-data; boundary=" + boundary)
                .PUT(HttpRequest.BodyPublishers.ofByteArray(body)).build();
        return client.send(request, HttpResponse.BodyHandlers.ofString());
    }

    private HttpResponse<String> send(String method, String path, String body, String csrf) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path));
        if (csrf != null) request.header("X-CSRF-TOKEN", csrf);
        if (method.equals("POST") || method.equals("PATCH")) request.header("Content-Type", "application/json").method(method, HttpRequest.BodyPublishers.ofString(body));
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
