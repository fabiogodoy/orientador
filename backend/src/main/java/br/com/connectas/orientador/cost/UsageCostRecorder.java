package br.com.connectas.orientador.cost;

import br.com.connectas.orientador.account.Identity;
import java.sql.Timestamp;
import java.time.Clock;
import java.util.UUID;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class UsageCostRecorder {
    private static final Logger log = LoggerFactory.getLogger(UsageCostRecorder.class);
    private final JdbcTemplate jdbc;
    private final Clock clock;
    public UsageCostRecorder(JdbcTemplate jdbc, Clock clock) { this.jdbc = jdbc; this.clock = clock; }

    public UUID begin(Identity identity, UUID callId, String category) {
        UUID id = UUID.randomUUID();
        jdbc.update("insert into usage_costs(id, call_session_id, tenant_id, user_id, category, occurred_at) values(?,?,?,?,?,?)",
                id, callId, identity.tenantId(), identity.id(), category, Timestamp.from(clock.instant()));
        log.info("Usage cost started operationId={} callId={} tenantId={} category={}", id, callId, identity.tenantId(), category);
        return id;
    }

    public void complete(UUID id, ProviderUsage usage) {
        jdbc.update("update usage_costs set provider=?, model=?, tariff_version=?, units=cast(? as jsonb), cost_usd=? where id=?",
                usage.provider(), usage.model(), usage.tariffVersion(), usage.units(), usage.costUsd(), id);
        log.info("Usage cost recorded operationId={} categoryProvider={} known={}", id, usage.provider(), usage.costUsd() != null);
    }
}
