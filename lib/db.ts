import { randomBytes } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { DatabaseSync } from 'node:sqlite';

export const SCHEMA = `
CREATE TABLE IF NOT EXISTS businesses(
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  locale TEXT NOT NULL DEFAULT 'en',
  card_name TEXT NOT NULL,
  card_reward TEXT NOT NULL,
  stamps_required INTEGER NOT NULL DEFAULT 10,
  card_color TEXT NOT NULL DEFAULT '#1F6F5B',
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users(
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN('owner','staff')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions(
  token_hash TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS customers(
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  name TEXT NOT NULL,
  birthday TEXT,
  stamps INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS stamp_events(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id TEXT NOT NULL REFERENCES customers(id),
  business_id TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN('stamp','redeem')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS messages(
  id TEXT PRIMARY KEY,
  business_id TEXT NOT NULL REFERENCES businesses(id),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN('broadcast','winback','birthday','welcome')),
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS message_recipients(
  message_id TEXT NOT NULL REFERENCES messages(id),
  customer_id TEXT NOT NULL REFERENCES customers(id),
  PRIMARY KEY(message_id, customer_id)
);
CREATE TABLE IF NOT EXISTS automation_log(
  customer_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  day TEXT NOT NULL,
  PRIMARY KEY(customer_id, kind, day)
);
CREATE INDEX IF NOT EXISTS idx_customers_business ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_stamp_events_business ON stamp_events(business_id);
CREATE INDEX IF NOT EXISTS idx_stamp_events_customer ON stamp_events(customer_id);
CREATE INDEX IF NOT EXISTS idx_message_recipients_customer ON message_recipients(customer_id);
`;

const g = globalThis as unknown as { __evecooDb?: DatabaseSync };

export function getDb(): DatabaseSync {
  if (g.__evecooDb) return g.__evecooDb;
  // Loaded via getBuiltinModule: a static import of 'node:sqlite' breaks webpack.
  const sqlite = process.getBuiltinModule('node:sqlite') as typeof import('node:sqlite');
  const file = process.env.DB_PATH || './data.db';
  if (file !== ':memory:') fs.mkdirSync(path.dirname(path.resolve(file)), { recursive: true });
  const db = new sqlite.DatabaseSync(file);
  db.exec('PRAGMA journal_mode=WAL;');
  db.exec('PRAGMA foreign_keys=ON;');
  db.exec(SCHEMA);
  g.__evecooDb = db;
  return db;
}

export function resetDb(): void {
  const db = g.__evecooDb;
  g.__evecooDb = undefined;
  if (db) {
    try {
      db.close();
    } catch {
      /* already closed */
    }
  }
}

export function tx<T>(fn: () => T): T {
  const db = getDb();
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (e) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* ignore */
    }
    throw e;
  }
}

export function newId(): string {
  return randomBytes(16).toString('base64url');
}

export function nowIso(): string {
  return new Date().toISOString();
}
