package br.com.connectas.orientador.cost;

import java.math.BigDecimal;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ExchangeRateService {
    private static final Logger log = LoggerFactory.getLogger(ExchangeRateService.class);
    private final JdbcTemplate jdbc;
    private final PtaxClient ptax;
    private final Clock clock;
    private Instant retryAt = Instant.MIN;
    public ExchangeRateService(JdbcTemplate jdbc, PtaxClient ptax, Clock clock) { this.jdbc = jdbc; this.ptax = ptax; this.clock = clock; }

    public synchronized Rate current() {
        Instant now = clock.instant();
        Cached cached = jdbc.query("select usd_brl,quote_date,fetched_at from cost_exchange_rate where id=1", rs -> rs.next()
                ? new Cached(rs.getBigDecimal(1), rs.getDate(2).toLocalDate(), rs.getTimestamp(3).toInstant()) : null);
        if (now.isBefore(retryAt)) return cached == null ? null : cached.rate(true);
        if (cached != null && cached.fetchedAt().plusSeconds(3600).isAfter(now)) return cached.rate(false);
        try {
            PtaxClient.Quote quote = ptax.latest(LocalDate.ofInstant(now, CostService.ZONE));
            jdbc.update("insert into cost_exchange_rate(id,usd_brl,quote_date,fetched_at) values(1,?,?,?) on conflict(id) do update set usd_brl=excluded.usd_brl,quote_date=excluded.quote_date,fetched_at=excluded.fetched_at",
                    quote.rate(), java.sql.Date.valueOf(quote.date()), Timestamp.from(now));
            return new Rate(quote.rate(), quote.date(), "BCB · PTAX venda", false);
        } catch (Exception exception) {
            if (exception instanceof InterruptedException) Thread.currentThread().interrupt();
            retryAt = now.plusSeconds(300);
            log.warn("PTAX refresh failed cached={} reason={}", cached != null, exception.getClass().getSimpleName());
            return cached == null ? null : cached.rate(true);
        }
    }
    public record Rate(BigDecimal usdBrl, LocalDate date, String source, boolean fallback) {}
    private record Cached(BigDecimal value, LocalDate date, Instant fetchedAt) {
        Rate rate(boolean fallback) { return new Rate(value, date, "BCB · PTAX venda", fallback); }
    }
}
