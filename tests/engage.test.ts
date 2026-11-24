import { beforeEach, describe, expect, it } from 'vitest';
import { freshDb, seedBusiness, seedCustomer, seedStamp } from './helpers';
import { getDb } from '@/lib/db';
import { getT } from '@/lib/i18n';
import { listCustomerMessages, listMessages, sendBroadcast } from '@/lib/messages';
import { runAutomations } from '@/lib/automations';
import { getStats } from '@/lib/stats';
import { ApiError } from '@/lib/http';

const d = (s: string) => new Date(s);

describe('messages', () => {
  beforeEach(() => freshDb());

  it('broadcast reaches only own business customers', () => {
    const a = seedBusiness();
    const b = seedBusiness({ name: 'Other' });
    const c1 = seedCustomer(a.businessId);
    seedCustomer(a.businessId);
    const c3 = seedCustomer(b.businessId);
    expect(sendBroadcast(a.businessId, { title: 'Hi', body: 'There' })).toEqual({ recipients: 2 });
    expect(listMessages(a.businessId)).toHaveLength(1);
    expect(listMessages(a.businessId)[0].recipients).toBe(2);
    expect(listMessages(b.businessId)).toHaveLength(0);
    expect(listCustomerMessages(c1).map((m) => m.title)).toEqual(['Hi']);
    expect(listCustomerMessages(c3)).toEqual([]);
    expect(sendBroadcast(seedBusiness().businessId, { title: 'x', body: 'y' }).recipients).toBe(0);
  });

  it('unknown customer -> 404', () => {
    try {
      listCustomerMessages('nope');
      expect.unreachable();
    } catch (e) {
      expect((e as ApiError).status).toBe(404);
    }
  });
});

describe('automations', () => {
  beforeEach(() => freshDb());

  it('accept sequence', () => {
    const { businessId } = seedBusiness();
    const c = seedCustomer(businessId, { name: 'Anna', birthday: '1990-06-15' });
    seedStamp(businessId, c, '2027-01-01T10:00:00.000Z');
    const plus40 = d('2027-02-10T10:00:00.123456Z');
    expect(runAutomations(businessId, plus40)).toEqual({ sent: 2 });
    expect(runAutomations(businessId, plus40)).toEqual({ sent: 0 });
    expect(runAutomations(businessId, d('2027-06-15T09:00:00Z'))).toEqual({ sent: 1 });
    expect(runAutomations(businessId, d('2027-06-15T18:00:00Z'))).toEqual({ sent: 0 });
    const kinds = listCustomerMessages(c).map((m) => m.kind).sort();
    expect(kinds).toEqual(['birthday', 'welcome', 'winback']);
  });

  it('winback not at 29 days; re-armed after newer lapse', () => {
    const { businessId } = seedBusiness();
    const c = seedCustomer(businessId);
    seedStamp(businessId, c, '2027-01-01T10:00:00.000Z');
    expect(runAutomations(businessId, d('2027-01-30T10:00:00Z')).sent).toBe(1); // welcome only
    expect(runAutomations(businessId, d('2027-02-05T10:00:00Z')).sent).toBe(1); // winback
    expect(runAutomations(businessId, d('2027-02-06T10:00:00Z')).sent).toBe(0);
    seedStamp(businessId, c, '2027-02-10T10:00:00.000Z');
    expect(runAutomations(businessId, d('2027-02-20T10:00:00Z')).sent).toBe(0);
    expect(runAutomations(businessId, d('2027-03-20T10:00:00Z')).sent).toBe(1);
  });

  it('texts come from catalog in business locale', () => {
    const { businessId } = seedBusiness({ name: 'Bean' });
    const c = seedCustomer(businessId, { name: 'Max' });
    seedStamp(businessId, c, '2027-01-01T10:00:00.000Z');
    runAutomations(businessId, d('2027-01-02T10:00:00Z'));
    const row = getDb()
      .prepare('SELECT reward FROM (SELECT card_reward AS reward FROM businesses WHERE id = ?)')
      .get(businessId) as { reward: string };
    const t = getT('en');
    const vars = { name: 'Max', reward: row.reward, business: 'Bean' };
    const m = listCustomerMessages(c)[0];
    expect(m.title).toBe(t('automations.welcome.title', vars));
    expect(m.body).toBe(t('automations.welcome.body', vars));
    expect(m.body).toContain('Bean');
  });

  it('does not touch other businesses', () => {
    const a = seedBusiness();
    const b = seedBusiness();
    const cb = seedCustomer(b.businessId);
    seedStamp(b.businessId, cb, '2027-01-01T10:00:00.000Z');
    expect(runAutomations(a.businessId, d('2027-03-01T00:00:00Z')).sent).toBe(0);
  });
});

describe('stats', () => {
  beforeEach(() => freshDb());

  it('counts returning from events and buckets in Berlin time', () => {
    const { businessId } = seedBusiness();
    const c1 = seedCustomer(businessId);
    seedCustomer(businessId);
    seedCustomer(businessId);
    // 2027-01-04 is a Monday; 08:30Z = 09:30 Berlin (CET)
    seedStamp(businessId, c1, '2027-01-04T08:30:00.000Z');
    seedStamp(businessId, c1, '2027-01-10T22:30:00.000Z'); // Sun 22:30Z = Mon 23:30 Berlin
    getDb().prepare("INSERT INTO stamp_events(customer_id,business_id,kind,created_at) VALUES (?,?,'redeem',?)").run(c1, businessId, '2027-01-11T10:00:00.000Z');
    getDb().prepare('UPDATE customers SET stamps = 0 WHERE id = ?').run(c1);
    const s = getStats(businessId);
    expect(s.customers).toBe(3);
    expect(s.returning).toBe(1);
    expect(s.returningPercent).toBe(33);
    expect(s.visitsByHour).toHaveLength(24);
    expect(s.visitsByWeekday).toHaveLength(7);
    expect(s.visitsByHour[9]).toBe(1);
    expect(s.visitsByHour[23]).toBe(1);
    expect(s.visitsByWeekday[0]).toBe(1);
    expect(s.visitsByWeekday[6]).toBe(1);
  });

  it('empty business', () => {
    const s = getStats(seedBusiness().businessId);
    expect(s.returningPercent).toBe(0);
  });
});
