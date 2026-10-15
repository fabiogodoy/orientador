-- Rollback: revert application first; retain ledger. Any removal requires a later
-- migration after exporting financial metadata; never delete usage during rollback.
ALTER TABLE call_sessions ADD COLUMN cost_tracking_started_at TIMESTAMPTZ;
ALTER TABLE call_sessions ADD CONSTRAINT call_sessions_cost_identity UNIQUE(id, tenant_id, user_id);
CREATE TABLE usage_costs (
    id UUID PRIMARY KEY,
    call_session_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    category VARCHAR(20) NOT NULL CHECK (category IN ('TRANSCRIPTION','SUGGESTION')),
    occurred_at TIMESTAMPTZ NOT NULL,
    provider VARCHAR(32), model VARCHAR(100), tariff_version VARCHAR(40),
    units JSONB,
    cost_usd NUMERIC(24,12) CHECK (cost_usd >= 0),
    FOREIGN KEY(call_session_id, tenant_id, user_id) REFERENCES call_sessions(id, tenant_id, user_id)
);
CREATE INDEX usage_costs_call_date_idx ON usage_costs(call_session_id, occurred_at);
CREATE INDEX usage_costs_tenant_date_idx ON usage_costs(tenant_id, occurred_at);
CREATE INDEX usage_costs_date_idx ON usage_costs(occurred_at);
CREATE TABLE cost_exchange_rate (
    id INTEGER PRIMARY KEY CHECK (id=1),
    usd_brl NUMERIC(16,8) NOT NULL CHECK (usd_brl>0),
    quote_date DATE NOT NULL,
    fetched_at TIMESTAMPTZ NOT NULL
);
