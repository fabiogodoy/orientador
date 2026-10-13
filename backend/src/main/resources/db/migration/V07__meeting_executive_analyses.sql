CREATE TABLE meeting_executive_analyses (
    call_session_id UUID PRIMARY KEY REFERENCES call_sessions(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    status VARCHAR(16) NOT NULL CHECK (status IN ('GENERATING', 'COMPLETED', 'FAILED')),
    analysis JSONB,
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL,
    failed_at TIMESTAMPTZ,
    CHECK ((status = 'COMPLETED' AND analysis IS NOT NULL) OR (status <> 'COMPLETED' AND analysis IS NULL))
);
CREATE INDEX meeting_executive_analyses_tenant_session_idx ON meeting_executive_analyses(tenant_id, call_session_id);
