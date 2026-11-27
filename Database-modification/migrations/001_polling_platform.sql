BEGIN;

ALTER TABLE polls
    ADD COLUMN public_id UUID;

UPDATE polls
SET public_id = md5('poll-public-' || id::text)::uuid
WHERE public_id IS NULL;

ALTER TABLE polls
    ALTER COLUMN public_id SET NOT NULL;

CREATE UNIQUE INDEX polls_public_id_unique ON polls(public_id);

ALTER TABLE polls
    DROP CONSTRAINT IF EXISTS polls_status_check;

UPDATE polls
SET status = 'active'
WHERE status = 'published';

ALTER TABLE polls
    ADD CONSTRAINT polls_status_check
        CHECK (status IN ('draft', 'active', 'closed'));

CREATE INDEX IF NOT EXISTS idx_polls_active_ends_at
    ON polls(ends_at)
    WHERE status = 'active';

COMMIT;
