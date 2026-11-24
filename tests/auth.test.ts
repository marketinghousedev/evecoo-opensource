import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb, seedBusiness } from './helpers';
import { createSession, hashPassword, requireUser, verifyPassword } from '@/lib/auth';
import { getDb, newId, nowIso } from '@/lib/db';
import { ApiError } from '@/lib/http';

const req = (token?: string) =>
  new Request('http://x/api', { headers: token ? { authorization: `Bearer ${token}` } : {} });

function status(fn: () => unknown): number | null {
  try {
    fn();
    return null;
  } catch (e) {
    return e instanceof ApiError ? e.status : -1;
  }
}

describe('auth', () => {
  beforeEach(() => freshDb());

  it('hash/verify round trip', () => {
    const h = hashPassword('geheim123');
    expect(h.startsWith('scrypt$')).toBe(true);
    expect(h).not.toContain('geheim123');
    expect(verifyPassword('geheim123', h)).toBe(true);
    expect(verifyPassword('falsch', h)).toBe(false);
    expect(verifyPassword('x', 'garbage')).toBe(false);
  });

  it('requireUser: 401 without or with bad/expired token, ok with valid', () => {
    const { owner } = seedBusiness();
    expect(status(() => requireUser(req()))).toBe(401);
    expect(status(() => requireUser(req('nope')))).toBe(401);
    const token = createSession(owner.id);
    expect(requireUser(req(token)).businessId).toBe(owner.businessId);
    getDb().prepare('UPDATE sessions SET expires_at = ?').run('2000-01-01T00:00:00.000Z');
    expect(status(() => requireUser(req(token)))).toBe(401);
  });

  it('requireUser: 403 when staff hits an owner route; stores only the token hash', () => {
    const { owner, businessId } = seedBusiness();
    const staffId = newId();
    getDb()
      .prepare('INSERT INTO users(id, business_id, email, password_hash, role, created_at) VALUES (?,?,?,?,?,?)')
      .run(staffId, businessId, 'staff@example.com', hashPassword('password123'), 'staff', nowIso());
    const staffToken = createSession(staffId);
    expect(requireUser(req(staffToken)).role).toBe('staff');
    expect(status(() => requireUser(req(staffToken), 'owner'))).toBe(403);
    const ownerToken = createSession(owner.id);
    expect(requireUser(req(ownerToken), 'owner').role).toBe('owner');
    const rows = getDb().prepare('SELECT token_hash FROM sessions').all() as { token_hash: string }[];
    expect(rows.some((r) => r.token_hash === ownerToken)).toBe(false);
  });
});
