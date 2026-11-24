import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb, seedBusiness, seedCustomer } from './helpers';
import { addStamp, createCustomer, getCustomerView, redeem } from '@/lib/loyalty';
import { buildPass } from '@/lib/pass';
import { getDb } from '@/lib/db';
import { ApiError } from '@/lib/http';

function status(fn: () => unknown): number {
  try {
    fn();
  } catch (e) {
    if (e instanceof ApiError) return e.status;
    throw e;
  }
  return 0;
}

beforeEach(() => freshDb());

describe('createCustomer', () => {
  it('creates a customer with a pass url', () => {
    const { businessId } = seedBusiness();
    const r = createCustomer({ businessId, name: 'Anna', birthday: '2000-05-17' });
    expect(r.passUrl).toBe(`/card/${r.customerId}`);
    expect(getCustomerView(r.customerId)?.stamps).toBe(0);
  });
  it('rejects bad birthday and unknown business', () => {
    const { businessId } = seedBusiness();
    expect(status(() => createCustomer({ businessId, name: 'A', birthday: '2024-02-30' }))).toBe(400);
    expect(status(() => createCustomer({ businessId: 'nope', name: 'A' }))).toBe(404);
  });
});

describe('stamps and redeem', () => {
  it('stamps up to the cap without extra events', () => {
    const { businessId } = seedBusiness({ stampsRequired: 3 });
    const c = seedCustomer(businessId);
    expect(addStamp(businessId, c)).toEqual({ stamps: 1, redeemable: false });
    expect(addStamp(businessId, c)).toEqual({ stamps: 2, redeemable: false });
    expect(addStamp(businessId, c)).toEqual({ stamps: 3, redeemable: true });
    expect(addStamp(businessId, c)).toEqual({ stamps: 3, redeemable: true });
    const n = getDb().prepare("SELECT COUNT(*) AS n FROM stamp_events WHERE customer_id = ? AND kind='stamp'").get(c) as { n: number };
    expect(n.n).toBe(3);
  });
  it('redeem resets, second redeem is 409', () => {
    const { businessId } = seedBusiness({ stampsRequired: 2 });
    const c = seedCustomer(businessId);
    expect(status(() => redeem(businessId, c))).toBe(409);
    addStamp(businessId, c);
    addStamp(businessId, c);
    expect(redeem(businessId, c)).toEqual({ stamps: 0 });
    expect(getCustomerView(c)?.stamps).toBe(0);
    expect(status(() => redeem(businessId, c))).toBe(409);
  });
  it('other business gets 404', () => {
    const a = seedBusiness({ stampsRequired: 2 });
    const b = seedBusiness();
    const c = seedCustomer(a.businessId, { stamps: 2 });
    expect(status(() => addStamp(b.businessId, c))).toBe(404);
    expect(status(() => redeem(b.businessId, c))).toBe(404);
    expect(getCustomerView(c)?.stamps).toBe(2);
  });
});

describe('buildPass', () => {
  it('builds both platforms', () => {
    const { businessId } = seedBusiness({ name: 'Cafe X', stampsRequired: 5 });
    const c = seedCustomer(businessId, { name: 'Max', stamps: 2 });
    for (const platform of ['apple', 'google'] as const) {
      const p = buildPass(c, platform);
      expect(p).toMatchObject({
        platform,
        serialNumber: c,
        stamps: 2,
        stampsRequired: 5,
        businessName: 'Cafe X',
        customerName: 'Max',
        redeemable: false,
        barcode: { format: 'QR', message: c },
      });
      expect(typeof p.reward).toBe('string');
    }
    expect(status(() => buildPass('missing', 'apple'))).toBe(404);
  });
});
