import { getDb, newId, nowIso, tx } from './db';
import { ApiError } from './http';
import { isoDate, str } from './validate';
import type { CustomerView, StampResult } from './types';

type CustomerRow = { stamps: number; stamps_required: number };

function notFound(): never {
  throw new ApiError(404, 'not_found', 'errors.notFound');
}

export function createCustomer(i: {
  businessId: string;
  name: string;
  birthday?: string;
}): { customerId: string; passUrl: string } {
  const name = str({ name: i.name }, 'name', { min: 1, max: 80 });
  const birthday = isoDate({ birthday: i.birthday }, 'birthday');
  const db = getDb();
  const biz = db.prepare('SELECT id FROM businesses WHERE id = ?').get(i.businessId);
  if (!biz) notFound();
  const id = newId();
  db.prepare('INSERT INTO customers(id, business_id, name, birthday, stamps, created_at) VALUES (?, ?, ?, ?, 0, ?)').run(
    id,
    i.businessId,
    name,
    birthday ?? null,
    nowIso(),
  );
  return { customerId: id, passUrl: `/card/${id}` };
}

function loadOwned(businessId: string, customerId: string): CustomerRow {
  const row = getDb()
    .prepare(
      `SELECT c.stamps AS stamps, b.stamps_required AS stamps_required
       FROM customers c JOIN businesses b ON b.id = c.business_id
       WHERE c.id = ? AND c.business_id = ?`,
    )
    .get(customerId, businessId) as CustomerRow | undefined;
  if (!row) notFound();
  return row;
}

export function addStamp(businessId: string, customerId: string): StampResult {
  return tx(() => {
    const row = loadOwned(businessId, customerId);
    const cap = row.stamps_required;
    if (row.stamps >= cap) return { stamps: cap, redeemable: true };
    const next = row.stamps + 1;
    const db = getDb();
    db.prepare('UPDATE customers SET stamps = ? WHERE id = ? AND business_id = ?').run(next, customerId, businessId);
    db.prepare("INSERT INTO stamp_events(customer_id, business_id, kind, created_at) VALUES (?, ?, 'stamp', ?)").run(
      customerId,
      businessId,
      nowIso(),
    );
    return { stamps: next, redeemable: next >= cap };
  });
}

export function redeem(businessId: string, customerId: string): { stamps: 0 } {
  return tx(() => {
    const row = loadOwned(businessId, customerId);
    if (Math.min(row.stamps, row.stamps_required) < row.stamps_required) {
      throw new ApiError(409, 'not_redeemable', 'errors.notRedeemable');
    }
    const db = getDb();
    db.prepare('UPDATE customers SET stamps = 0 WHERE id = ? AND business_id = ?').run(customerId, businessId);
    db.prepare("INSERT INTO stamp_events(customer_id, business_id, kind, created_at) VALUES (?, ?, 'redeem', ?)").run(
      customerId,
      businessId,
      nowIso(),
    );
    return { stamps: 0 as const };
  });
}

export function getCustomerView(customerId: string): CustomerView | null {
  const r = getDb()
    .prepare(
      `SELECT c.id AS id, c.name AS name, c.stamps AS stamps, b.stamps_required AS req, b.card_reward AS reward,
              b.name AS business_name, b.card_name AS card_name, b.card_color AS color
       FROM customers c JOIN businesses b ON b.id = c.business_id WHERE c.id = ?`,
    )
    .get(customerId) as
    | {
        id: string;
        name: string;
        stamps: number;
        req: number;
        reward: string;
        business_name: string;
        card_name: string;
        color: string;
      }
    | undefined;
  if (!r) return null;
  const stamps = Math.min(r.stamps, r.req);
  return {
    customerId: r.id,
    name: r.name,
    stamps,
    stampsRequired: r.req,
    redeemable: stamps >= r.req,
    reward: r.reward,
    businessName: r.business_name,
    cardName: r.card_name,
    color: r.color,
  };
}
