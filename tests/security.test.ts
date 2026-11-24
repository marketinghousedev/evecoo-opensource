import { beforeEach, describe, expect, it, vi } from 'vitest';
import { freshDb, seedBusiness, seedCustomer, seedStamp } from './helpers';
import { createStaff, login, signup } from '@/lib/accounts';
import { createSession } from '@/lib/auth';
import { runAutomations } from '@/lib/automations';
import { getDb, newId, nowIso } from '@/lib/db';
import { ApiError, MAX_BODY_BYTES, readJson, route } from '@/lib/http';
import { listCustomerMessages } from '@/lib/messages';
import { POST as automationsRoute } from '@/app/api/automations/run/route';
import { POST as stampsRoute } from '@/app/api/stamps/route';
import { POST as redeemRoute } from '@/app/api/redeem/route';
import { GET as passRoute } from '@/app/api/pass/[customerId]/google/route';
import { GET as staffList } from '@/app/api/staff/route';

const ctx = { params: Promise.resolve({}) };
const post = (url: string, body: string | undefined, headers: Record<string, string> = {}) =>
  new Request('http://x' + url, { method: 'POST', body, headers });
const bearer = (t: string) => ({ authorization: `Bearer ${t}` });

beforeEach(() => freshDb());

describe('request body limits', () => {
  it('accepts a normal body and rejects oversized ones with 400 (declared or streamed)', async () => {
    expect(await readJson(post('/', JSON.stringify({ a: 1 })))).toEqual({ a: 1 });
    expect(await readJson(post('/', undefined))).toEqual({});
    const big = JSON.stringify({ a: 'x'.repeat(MAX_BODY_BYTES) });
    await expect(readJson(post('/', big))).rejects.toMatchObject({ status: 400, code: 'validation_error' });
    // No content-length header: the streamed read must still stop at the cap.
    const stream = new ReadableStream<Uint8Array>({
      start(c) {
        for (let i = 0; i < 10; i++) c.enqueue(new Uint8Array(MAX_BODY_BYTES / 4).fill(32));
        c.close();
      },
    });
    const req = new Request('http://x/', { method: 'POST', body: stream, duplex: 'half' } as RequestInit);
    await expect(readJson(req)).rejects.toBeInstanceOf(ApiError);
  });
});

describe('sessions and roles', () => {
  it('purges expired sessions when a new one is created', () => {
    const { owner } = seedBusiness();
    getDb()
      .prepare('INSERT INTO sessions(token_hash, user_id, created_at, expires_at) VALUES (?, ?, ?, ?)')
      .run('deadbeef', owner.id, nowIso(), new Date(Date.now() - 1000).toISOString());
    createSession(owner.id);
    const rows = getDb().prepare('SELECT token_hash FROM sessions').all() as { token_hash: string }[];
    expect(rows).toHaveLength(1);
    expect(rows[0].token_hash).not.toBe('deadbeef');
  });

  it('createStaff refuses a staff caller even if called directly', () => {
    const { owner } = seedBusiness();
    const staff = { ...owner, id: newId(), role: 'staff' as const };
    expect(() => createStaff(staff, { email: 's@x.io', password: 'password1' })).toThrow(
      expect.objectContaining({ status: 403 }),
    );
  });

  it('login gives the same error for unknown email and wrong password', () => {
    signup({ email: 'o@x.io', password: 'password1', businessName: 'A' }, 'en');
    const err = (fn: () => unknown) => {
      try {
        fn();
      } catch (e) {
        return e instanceof ApiError ? [e.status, e.code, e.messageKey] : e;
      }
      return null;
    };
    expect(err(() => login({ email: 'nobody@x.io', password: 'password1' }))).toEqual(
      err(() => login({ email: 'o@x.io', password: 'wrong-pass' })),
    );
  });

  it('500 responses do not leak internal error text', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const r = await route(() => {
      throw new Error('SQLITE secret detail /etc/passwd');
    })(new Request('http://x/'), ctx);
    spy.mockRestore();
    expect(r.status).toBe(500);
    const body = await r.text();
    expect(body).not.toContain('secret');
    expect(JSON.parse(body).error).toBe('internal');
  });
});

describe('tenant isolation over HTTP handlers', () => {
  it('staff of A cannot stamp/redeem B customers (404) and cannot list staff (403)', async () => {
    const a = signup({ email: 'a@x.io', password: 'password1', businessName: 'A' }, 'en');
    const b = signup({ email: 'b@x.io', password: 'password1', businessName: 'B' }, 'en');
    const ownerA = getDb().prepare("SELECT id FROM users WHERE email='a@x.io'").get() as { id: string };
    createStaff(
      { id: ownerA.id, email: 'a@x.io', role: 'owner', businessId: a.businessId, businessName: 'A' },
      { email: 'sa@x.io', password: 'password1' },
    );
    const staffTok = login({ email: 'sa@x.io', password: 'password1' }).token;
    const cB = seedCustomer(b.businessId, { stamps: 10 });
    const body = JSON.stringify({ customerId: cB });
    expect((await stampsRoute(post('/api/stamps', body, bearer(staffTok)), ctx)).status).toBe(404);
    expect((await redeemRoute(post('/api/redeem', body, bearer(staffTok)), ctx)).status).toBe(404);
    expect((await stampsRoute(post('/api/stamps', body, bearer(b.token)), ctx)).status).toBe(200);
    expect((await staffList(new Request('http://x/api/staff', { headers: bearer(staffTok) }), ctx)).status).toBe(403);
  });

  it('public pass exposes no birthday or business internals', async () => {
    const { businessId } = seedBusiness();
    const c = seedCustomer(businessId, { birthday: '1990-01-02' });
    const r = await passRoute(new Request('http://x/'), { params: Promise.resolve({ customerId: c }) });
    const text = await r.text();
    expect(r.status).toBe(200);
    expect(text).not.toContain('1990');
    expect(text).not.toContain(businessId);
    expect(text).not.toContain('@');
  });
});

describe('automations edge cases', () => {
  it('02-29 birthdays fire on 02-28 in non-leap years, on 02-29 in leap years, once per day', () => {
    const { businessId } = seedBusiness();
    const c = seedCustomer(businessId, { birthday: '2000-02-29' });
    expect(runAutomations(businessId, new Date('2027-02-27T12:00:00Z')).sent).toBe(0);
    expect(runAutomations(businessId, new Date('2027-02-28T12:00:00Z')).sent).toBe(1);
    expect(runAutomations(businessId, new Date('2027-02-28T13:00:00Z')).sent).toBe(0);
    expect(runAutomations(businessId, new Date('2028-02-28T12:00:00Z')).sent).toBe(0);
    expect(runAutomations(businessId, new Date('2028-02-29T12:00:00Z')).sent).toBe(1);
    expect(listCustomerMessages(c).every((m) => m.kind === 'birthday')).toBe(true);
  });

  it('route: auth before validation, rejects bad/out-of-range now, accepts microseconds', async () => {
    const s = signup({ email: 'o@x.io', password: 'password1', businessName: 'A' }, 'en');
    const run = (b: string | undefined, h: Record<string, string> = bearer(s.token)) =>
      automationsRoute(post('/api/automations/run', b, h), ctx);
    expect((await run(JSON.stringify({ now: 'nope' }), {})).status).toBe(401);
    for (const now of [42, 'nope', '+275760-09-13T00:00:00Z', '1969-12-31T00:00:00Z']) {
      expect((await run(JSON.stringify({ now }))).status).toBe(400);
    }
    const c = seedCustomer(s.businessId);
    seedStamp(s.businessId, c, '2027-01-01T10:00:00.000Z');
    const ok = await run(JSON.stringify({ now: '2027-02-10T10:00:00.123456Z' }));
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual({ sent: 2 });
    expect((await run(undefined)).status).toBe(200);
  });
});
