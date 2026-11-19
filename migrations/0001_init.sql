-- zafon-biz schema (Cloudflare D1)

CREATE TABLE categories (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  icon        TEXT NOT NULL DEFAULT 'more-horizontal',
  sort_order  INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE towns (
  id                  TEXT PRIMARY KEY,
  name                TEXT NOT NULL,
  region              TEXT NOT NULL DEFAULT '',
  is_border_community INTEGER NOT NULL DEFAULT 0
);

-- One user per email. role = 'owner' (business owner) | 'admin'.
-- password_hash is NULL until the user sets one via the reset-password flow.
CREATE TABLE users (
  id            TEXT PRIMARY KEY,
  email         TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT,
  role          TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'admin')),
  created_at    TEXT NOT NULL,
  last_login_at TEXT
);

CREATE TABLE businesses (
  id                TEXT PRIMARY KEY,
  owner_id          TEXT REFERENCES users(id) ON DELETE SET NULL,
  status            TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'rejected')),
  name              TEXT NOT NULL,
  slug              TEXT NOT NULL UNIQUE,
  description       TEXT NOT NULL,
  short_description TEXT,
  category          TEXT NOT NULL,
  sub_category      TEXT,
  tags              TEXT,            -- JSON array
  town              TEXT NOT NULL,
  region            TEXT,
  address           TEXT,
  contact_name      TEXT NOT NULL,
  phone             TEXT NOT NULL,
  whatsapp          TEXT,
  email             TEXT,
  website           TEXT,
  opening_hours     TEXT,
  facebook          TEXT,
  instagram         TEXT,
  created_at        TEXT NOT NULL,
  updated_at        TEXT,
  approved_at       TEXT,
  approved_by       TEXT,
  shuffle_seed      INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_businesses_status ON businesses(status);
CREATE INDEX idx_businesses_owner ON businesses(owner_id);

-- Login sessions. id = SHA-256 of the cookie token (raw token never stored).
CREATE TABLE sessions (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX idx_sessions_user ON sessions(user_id);

-- Single-use password set/reset links. id = SHA-256 of the token.
CREATE TABLE password_tokens (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at    TEXT
);
CREATE INDEX idx_password_tokens_user ON password_tokens(user_id);

-- Simple per-key rate limiting (login / forgot-password / register).
CREATE TABLE rate_limits (
  key          TEXT PRIMARY KEY,
  count        INTEGER NOT NULL,
  window_start INTEGER NOT NULL
);
