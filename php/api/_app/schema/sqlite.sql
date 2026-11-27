-- evecoo schema, SQLite (dev and tests). Same model as mysql.sql. Statements are separated by ";\n".
CREATE TABLE IF NOT EXISTS businesses (
  id TEXT NOT NULL PRIMARY KEY,
  name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  card_name TEXT NOT NULL,
  card_reward TEXT NOT NULL,
  stamps_required INTEGER NOT NULL DEFAULT 10 CHECK (stamps_required BETWEEN 0 AND 255),
  card_color TEXT NOT NULL DEFAULT '#1F6F5B',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT NOT NULL PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner','staff')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_users_business_role ON users (business_id, role);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT NOT NULL PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users (id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions (expires_at);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT NOT NULL PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses (id),
  name TEXT NOT NULL,
  birthday TEXT NULL,
  stamps INTEGER NOT NULL DEFAULT 0 CHECK (stamps >= 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_customers_business ON customers (business_id);

CREATE TABLE IF NOT EXISTS stamp_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL REFERENCES customers (id),
  business_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('stamp','redeem')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stamp_events_business_kind ON stamp_events (business_id, kind);

CREATE INDEX IF NOT EXISTS idx_stamp_events_customer_kind_created ON stamp_events (customer_id, kind, created_at);

CREATE TABLE IF NOT EXISTS messages (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  id TEXT NOT NULL UNIQUE,
  business_id TEXT NOT NULL REFERENCES businesses (id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL CHECK (kind IN ('broadcast','winback','birthday','welcome')),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_messages_business_created ON messages (business_id, created_at);

CREATE TABLE IF NOT EXISTS message_recipients (
  message_id TEXT NOT NULL REFERENCES messages (id),
  customer_id TEXT NOT NULL REFERENCES customers (id),
  PRIMARY KEY (message_id, customer_id)
);

CREATE INDEX IF NOT EXISTS idx_message_recipients_customer ON message_recipients (customer_id);

CREATE TABLE IF NOT EXISTS automation_log (
  customer_id TEXT NOT NULL REFERENCES customers (id),
  kind TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY (customer_id, kind, day)
);

CREATE TABLE IF NOT EXISTS rate_limits (
  bucket TEXT NOT NULL PRIMARY KEY,
  window_start INTEGER NOT NULL,
  hits INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits (window_start);
