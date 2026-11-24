import { DUMMY_HASH, createSession, hashPassword, verifyPassword } from './auth';
import { getDb, newId, nowIso, tx } from './db';
import { ApiError } from './http';
import { getT } from './i18n';
import type { Role, SessionUser } from './types';

type O = Record<string, unknown>;

// Passwords are not trimmed. Length is only enforced when creating one (signup / staff).
export function newPassword(o: O, key = 'password'): string {
  const v = o[key];
  if (typeof v !== 'string' || v.length < 8 || v.length > 200) {
    throw new ApiError(400, 'validation_error', 'errors.validation.string', { field: key, min: 8, max: 200 });
  }
  return v;
}

// Login: any string is accepted (wrong password must be 401, not 400).
export function anyPassword(o: O, key = 'password'): string {
  const v = o[key];
  if (typeof v !== 'string') {
    throw new ApiError(400, 'validation_error', 'errors.validation.string', { field: key, min: 0, max: 200 });
  }
  return v;
}

function isUniqueViolation(e: unknown): boolean {
  const m = e instanceof Error ? e.message : '';
  return /UNIQUE constraint failed/i.test(m);
}

function emailExists(email: string): boolean {
  return !!getDb().prepare('SELECT 1 AS x FROM users WHERE email = ?').get(email);
}

export function signup(
  i: { email: string; password: string; businessName: string },
  locale: string,
): { token: string; businessId: string } {
  const email = i.email.trim().toLowerCase();
  if (emailExists(email)) throw new ApiError(409, 'email_taken', 'errors.emailTaken');
  const t = getT(locale);
  const hash = hashPassword(i.password);
  const businessId = newId();
  const userId = newId();
  const now = nowIso();
  try {
    tx(() => {
      const db = getDb();
      db.prepare(
        'INSERT INTO businesses(id, name, locale, card_name, card_reward, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(businessId, i.businessName, locale, t('defaults.cardName'), t('defaults.reward'), now);
      db.prepare(
        'INSERT INTO users(id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      ).run(userId, businessId, email, hash, 'owner', now);
    });
  } catch (e) {
    if (isUniqueViolation(e)) throw new ApiError(409, 'email_taken', 'errors.emailTaken');
    throw e;
  }
  return { token: createSession(userId), businessId };
}

export function login(i: { email: string; password: string }): { token: string; role: Role } {
  const email = i.email.trim().toLowerCase();
  const row = getDb().prepare('SELECT id, password_hash AS hash, role FROM users WHERE email = ?').get(email) as
    | { id: string; hash: string; role: Role }
    | undefined;
  const ok = verifyPassword(i.password, row ? row.hash : DUMMY_HASH);
  if (!row || !ok) throw new ApiError(401, 'invalid_credentials', 'errors.invalidCredentials');
  return { token: createSession(row.id), role: row.role };
}

export function createStaff(owner: SessionUser, i: { email: string; password: string }): { id: string } {
  // Defense in depth: the route already enforces requireUser(req,'owner').
  if (owner.role !== 'owner') throw new ApiError(403, 'forbidden', 'errors.forbidden');
  const email = i.email.trim().toLowerCase();
  if (emailExists(email)) throw new ApiError(409, 'email_taken', 'errors.emailTaken');
  const hash = hashPassword(i.password);
  const id = newId();
  try {
    getDb()
      .prepare('INSERT INTO users(id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)')
      .run(id, owner.businessId, email, hash, 'staff', nowIso());
  } catch (e) {
    if (isUniqueViolation(e)) throw new ApiError(409, 'email_taken', 'errors.emailTaken');
    throw e;
  }
  return { id };
}

export function listStaff(businessId: string): { id: string; email: string }[] {
  return getDb()
    .prepare("SELECT id, email FROM users WHERE business_id = ? AND role = 'staff' ORDER BY created_at, id")
    .all(businessId) as { id: string; email: string }[];
}
