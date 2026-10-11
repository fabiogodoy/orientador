CREATE TABLE call_sessions (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),
    status VARCHAR(16) NOT NULL CHECK (status IN ('ACTIVE', 'ENDED')),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ
);
CREATE INDEX call_sessions_tenant_user_idx ON call_sessions(tenant_id, user_id, started_at DESC);

CREATE TABLE transcript_segments (
    id UUID PRIMARY KEY,
    call_session_id UUID NOT NULL REFERENCES call_sessions(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sequence_number INTEGER NOT NULL CHECK (sequence_number > 0),
    text TEXT NOT NULL CHECK (length(trim(text)) > 0),
    finalized_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    UNIQUE (call_session_id, sequence_number)
);
CREATE INDEX transcript_segments_tenant_session_idx ON transcript_segments(tenant_id, call_session_id, sequence_number);
