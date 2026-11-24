import { getDb } from './db';
import type { Stats } from './types';

const TZ = 'Europe/Berlin';
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const fmt = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hour: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
});

export function getStats(businessId: string): Stats {
  const db = getDb();
  const customers = Number(
    (db.prepare('SELECT COUNT(*) AS n FROM customers WHERE business_id = ?').get(businessId) as { n: number }).n,
  );
  const returning = Number(
    (
      db
        .prepare(
          `SELECT COUNT(*) AS n FROM (
             SELECT e.customer_id FROM stamp_events e JOIN customers c ON c.id = e.customer_id
             WHERE c.business_id = ? AND e.business_id = ? AND e.kind = 'stamp'
             GROUP BY e.customer_id HAVING COUNT(*) >= 2)`,
        )
        .get(businessId, businessId) as { n: number }
    ).n,
  );
  const visitsByHour = new Array<number>(24).fill(0);
  const visitsByWeekday = new Array<number>(7).fill(0);
  const rows = db
    .prepare("SELECT created_at FROM stamp_events WHERE business_id = ? AND kind = 'stamp'")
    .all(businessId) as { created_at: string }[];
  for (const r of rows) {
    const d = new Date(r.created_at);
    if (Number.isNaN(d.getTime())) continue;
    let hour = 0;
    let wd = '';
    for (const p of fmt.formatToParts(d)) {
      if (p.type === 'hour') hour = Number(p.value) % 24;
      else if (p.type === 'weekday') wd = p.value;
    }
    const wi = WEEKDAYS.indexOf(wd);
    if (wi >= 0) visitsByWeekday[wi]++;
    visitsByHour[hour]++;
  }
  return {
    customers,
    returning,
    returningPercent: customers > 0 ? Math.round((returning / customers) * 100) : 0,
    visitsByHour,
    visitsByWeekday,
  };
}
