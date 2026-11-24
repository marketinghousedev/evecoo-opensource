import { getDb, newId, nowIso, tx } from './db';
import { ApiError } from './http';
import type { CustomerMessage, MessageKind, MessageSummary } from './types';

// Inserts one message plus a recipient row per customer. Caller owns the transaction.
export function deliver(
  businessId: string,
  kind: MessageKind,
  title: string,
  body: string,
  customerIds: string[],
  createdAt: string,
): string {
  const db = getDb();
  const id = newId();
  db.prepare('INSERT INTO messages(id, business_id, title, body, kind, created_at) VALUES (?, ?, ?, ?, ?, ?)').run(
    id,
    businessId,
    title,
    body,
    kind,
    createdAt,
  );
  const ins = db.prepare('INSERT OR IGNORE INTO message_recipients(message_id, customer_id) VALUES (?, ?)');
  for (const cid of customerIds) ins.run(id, cid);
  return id;
}

export function sendBroadcast(businessId: string, i: { title: string; body: string }): { recipients: number } {
  return tx(() => {
    const rows = getDb().prepare('SELECT id FROM customers WHERE business_id = ?').all(businessId) as { id: string }[];
    const ids = rows.map((r) => r.id);
    deliver(businessId, 'broadcast', i.title, i.body, ids, nowIso());
    return { recipients: ids.length };
  });
}

export function listMessages(businessId: string): MessageSummary[] {
  const rows = getDb()
    .prepare(
      `SELECT m.id, m.title, m.body, m.kind, m.created_at AS createdAt,
        (SELECT COUNT(*) FROM message_recipients r WHERE r.message_id = m.id) AS recipients
       FROM messages m WHERE m.business_id = ? ORDER BY m.created_at DESC, m.rowid DESC`,
    )
    .all(businessId) as unknown as MessageSummary[];
  return rows.map((r) => ({
    id: r.id,
    title: r.title,
    body: r.body,
    kind: r.kind,
    recipients: Number(r.recipients),
    createdAt: r.createdAt,
  }));
}

export function listCustomerMessages(customerId: string): CustomerMessage[] {
  const db = getDb();
  const c = db.prepare('SELECT id FROM customers WHERE id = ?').get(customerId);
  if (!c) throw new ApiError(404, 'not_found', 'errors.notFound');
  const rows = db
    .prepare(
      `SELECT m.id, m.title, m.body, m.kind, m.created_at AS createdAt
       FROM message_recipients r JOIN messages m ON m.id = r.message_id
       WHERE r.customer_id = ? ORDER BY m.created_at DESC, m.rowid DESC`,
    )
    .all(customerId) as unknown as CustomerMessage[];
  return rows.map((r) => ({ id: r.id, title: r.title, body: r.body, kind: r.kind, createdAt: r.createdAt }));
}
