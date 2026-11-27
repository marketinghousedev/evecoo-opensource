import { describe, expect, it } from 'vitest';
import { cookieValue, formatPrice, resolveLocale, translate, weekdayShort } from '@/lib/i18n';
import { availableLocales, getMessages } from '@/lib/i18n-build';

const getT = (locale: string) => {
  const m = getMessages(locale);
  return (key: string, vars?: Record<string, string | number>) => translate(m, locale, key, vars);
};

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
    const avail = availableLocales();
    expect(resolveLocale(avail, {})).toBe('en');
    expect(resolveLocale(avail, { cookie: 'zz', acceptLanguage: 'zz-ZZ,fr;q=0.8' })).toBe('en');
    expect(resolveLocale(avail, { cookie: '../../etc/passwd' })).toBe('en');
    expect(resolveLocale(avail, { acceptLanguage: 'en-GB,en;q=0.9' })).toBe('en');
    expect(resolveLocale(['de', 'en'], { cookie: 'de' })).toBe('de');
    expect(resolveLocale(['de', 'en'], { acceptLanguage: 'fr;q=0.9,de-AT;q=0.8' })).toBe('de');
    expect(cookieValue('a=1; locale=de', 'locale')).toBe('de');
  });

  it('formats price and weekday with Intl', () => {
    expect(formatPrice('en', 29)).toBe('€29');
    expect(formatPrice('de', 29).replace(/\s/g, ' ')).toBe('29 €');
    expect(weekdayShort('en', 0)).toBe('Mon');
  });
});
