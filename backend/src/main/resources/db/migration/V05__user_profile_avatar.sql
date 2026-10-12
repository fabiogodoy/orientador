ALTER TABLE users
    ADD COLUMN avatar_content BYTEA,
    ADD COLUMN avatar_media_type VARCHAR(64),
    ADD COLUMN avatar_updated_at TIMESTAMPTZ;

ALTER TABLE users
    ADD CONSTRAINT users_avatar_valid CHECK (
        (avatar_content IS NULL AND avatar_media_type IS NULL AND avatar_updated_at IS NULL)
        OR
        (avatar_content IS NOT NULL AND avatar_media_type = 'image/png' AND avatar_updated_at IS NOT NULL
            AND octet_length(avatar_content) <= 2097152)
    );
