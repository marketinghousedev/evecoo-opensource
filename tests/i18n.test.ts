import { describe, expect, it } from 'vitest';
import {
  availableLocales,
  formatPrice,
  getMessages,
  getT,
  resolveLocale,
  translate,
  weekdayShort,
} from '@/lib/i18n';
import { ApiError, route } from '@/lib/http';
import { str } from '@/lib/validate';

describe('i18n', () => {
  it('interpolates variables', () => {
    expect(getT('en')('automations.welcome.title', { name: 'Ada' })).toBe('Welcome, Ada!');
    expect(getT('en')('card.progress', { stamps: 3, total: 10 })).toBe('3 / 10 stamps');
  });

  it('missing key returns the key; plural falls back to .other / category', () => {
    expect(translate({}, 'en', 'no.such')).toBe('no.such');
    const m = { 'n.one': '{count} item', 'n.other': '{count} items' };
    expect(translate(m, 'en', 'n', { count: 1 })).toBe('1 item');
    expect(translate(m, 'en', 'n', { count: 5 })).toBe('5 items');
    expect(translate({ 'n.other': 'many {count}' }, 'en', 'n', { count: 1 })).toBe('many 1');
  });

  it('falls back to en per key for other locales', () => {
    const en = getMessages('en');
    expect(getMessages('xx')).toEqual(en);
    expect(translate({ ...en, 'common.save': 'Speichern' }, 'de', 'common.cancel')).toBe(en['common.cancel']);
  });

  it('resolveLocale ignores unavailable locales and defaults to en', () => {
    expect(availableLocales()).toContain('en');
    expect(resolveLocale({})).toBe('en');
    expect(resolveLocale({ cookie: 'zz', acceptLanguage: 'zz-ZZ,fr;q=0.8' })).toBe('en');
    expect(resolveLocale({ cookie: '../../etc/passwd' })).toBe('en');
    expect(resolveLocale({ acceptLanguage: 'en-GB,en;q=0.9' })).toBe('en');
  });

  it('formats price and weekday with Intl', () => {
    expect(formatPrice('en', 29)).toBe('€29');
    expect(formatPrice('de', 29).replace(/\s/g, ' ')).toBe('29 €');
    expect(weekdayShort('en', 0)).toBe('Mon');
  });

  it('renders an ApiError through the catalog', async () => {
    const handler = route(() => {
      str({}, 'name', { min: 1, max: 5 });
      return new Response('x');
    });
    const res = await handler(new Request('http://x/'), { params: Promise.resolve({}) });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe('validation_error');
    expect(body.message).toBe('"name" must be text between 1 and 5 characters long.');

    const nf = route(() => {
      throw new ApiError(404, 'not_found', 'errors.notFound');
    });
    const r2 = await nf(new Request('http://x/'), { params: Promise.resolve({}) });
    expect((await r2.json()).message).toBe(getT('en')('errors.notFound'));
  });
});
