CREATE TABLE knowledge_bases (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    name VARCHAR(120) NOT NULL CHECK (length(trim(name)) > 0),
    content TEXT NOT NULL CHECK (length(trim(content)) > 0 AND length(content) <= 12000),
    created_at TIMESTAMPTZ NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL
);
CREATE INDEX knowledge_bases_tenant_updated_idx ON knowledge_bases (tenant_id, updated_at DESC, id DESC);

ALTER TABLE call_sessions
    ADD COLUMN meeting_context TEXT,
    ADD COLUMN knowledge_base_name VARCHAR(120),
    ADD COLUMN knowledge_base_content TEXT,
    ADD CONSTRAINT call_sessions_meeting_context_size CHECK (meeting_context IS NULL OR length(meeting_context) <= 6000),
    ADD CONSTRAINT call_sessions_knowledge_base_snapshot CHECK (
        (knowledge_base_name IS NULL AND knowledge_base_content IS NULL)
        OR (knowledge_base_name IS NOT NULL AND knowledge_base_content IS NOT NULL)
    );
