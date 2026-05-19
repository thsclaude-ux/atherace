export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  name TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS access_codes (
  code TEXT PRIMARY KEY,
  max_uses INTEGER NOT NULL DEFAULT 1,
  used_count INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  created_by TEXT,
  expires_at TEXT
);

CREATE TABLE IF NOT EXISTS code_usages (
  code TEXT NOT NULL REFERENCES access_codes(code) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  validated_at TEXT NOT NULL,
  submitted INTEGER NOT NULL DEFAULT 0,
  submitted_at TEXT,
  PRIMARY KEY (code, user_id)
);

CREATE TABLE IF NOT EXISTS predictions (
  id TEXT PRIMARY KEY,
  user_id TEXT UNIQUE NOT NULL,
  code TEXT NOT NULL,
  rounds TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  submitted_at TEXT NOT NULL,
  consent_at TEXT NOT NULL,
  privacy_version TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS participants (
  user_id TEXT PRIMARY KEY,
  name TEXT,
  score INTEGER NOT NULL DEFAULT 0,
  registered_at TEXT NOT NULL,
  last_scored_at TEXT
);

CREATE TABLE IF NOT EXISTS race_results (
  id TEXT PRIMARY KEY DEFAULT 'current',
  rounds TEXT NOT NULL,
  saved_at TEXT NOT NULL,
  saved_by TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  user_id TEXT,
  details TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_predictions_code ON predictions(code);
CREATE INDEX IF NOT EXISTS idx_participants_score ON participants(score DESC);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);
`;
