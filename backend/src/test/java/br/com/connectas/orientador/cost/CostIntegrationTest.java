package br.com.connectas.orientador.cost;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;
import br.com.connectas.orientador.account.*;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.*;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;

@Testcontainers
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Import(CostIntegrationTest.TimeConfig.class)
class CostIntegrationTest {
    static final Instant NOW = Instant.parse("2026-10-15T15:00:00Z");
    @Container static final PostgreSQLContainer postgres = new PostgreSQLContainer("postgres:16-alpine");
    @DynamicPropertySource static void database(DynamicPropertyRegistry r) {
        r.add("spring.datasource.url",postgres::getJdbcUrl); r.add("spring.datasource.username",postgres::getUsername); r.add("spring.datasource.password",postgres::getPassword);
        r.add("server.servlet.session.cookie.secure", () -> false);
    }
    @Autowired JdbcTemplate jdbc;
    @Autowired CostService costs;
    @Autowired UsageCostRecorder recorder;
    @Autowired AccountService accounts;
    @Autowired ExchangeRateService rates;
    @MockitoBean PtaxClient ptax;
    @LocalServerPort int port;
    @BeforeEach void reset() {
        assertFalse(postgres.getJdbcUrl().contains("desenv_orientador"));
        assertTrue(postgres.isRunning());
        jdbc.execute("truncate tenants cascade"); jdbc.execute("truncate cost_exchange_rate");
    }
    @Test void isolatesMemberManagerAndAdministratorAndPersistsUnknownAttempts() {
        UUID tenant = tenant(), other = tenant();
        UUID member = user(tenant, Role.ORGANIZATION_MEMBER), colleague = user(tenant, Role.ORGANIZATION_MEMBER);
        UUID manager = user(tenant, Role.ORGANIZATION_MANAGER), outsider = user(other, Role.INDIVIDUAL), admin = user(other, Role.PLATFORM_ADMIN);
        UUID own = call(member,tenant,true,NOW.minusSeconds(600),NOW);
        UUID peer = call(colleague,tenant,true,NOW.minusSeconds(600),NOW);
        UUID foreign = call(outsider,other,true,NOW.minusSeconds(600),NOW);
        record(member,own,"TRANSCRIPTION","0.01"); record(colleague,peer,"SUGGESTION","0.02"); record(outsider,foreign,"TRANSCRIPTION","0.04");
        UUID pending = recorder.begin(accounts.currentIdentity(member),own,"SUGGESTION");
        assertNull(jdbc.queryForObject("select cost_usd from usage_costs where id=?",BigDecimal.class,pending));
        var ownReport = costs.report(member,"TODAY",0,null);
        assertEquals(1,ownReport.calls().count()); assertEquals(1,ownReport.totals().unknownOperations());
        assertEquals(0,ownReport.totals().transcriptionUsd().compareTo(new BigDecimal("0.01")));
        assertEquals(2,costs.report(manager,"TODAY",0,null).calls().count());
        var global = costs.report(admin,"TODAY",0,null); assertEquals(3,global.calls().count());
        assertEquals("PLATFORM",global.scope());
        assertThrows(org.springframework.dao.DataIntegrityViolationException.class, () -> recorder.begin(accounts.currentIdentity(outsider),own,"TRANSCRIPTION"));
    }
    @Test void respectsSaoPauloMidnightAndSeparatesOldUnknownFromMeasuredZero() {
        UUID tenant=tenant(), user=user(tenant,Role.INDIVIDUAL);
        UUID old = call(user,tenant,false,Instant.parse("2026-10-14T23:00:00Z"),NOW);
        UUID known = call(user,tenant,true,NOW.minusSeconds(300),NOW);
        // Ending exactly at the next period boundary does not overlap that period.
        call(user,tenant,false,Instant.parse("2026-10-15T02:00:00Z"),Instant.parse("2026-10-15T03:00:00Z"));
        UUID event = record(user,old,"TRANSCRIPTION","0.01");
        jdbc.update("update usage_costs set occurred_at=? where id=?",Timestamp.from(Instant.parse("2026-10-15T02:59:59Z")),event);
        var report=costs.report(user,"TODAY",0,null);
        assertEquals(2,report.calls().count());
        assertEquals(0,report.totals().transcriptionUsd().signum()); assertEquals(1,report.calls().legacyCount());
        assertEquals(43500,report.calls().durationSeconds());
        assertTrue(report.recentCalls().stream().filter(c -> c.sessionId().equals(old)).findFirst().orElseThrow().partial());
        assertNull(report.recentCalls().stream().filter(c -> c.sessionId().equals(old)).findFirst().orElseThrow().transcriptionUsd());
        assertEquals(BigDecimal.ZERO,report.recentCalls().stream().filter(c -> c.sessionId().equals(known)).findFirst().orElseThrow().transcriptionUsd());
        assertEquals(7,costs.report(user,"WEEK",0,null).days().size());
        assertEquals(0,costs.report(user,"WEEK",0,null).totals().transcriptionUsd().compareTo(new BigDecimal("0.01")));
    }
    @Test void paginatesCallsAndIncludesActiveDurationOnlyUntilNow() {
        UUID tenant=tenant(), user=user(tenant,Role.INDIVIDUAL);
        for(int i=0;i<21;i++) call(user,tenant,true,NOW.minusSeconds(100+i),null);
        var first=costs.report(user,"TODAY",0,null);var second=costs.report(user,"TODAY",1,null);
        assertEquals(21,first.calls().count()); assertEquals(20,first.recentCalls().size());assertEquals(1,second.recentCalls().size());
        assertEquals(100,first.recentCalls().getFirst().durationSeconds());
        assertEquals("ACTIVE",first.recentCalls().getFirst().status());
        assertThrows(Exception.class, () -> costs.report(user,"INVALID",0,null));
        assertThrows(Exception.class, () -> costs.report(user,"TODAY",-1,null));
    }
    @Test void aggregatesLedgerConsistentlyAndReusesExchangeRateWithoutNetwork() throws Exception {
        UUID tenant=tenant(), user=user(tenant,Role.INDIVIDUAL);
        UUID call=call(user,tenant,true,NOW.minusSeconds(600),NOW);
        record(user,call,"TRANSCRIPTION","0.002");record(user,call,"SUGGESTION","0.003");
        when(ptax.latest(any())).thenReturn(new PtaxClient.Quote(new BigDecimal("5.04"),LocalDate.of(2026,10,14)));
        var rate=rates.current(); assertEquals(new BigDecimal("5.04"),rate.usdBrl());
        assertFalse(rates.current().fallback());verify(ptax,times(1)).latest(any());
        var report=costs.report(user,"WEEK",0,rate);
        assertEquals(0,report.totals().transcriptionUsd().compareTo(report.days().getLast().transcriptionUsd()));
        assertEquals(0,report.totals().suggestionsUsd().compareTo(report.recentCalls().getFirst().suggestionsUsd()));
        jdbc.update("update cost_exchange_rate set fetched_at=?",Timestamp.from(NOW.minusSeconds(7200)));
        when(ptax.latest(any())).thenThrow(new IllegalStateException("offline"));
        assertTrue(rates.current().fallback());
        jdbc.execute("truncate cost_exchange_rate"); assertNull(rates.current());
    }
    @Test void endpointRequiresAuthenticationAndReturnsSnapshotForLoggedInAccount() throws Exception {
        var cookies=new java.net.CookieManager(null,java.net.CookiePolicy.ACCEPT_ALL);
        var http=java.net.http.HttpClient.newBuilder().cookieHandler(cookies).build();
        var base="http://localhost:"+port;
        assertEquals(401,http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base+"/api/costs")).GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString()).statusCode());
        String email=UUID.randomUUID()+"@example.com";
        var account=accounts.register(new RegistrationRequest("Teste",email,"senha-segura-123",AccountType.INDIVIDUAL,null,true,AccountService.TERMS_VERSION));
        var json=new com.fasterxml.jackson.databind.ObjectMapper();
        String csrf=json.readTree(http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base+"/api/auth/csrf")).GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString()).body()).path("token").asText();
        var login=java.net.http.HttpRequest.newBuilder(java.net.URI.create(base+"/api/auth/login")).header("Content-Type","application/json").header("X-CSRF-TOKEN",csrf).POST(java.net.http.HttpRequest.BodyPublishers.ofString("{\"email\":\""+email+"\",\"password\":\"senha-segura-123\"}")).build();
        assertEquals(200,http.send(login,java.net.http.HttpResponse.BodyHandlers.ofString()).statusCode());
        // Persistent cache avoids external calls; this test never uses a real provider.
        jdbc.update("insert into cost_exchange_rate values(1,5,?,?)",java.sql.Date.valueOf("2026-10-14"),Timestamp.from(NOW));
        var response=http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base+"/api/costs?period=WEEK")).GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString());
        assertEquals(200,response.statusCode(),response.body());
        assertEquals(7,json.readTree(response.body()).path("days").size());
        assertEquals("PERSONAL",json.readTree(response.body()).path("scope").asText());
        var identity=accounts.currentIdentity(account.id());
        jdbc.update("update tenants set trial_started_at=trial_started_at-interval '1 day', trial_ends_at=? where id=?",Timestamp.from(NOW.minusSeconds(1)),identity.tenantId());
        assertEquals(403,http.send(java.net.http.HttpRequest.newBuilder(java.net.URI.create(base+"/api/costs")).GET().build(),java.net.http.HttpResponse.BodyHandlers.ofString()).statusCode());
    }
    private UUID tenant() {
        UUID id=UUID.randomUUID();jdbc.update("insert into tenants(id,type,name,trial_started_at,trial_ends_at,created_at) values(?,'ORGANIZATION','Org',?,?,?)",id,Timestamp.from(NOW.minusSeconds(86400)),Timestamp.from(NOW.plusSeconds(86400)),Timestamp.from(NOW));return id;
    }
    private UUID user(UUID tenant,Role role) {
        UUID id=UUID.randomUUID();jdbc.update("insert into users(id,tenant_id,name,email,password_hash,role,created_at) values(?,?,'Pessoa',?,'unused',?,?)",id,tenant,id+"@example.com",role.name(),Timestamp.from(NOW));return id;
    }
    private UUID call(UUID user,UUID tenant,boolean tracked,Instant start,Instant end) {
        UUID id=UUID.randomUUID();jdbc.update("insert into call_sessions(id,tenant_id,user_id,title,status,started_at,ended_at,cost_tracking_started_at) values(?,?,?,'Reunião',?,?,?,?)",id,tenant,user,end==null?"ACTIVE":"ENDED",Timestamp.from(start),end==null?null:Timestamp.from(end),tracked?Timestamp.from(start):null);return id;
    }
    private UUID record(UUID user,UUID call,String category,String amount) {
        UUID id=recorder.begin(accounts.currentIdentity(user),call,category);recorder.complete(id,new ProviderUsage("test","test-model","test-v1","{}",new BigDecimal(amount)));return id;
    }
    @TestConfiguration static class TimeConfig { @Bean @Primary Clock costTestClock() { return Clock.fixed(NOW,ZoneOffset.UTC); } }
}
