import { getDb, tx } from './db';
import { getT } from './i18n';
import { deliver } from './messages';

const DAY_MS = 24 * 60 * 60 * 1000;

type Biz = { name: string; locale: string; card_reward: string };
type Cust = { id: string; name: string; birthday: string | null };

// MM-DD match on the UTC day; a 02-29 birthday is celebrated on 02-28 in non-leap years.
function birthdayMatches(birthday: string, now: Date): boolean {
  const md = birthday.slice(5);
  const pad = (n: number) => String(n).padStart(2, '0');
  const today = `${pad(now.getUTCMonth() + 1)}-${pad(now.getUTCDate())}`;
  if (md === today) return true;
  const y = now.getUTCFullYear();
  const leap = (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
  return md === '02-29' && !leap && today === '02-28';
}

export function runAutomations(businessId: string, now: Date): { sent: number } {
  const db = getDb();
  const day = now.toISOString().slice(0, 10);
  const nowIsoStr = now.toISOString();

  return tx(() => {
    const biz = db
      .prepare('SELECT name, locale, card_reward FROM businesses WHERE id = ?')
      .get(businessId) as Biz | undefined;
    if (!biz) return { sent: 0 };
    const t = getT(biz.locale);
    const customers = db
      .prepare('SELECT id, name, birthday FROM customers WHERE business_id = ?')
      .all(businessId) as unknown as Cust[];
    const lastStamp = db.prepare(
      "SELECT MAX(created_at) AS last FROM stamp_events WHERE customer_id = ? AND business_id = ? AND kind = 'stamp'",
    );
    const logInsert = db.prepare('INSERT OR IGNORE INTO automation_log(customer_id, kind, day) VALUES (?, ?, ?)');
    const logCount = db.prepare('SELECT COUNT(*) AS n FROM automation_log WHERE customer_id = ? AND kind = ? AND day > ?');
    const logAny = db.prepare('SELECT 1 AS x FROM automation_log WHERE customer_id = ? AND kind = ?');

    let sent = 0;
    const send = (c: Cust, kind: 'welcome' | 'winback' | 'birthday') => {
      const vars = { name: c.name, reward: biz.card_reward, business: biz.name };
      deliver(businessId, kind, t(`automations.${kind}.title`, vars), t(`automations.${kind}.body`, vars), [c.id], nowIsoStr);
      sent++;
    };
    const claim = (c: Cust, kind: string): boolean =>
      Number(logInsert.run(c.id, kind, day).changes) > 0;

    for (const c of customers) {
      const last = (lastStamp.get(c.id, businessId) as { last: string | null }).last;

      if (last && !logAny.get(c.id, 'welcome') && claim(c, 'welcome')) send(c, 'welcome');

      if (last && Date.parse(last) < now.getTime() - 30 * DAY_MS) {
        const prior = (logCount.get(c.id, 'winback', last.slice(0, 10)) as { n: number }).n;
        if (prior === 0 && claim(c, 'winback')) send(c, 'winback');
      }

      if (c.birthday && birthdayMatches(c.birthday, now) && claim(c, 'birthday')) send(c, 'birthday');
    }
    return { sent };
  });
}
