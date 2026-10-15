package br.com.connectas.orientador.cost;

import br.com.connectas.orientador.account.AccountService;
import br.com.connectas.orientador.account.Identity;
import br.com.connectas.orientador.account.Role;
import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class CostService {
    public static final ZoneId ZONE = ZoneId.of("America/Sao_Paulo");
    private static final Logger log = LoggerFactory.getLogger(CostService.class);
    private static final String OVERLAP = "c.started_at < :end and c.started_at <= :now and (coalesce(c.ended_at,:now) > :start or c.started_at >= :start)";
    private static final String EVENTS = "e.occurred_at >= :start and e.occurred_at < :end";
    private static final String DURATION = "greatest(0,extract(epoch from (least(coalesce(c.ended_at,:now),:now,:end)-greatest(c.started_at,:start))))";
    private final NamedParameterJdbcTemplate jdbc;
    private final AccountService accounts;
    private final Clock clock;
    public CostService(JdbcTemplate jdbc, AccountService accounts, Clock clock) {
        this.jdbc = new NamedParameterJdbcTemplate(jdbc); this.accounts = accounts; this.clock = clock;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public Report report(UUID userId, String period, int page, ExchangeRateService.Rate rate) {
        if (page < 0 || page > 100_000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Página inválida");
        Identity viewer = accounts.currentIdentity(userId);
        String scope = scope(viewer);
        Map<String, Object> params = new HashMap<>();
        params.put("tenant", viewer.tenantId()); params.put("user", viewer.id());
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZONE);
        LocalDate first = startDate(period, today);
        if (first == null) {
            java.sql.Date earliest = jdbc.queryForObject("select (min(c.started_at) at time zone 'America/Sao_Paulo')::date from call_sessions c where " + scope, params, java.sql.Date.class);
            first = earliest == null ? today : earliest.toLocalDate();
        }
        params.put("start", Timestamp.from(first.atStartOfDay(ZONE).toInstant()));
        params.put("end", Timestamp.from(today.plusDays(1).atStartOfDay(ZONE).toInstant()));
        params.put("now", Timestamp.from(clock.instant())); params.put("offset", page * 20);
        Totals totals = totals(scope, params);
        CallTotals calls = jdbc.queryForObject("select count(*) as calls,coalesce(sum(" + DURATION + "),0)::bigint as seconds,"
                + " count(*) filter(where c.cost_tracking_started_at is null) as legacy from call_sessions c where " + scope + " and " + OVERLAP,
                params, (rs, row) -> new CallTotals(rs.getLong("calls"), rs.getLong("seconds"), rs.getLong("legacy")));
        List<Day> measuredDays = jdbc.query("select (e.occurred_at at time zone 'America/Sao_Paulo')::date as day,"
                + "coalesce(sum(e.cost_usd) filter(where e.category='TRANSCRIPTION'),0) as transcription,"
                + "coalesce(sum(e.cost_usd) filter(where e.category='SUGGESTION'),0) as suggestions from usage_costs e join call_sessions c on c.id=e.call_session_id and c.tenant_id=e.tenant_id where "
                + scope + " and " + EVENTS + " group by day order by day", params,
                (rs, row) -> new Day(rs.getDate("day").toLocalDate(), rs.getBigDecimal("transcription"), rs.getBigDecimal("suggestions")));
        Map<LocalDate, Day> byDate = new HashMap<>(); measuredDays.forEach(day -> byDate.put(day.date(), day));
        List<Day> days = first.datesUntil(today.plusDays(1)).map(date -> byDate.getOrDefault(date, new Day(date, BigDecimal.ZERO, BigDecimal.ZERO))).toList();
        List<Call> recent = recent(scope, params);
        log.info("Costs viewed viewerId={} tenantId={} role={} global={} period={} page={}", viewer.id(), viewer.tenantId(), viewer.role(), viewer.role() == Role.PLATFORM_ADMIN, period, page);
        return new Report(period, first, today, "America/Sao_Paulo", viewer.role() == Role.PLATFORM_ADMIN ? "PLATFORM" : viewer.role() == Role.ORGANIZATION_MANAGER ? "ORGANIZATION" : "PERSONAL",
                totals, calls, rate, days, recent, page, 20);
    }

    static LocalDate startDate(String period, LocalDate today) {
        return switch (period) {
            case "TODAY" -> today;
            case "WEEK" -> today.minusDays(6);
            case "MONTH" -> today.minusDays(29);
            case "ALL" -> null;
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Período inválido");
        };
    }
    private static String scope(Identity viewer) {
        if (viewer.role() == Role.PLATFORM_ADMIN) return "true";
        if (viewer.role() == Role.ORGANIZATION_MANAGER) return "c.tenant_id=:tenant";
        return "c.tenant_id=:tenant and c.user_id=:user";
    }
    private Totals totals(String scope, Map<String, Object> params) {
        return jdbc.queryForObject("select coalesce(sum(e.cost_usd) filter(where e.category='TRANSCRIPTION'),0) as transcription,"
                + "coalesce(sum(e.cost_usd) filter(where e.category='SUGGESTION'),0) as suggestions,"
                + "count(*) filter(where e.category='TRANSCRIPTION') as chunks,count(*) filter(where e.category='SUGGESTION') as requests,"
                + "count(*) filter(where e.cost_usd is null) as unknown from usage_costs e join call_sessions c on c.id=e.call_session_id and c.tenant_id=e.tenant_id where " + scope + " and " + EVENTS,
                params, (rs, row) -> new Totals(rs.getBigDecimal("transcription"), rs.getBigDecimal("suggestions"), rs.getLong("chunks"), rs.getLong("requests"), rs.getLong("unknown")));
    }
    private List<Call> recent(String scope, Map<String, Object> params) {
        return jdbc.query("select c.id,c.title,c.started_at,c.status,u.name as owner_name,(" + DURATION + ")::bigint as seconds,"
                + "c.cost_tracking_started_at is null as legacy, coalesce(m.unknown,0) as unknown,m.transcription,m.suggestions "
                + "from call_sessions c join users u on u.id=c.user_id left join lateral (select "
                + "sum(e.cost_usd) filter(where e.category='TRANSCRIPTION') as transcription,"
                + "sum(e.cost_usd) filter(where e.category='SUGGESTION') as suggestions, count(*) filter(where e.cost_usd is null) as unknown "
                + "from usage_costs e where e.call_session_id=c.id and e.tenant_id=c.tenant_id and " + EVENTS + ") m on true where "
                + scope + " and " + OVERLAP + " order by c.started_at desc,c.id desc limit 20 offset :offset", params,
                (rs, row) -> {
                    boolean partial = rs.getBoolean("legacy") || rs.getLong("unknown") > 0;
                    BigDecimal transcription = rs.getBigDecimal("transcription"), suggestions = rs.getBigDecimal("suggestions");
                    return new Call(rs.getObject("id", UUID.class), rs.getString("title"), rs.getTimestamp("started_at").toInstant(),
                            rs.getString("status"), rs.getString("owner_name"), rs.getLong("seconds"), partial,
                            transcription == null && !partial ? BigDecimal.ZERO : transcription, suggestions == null && !partial ? BigDecimal.ZERO : suggestions);
                });
    }

    public record Totals(BigDecimal transcriptionUsd, BigDecimal suggestionsUsd, long transcriptionCount, long suggestionCount, long unknownOperations) {}
    public record CallTotals(long count, long durationSeconds, long legacyCount) {}
    public record Day(LocalDate date, BigDecimal transcriptionUsd, BigDecimal suggestionsUsd) {}
    public record Call(UUID sessionId, String title, Instant startedAt, String status, String ownerName, long durationSeconds, boolean partial, BigDecimal transcriptionUsd, BigDecimal suggestionsUsd) {}
    public record Report(String period, LocalDate from, LocalDate to, String timezone, String scope, Totals totals, CallTotals calls,
                         ExchangeRateService.Rate exchangeRate, List<Day> days, List<Call> recentCalls, int page, int pageSize) {}
}
