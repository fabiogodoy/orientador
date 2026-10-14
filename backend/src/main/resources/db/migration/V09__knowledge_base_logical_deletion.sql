ALTER TABLE knowledge_bases
    ADD COLUMN deleted_at TIMESTAMPTZ,
    ADD COLUMN deleted_by_user_id UUID REFERENCES users(id);

CREATE INDEX knowledge_bases_active_tenant_updated_idx
    ON knowledge_bases (tenant_id, updated_at DESC, id DESC)
    WHERE deleted_at IS NULL;

CREATE INDEX knowledge_bases_active_tenant_name_idx
    ON knowledge_bases (tenant_id, lower(name))
    WHERE deleted_at IS NULL;
