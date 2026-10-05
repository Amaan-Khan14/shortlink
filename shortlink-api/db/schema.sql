-- ShortLink schema. Safe to run repeatedly (idempotent).

-- Collections: lightweight grouping (one collection per link, nullable).
-- Created before links because links holds the foreign key.
CREATE TABLE IF NOT EXISTS collections (
  id          BIGSERIAL PRIMARY KEY,
  name        TEXT NOT NULL UNIQUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Links: the core short URL row. clicks stays as the fast aggregate counter;
-- per-click detail lives in link_events. expires_at / is_enabled drive the
-- redirect lifecycle: a link only redirects while enabled and unexpired.
CREATE TABLE IF NOT EXISTS links (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(32) NOT NULL UNIQUE,
  url         TEXT NOT NULL,
  clicks      BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NULL,
  is_enabled  BOOLEAN NOT NULL DEFAULT true,
  collection_id BIGINT NULL REFERENCES collections(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);
-- Evolution of pre-existing links tables (no-ops on fresh databases).
-- Must run before the index below so the column exists either way.
ALTER TABLE links ADD COLUMN IF NOT EXISTS is_enabled BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE links ADD COLUMN IF NOT EXISTS collection_id BIGINT NULL REFERENCES collections(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_links_collection ON links (collection_id);

-- Click events: one row per redirect, storing only coarse, privacy-conscious
-- categories (never the raw user-agent string, no fingerprinting).
CREATE TABLE IF NOT EXISTS link_events (
  id              BIGSERIAL PRIMARY KEY,
  link_id         BIGINT NOT NULL REFERENCES links(id) ON DELETE CASCADE,
  occurred_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  referrer        TEXT NOT NULL DEFAULT 'Direct',
  device          VARCHAR(16) NOT NULL DEFAULT 'other',
  browser         VARCHAR(32) NOT NULL DEFAULT 'other',
  operating_system VARCHAR(32) NOT NULL DEFAULT 'other',
  CONSTRAINT link_events_device_check CHECK (device IN ('desktop','mobile','tablet','other'))
);
CREATE INDEX IF NOT EXISTS idx_link_events_link_time ON link_events (link_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_link_events_link_referrer ON link_events (link_id, referrer);

-- Audit trail: append-only record of management operations.
CREATE TABLE IF NOT EXISTS audit_logs (
  id            BIGSERIAL PRIMARY KEY,
  event_type    VARCHAR(64) NOT NULL,
  resource_type VARCHAR(32) NOT NULL,
  resource_id   TEXT,
  metadata      JSONB NOT NULL DEFAULT '{}',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs (created_at DESC);
