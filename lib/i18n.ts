// fs/path are loaded lazily (server only) so client bundles can import the pure helpers here.
const fs = () => process.getBuiltinModule('node:fs');
const path = () => process.getBuiltinModule('node:path');

export type Vars = Record<string, string | number>;
export type T = (key: string, vars?: Vars) => string;
export type Catalog = Record<string, string>;

export const DEFAULT_LOCALE = 'en';

const dir = () => path().join(process.cwd(), 'messages');
const cache = new Map<string, Catalog>();
let localesCache: string[] | null = null;

export function availableLocales(): string[] {
  if (localesCache) return localesCache;
  let list: string[] = [];
  try {
    list = fs()
      .readdirSync(dir())
      .filter((f) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(f))
      .map((f) => f.slice(0, -5));
  } catch {
    list = [];
  }
  if (!list.includes(DEFAULT_LOCALE)) list.push(DEFAULT_LOCALE);
  localesCache = list.sort();
  return localesCache;
}

function readCatalog(locale: string): Catalog {
  const hit = cache.get(locale);
  if (hit) return hit;
  let data: Catalog = {};
  try {
    data = JSON.parse(fs().readFileSync(path().join(dir(), `${locale}.json`), 'utf8')) as Catalog;
  } catch {
    data = {};
  }
  cache.set(locale, data);
  return data;
}

// Only reads files for locales that exist in messages/ (no path traversal).
export function getMessages(locale: string): Catalog {
  const en = readCatalog(DEFAULT_LOCALE);
  if (locale === DEFAULT_LOCALE || !availableLocales().includes(locale)) return en;
  return { ...en, ...readCatalog(locale) };
}

function interpolate(text: string, vars?: Vars): string {
  if (!vars) return text;
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function translate(messages: Catalog, locale: string, key: string, vars?: Vars): string {
  let text = messages[key];
  if (text === undefined && vars && typeof vars.count === 'number') {
    let cat = 'other';
    try {
      cat = new Intl.PluralRules(locale).select(vars.count);
    } catch {
      /* fall back to other */
    }
    text = messages[`${key}.${cat}`] ?? messages[`${key}.other`];
  }
  if (text === undefined) return key;
  return interpolate(text, vars);
}

export function getT(locale: string): T {
  const messages = getMessages(locale);
  return (key, vars) => translate(messages, locale, key, vars);
}

function match(tag: string): string | null {
  const avail = availableLocales();
  const t = tag.trim().toLowerCase();
  if (!t) return null;
  const exact = avail.find((l) => l.toLowerCase() === t);
  if (exact) return exact;
  const base = t.split('-')[0];
  return avail.find((l) => l.toLowerCase() === base) ?? null;
}

export function resolveLocale(i: { cookie?: string | null; acceptLanguage?: string | null }): string {
  if (i.cookie) {
    const m = match(i.cookie);
    if (m) return m;
  }
  if (i.acceptLanguage) {
    const tags = i.acceptLanguage
      .split(',')
      .map((part) => {
        const [tag, ...params] = part.trim().split(';');
        const q = params.map((p) => /^\s*q=([\d.]+)/.exec(p)).find(Boolean);
        return { tag, q: q ? Number(q[1]) : 1 };
      })
      .filter((x) => x.tag && x.tag !== '*' && x.q > 0)
      .sort((a, b) => b.q - a.q);
    for (const { tag } of tags) {
      const m = match(tag);
      if (m) return m;
    }
  }
  return DEFAULT_LOCALE;
}

export function cookieValue(header: string | null | undefined, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0 && part.slice(0, idx).trim() === name) {
      try {
        return decodeURIComponent(part.slice(idx + 1).trim());
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function localeFromRequest(req: Request): string {
  return resolveLocale({
    cookie: cookieValue(req.headers.get('cookie'), 'locale'),
    acceptLanguage: req.headers.get('accept-language'),
  });
}

function safeLocale(locale: string): string {
  try {
    return Intl.NumberFormat.supportedLocalesOf(locale).length ? locale : DEFAULT_LOCALE;
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function formatPrice(locale: string, amount: number, currency = 'EUR'): string {
  return new Intl.NumberFormat(safeLocale(locale), {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(locale: string, iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat(safeLocale(locale), { dateStyle: 'medium' }).format(d);
}

// mondayIndex 0 = Monday ... 6 = Sunday. 2024-01-01 was a Monday.
export function weekdayShort(locale: string, mondayIndex: number): string {
  const d = new Date(Date.UTC(2024, 0, 1 + mondayIndex));
  return new Intl.DateTimeFormat(safeLocale(locale), { weekday: 'short', timeZone: 'UTC' }).format(d);
}
