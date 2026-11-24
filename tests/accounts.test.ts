import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb } from './helpers';
import { createStaff, listStaff, login, signup } from '@/lib/accounts';
import { getUser, requireUser } from '@/lib/auth';
import { getCard, getPublicCard, updateCard } from '@/lib/card';
import { getDb } from '@/lib/db';
import { ApiError } from '@/lib/http';
import { POST as signupRoute } from '@/app/api/auth/signup/route';
import { POST as loginRoute } from '@/app/api/auth/login/route';
import { PUT as cardPut } from '@/app/api/card/route';

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request('http://x' + url, { method: 'POST', body: JSON.stringify(body), headers });
const ctx = { params: Promise.resolve({}) };

beforeEach(() => freshDb());

describe('accounts', () => {
  it('signup creates business with localized defaults and a working token', () => {
    const r = signup({ email: 'A@B.com', password: 'password1', businessName: 'Cafe' }, 'en');
    const u = getUser(new Request('http://x', { headers: { authorization: `Bearer ${r.token}` } }));
    expect(u?.businessId).toBe(r.businessId);
    expect(u?.email).toBe('a@b.com');
    const c = getCard(r.businessId);
    expect(c.name).toBe('Stamp card');
    expect(c.stampsRequired).toBe(10);
    const row = getDb().prepare('SELECT locale FROM businesses WHERE id = ?').get(r.businessId) as { locale: string };
    expect(row.locale).toBe('en');
  });

  it('duplicate email is 409 (case-insensitive)', () => {
    signup({ email: 'a@b.com', password: 'password1', businessName: 'Cafe' }, 'en');
    try {
      signup({ email: 'A@B.COM', password: 'password1', businessName: 'Other' }, 'en');
      expect.unreachable();
    } catch (e) {
      expect((e as ApiError).status).toBe(409);
      expect((e as ApiError).code).toBe('email_taken');
    }
  });

  it('stores a hashed password', () => {
    signup({ email: 'a@b.com', password: 'password1', businessName: 'Cafe' }, 'en');
    const h = (getDb().prepare('SELECT password_hash AS h FROM users').get() as { h: string }).h;
    expect(h).not.toBe('password1');
    expect(h.startsWith('scrypt$')).toBe(true);
  });

  it('login works for owner and staff, 401 otherwise', () => {
    const s = signup({ email: 'a@b.com', password: 'password1', businessName: 'Cafe' }, 'en');
    const owner = requireUser(new Request('http://x', { headers: { authorization: `Bearer ${s.token}` } }));
    expect(login({ email: 'a@b.com', password: 'password1' }).role).toBe('owner');
    createStaff(owner, { email: 'st@b.com', password: 'staffpass1' });
    expect(login({ email: 'ST@b.com', password: 'staffpass1' }).role).toBe('staff');
    for (const bad of [
      { email: 'a@b.com', password: 'no' },
      { email: 'nobody@b.com', password: 'password1' },
    ]) {
      try {
        login(bad);
        expect.unreachable();
      } catch (e) {
        expect((e as ApiError).status).toBe(401);
        expect((e as ApiError).code).toBe('invalid_credentials');
      }
    }
  });

  it('staff belongs to owner business, email space is global', () => {
    const s = signup({ email: 'a@b.com', password: 'password1', businessName: 'Cafe' }, 'en');
    const owner = requireUser(new Request('http://x', { headers: { authorization: `Bearer ${s.token}` } }));
    const { id } = createStaff(owner, { email: 'st@b.com', password: 'staffpass1' });
    expect(listStaff(s.businessId)).toEqual([{ id, email: 'st@b.com' }]);
    expect(() => createStaff(owner, { email: 'a@b.com', password: 'staffpass1' })).toThrow(ApiError);
    expect(listStaff('other')).toEqual([]);
  });

  it('card update and public card', () => {
    const s = signup({ email: 'a@b.com', password: 'password1', businessName: 'Cafe' }, 'en');
    const c = updateCard(s.businessId, { name: 'N', reward: 'R', stampsRequired: 5, color: '#112233' });
    expect(c).toEqual({ name: 'N', reward: 'R', stampsRequired: 5, color: '#112233' });
    const p = getPublicCard(s.businessId);
    expect(p).toMatchObject({ businessId: s.businessId, businessName: 'Cafe', stampsRequired: 5 });
    expect(() => getPublicCard('nope')).toThrow(ApiError);
  });
});

describe('routes', () => {
  it('login with short wrong password is 401, missing fields 400', async () => {
    signup({ email: 'a@b.com', password: 'password1', businessName: 'Cafe' }, 'en');
    expect((await loginRoute(post('/l', { email: 'a@b.com', password: 'no' }), ctx)).status).toBe(401);
    expect((await loginRoute(post('/l', { email: 'a@b.com' }), ctx)).status).toBe(400);
    expect((await loginRoute(post('/l', { email: 'a@b.com', password: 'password1' }), ctx)).status).toBe(200);
  });

  it('signup validation and 201', async () => {
    expect((await signupRoute(post('/s', { email: 'bad', password: 'password1', businessName: 'C' }), ctx)).status).toBe(400);
    expect((await signupRoute(post('/s', { email: 'a@b.com', password: 'short', businessName: 'C' }), ctx)).status).toBe(400);
    const r = await signupRoute(post('/s', { email: 'a@b.com', password: 'password1', businessName: 'C' }), ctx);
    expect(r.status).toBe(201);
  });

  it('card PUT rejects stampsRequired 99 and bad color, staff gets 403', async () => {
    const s = signup({ email: 'a@b.com', password: 'password1', businessName: 'Cafe' }, 'en');
    const h = { authorization: `Bearer ${s.token}` };
    const body = { name: 'N', reward: 'R', stampsRequired: 5, color: '#112233' };
    const put = (b: unknown, hh = h) =>
      cardPut(new Request('http://x/c', { method: 'PUT', body: JSON.stringify(b), headers: hh }), ctx);
    expect((await put({ ...body, stampsRequired: 99 })).status).toBe(400);
    expect((await put({ ...body, color: 'bad' })).status).toBe(400);
    expect((await put(body)).status).toBe(200);
    expect((await put(body, {} as never)).status).toBe(401);
    const owner = requireUser(new Request('http://x', { headers: h }));
    createStaff(owner, { email: 'st@b.com', password: 'staffpass1' });
    const st = login({ email: 'st@b.com', password: 'staffpass1' });
    expect((await put(body, { authorization: `Bearer ${st.token}` })).status).toBe(403);
  });
});
