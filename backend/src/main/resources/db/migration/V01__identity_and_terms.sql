CREATE TABLE tenants (
    id UUID PRIMARY KEY,
    type VARCHAR(24) NOT NULL CHECK (type IN ('INDIVIDUAL', 'ORGANIZATION')),
    name VARCHAR(160),
    trial_started_at TIMESTAMPTZ NOT NULL,
    trial_ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT tenant_name_valid CHECK (
        (type = 'INDIVIDUAL' AND name IS NULL) OR
        (type = 'ORGANIZATION' AND name IS NOT NULL AND length(trim(name)) > 0)
    ),
    CONSTRAINT trial_range_valid CHECK (trial_ends_at > trial_started_at)
);

CREATE TABLE users (
    id UUID PRIMARY KEY,
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(120) NOT NULL,
    email VARCHAR(254) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL CHECK (role IN ('INDIVIDUAL', 'ORGANIZATION_MANAGER', 'ORGANIZATION_MEMBER', 'PLATFORM_ADMIN')),
    created_at TIMESTAMPTZ NOT NULL,
    CONSTRAINT user_name_valid CHECK (length(trim(name)) > 0),
    CONSTRAINT email_lowercase CHECK (email = lower(email))
);
CREATE UNIQUE INDEX users_email_unique ON users(email);
CREATE INDEX users_tenant_idx ON users(tenant_id);

CREATE TABLE terms_acceptances (
    user_id UUID NOT NULL REFERENCES users(id),
    version VARCHAR(20) NOT NULL,
    accepted_at TIMESTAMPTZ NOT NULL,
    PRIMARY KEY (user_id, version)
);
