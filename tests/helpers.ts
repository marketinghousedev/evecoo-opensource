process.env.DB_PATH = ':memory:';

import { getDb, newId, nowIso, resetDb } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { getT } from '@/lib/i18n';
import type { SessionUser } from '@/lib/types';

export function freshDb(): void {
  process.env.DB_PATH = ':memory:';
  resetDb();
  getDb();
}

export function seedBusiness(
  over: Partial<{ name: string; stampsRequired: number }> = {},
): { businessId: string; owner: SessionUser } {
  const db = getDb();
  const businessId = newId();
  const userId = newId();
  const name = over.name ?? 'Testcafé';
  const email = `owner-${userId}@example.com`;
  const t = getT('en');
  db.prepare(
    'INSERT INTO businesses(id, name, locale, card_name, card_reward, stamps_required, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
  ).run(
    businessId,
    name,
    'en',
    t('defaults.cardName'),
    t('defaults.reward'),
    over.stampsRequired ?? 10,
    nowIso(),
  );
  db.prepare('INSERT INTO users(id, business_id, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    userId,
    businessId,
    email,
    hashPassword('password123'),
    'owner',
    nowIso(),
  );
  return { businessId, owner: { id: userId, email, role: 'owner', businessId, businessName: name } };
}

export function seedCustomer(
  businessId: string,
  over: Partial<{ name: string; birthday: string; stamps: number }> = {},
): string {
  const id = newId();
  getDb()
    .prepare('INSERT INTO customers(id, business_id, name, birthday, stamps, created_at) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, businessId, over.name ?? 'Erika Muster', over.birthday ?? null, over.stamps ?? 0, nowIso());
  return id;
}

export function seedStamp(businessId: string, customerId: string, createdAtIso: string): void {
  getDb()
    .prepare("INSERT INTO stamp_events(customer_id, business_id, kind, created_at) VALUES (?, ?, 'stamp', ?)")
    .run(customerId, businessId, createdAtIso);
}
