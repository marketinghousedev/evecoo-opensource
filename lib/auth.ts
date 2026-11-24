import { createHash, randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { getDb, nowIso } from './db';
import { ApiError } from './http';
import type { SessionUser } from './types';

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export function hashPassword(pw: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(pw, salt, 64, { N: 16384 });
  return `scrypt$${salt.toString('base64')}$${hash.toString('base64')}`;
}

export function verifyPassword(pw: string, stored: string): boolean {
  const parts = stored.split('$');
  if (parts.length !== 3 || parts[0] !== 'scrypt') return false;
  const salt = Buffer.from(parts[1], 'base64');
  const expected = Buffer.from(parts[2], 'base64');
  if (expected.length !== 64) return false;
  const actual = scryptSync(pw, salt, 64, { N: 16384 });
  return timingSafeEqual(actual, expected);
}

function sha256(s: string): string {
  return createHash('sha256').update(s).digest('hex');
}

export function createSession(userId: string): string {
  const token = randomBytes(32).toString('base64url');
  const now = Date.now();
  const db = getDb();
  // Expired sessions are dead weight (getUser already rejects them); purge on each login.
  db.prepare('DELETE FROM sessions WHERE expires_at <= ?').run(new Date(now).toISOString());
  db
    .prepare('INSERT INTO sessions(token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
    .run(sha256(token), userId, new Date(now).toISOString(), new Date(now + SESSION_MS).toISOString());
  return token;
}

export function getUser(req: Request): SessionUser | null {
  const header = req.headers.get('authorization');
  if (!header) return null;
  const m = /^Bearer\s+(\S+)$/i.exec(header.trim());
  if (!m) return null;
  const row = getDb()
    .prepare(
      `SELECT u.id AS id, u.email AS email, u.role AS role, u.business_id AS businessId, b.name AS businessName
       FROM sessions s JOIN users u ON u.id = s.user_id JOIN businesses b ON b.id = u.business_id
       WHERE s.token_hash = ? AND s.expires_at > ?`,
    )
    .get(sha256(m[1]), nowIso()) as SessionUser | undefined;
  if (!row) return null;
  return { id: row.id, email: row.email, role: row.role, businessId: row.businessId, businessName: row.businessName };
}

export function requireUser(req: Request, role?: 'owner'): SessionUser {
  const user = getUser(req);
  if (!user) throw new ApiError(401, 'unauthorized', 'errors.unauthorized');
  if (role === 'owner' && user.role !== 'owner') {
    throw new ApiError(403, 'forbidden', 'errors.forbidden');
  }
  return user;
}

// Exposed for login: constant-ish work for unknown emails.
export const DUMMY_HASH = hashPassword('dummy-password-for-timing');
