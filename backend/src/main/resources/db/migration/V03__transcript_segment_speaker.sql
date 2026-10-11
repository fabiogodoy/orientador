ALTER TABLE transcript_segments ADD COLUMN speaker VARCHAR(16) NOT NULL DEFAULT 'USER';
ALTER TABLE transcript_segments ADD CONSTRAINT transcript_segments_speaker_check CHECK (speaker IN ('USER', 'CLIENT'));
ALTER TABLE transcript_segments ALTER COLUMN speaker DROP DEFAULT;
