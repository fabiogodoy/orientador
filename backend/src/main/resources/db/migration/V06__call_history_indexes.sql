CREATE INDEX call_sessions_tenant_status_started_idx
    ON call_sessions (tenant_id, status, started_at DESC, id DESC);

CREATE INDEX call_sessions_status_started_idx
    ON call_sessions (status, started_at DESC, id DESC);
