CREATE TABLE IF NOT EXISTS links (
  id          BIGSERIAL PRIMARY KEY,
  code        VARCHAR(32) NOT NULL UNIQUE,
  url         TEXT NOT NULL,
  clicks      BIGINT NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at  TIMESTAMPTZ NULL   -- reserved for a later exercise; the app does not use it yet
);
CREATE INDEX IF NOT EXISTS idx_links_created_at ON links (created_at DESC);
