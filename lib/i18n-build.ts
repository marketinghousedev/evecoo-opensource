// Build-time only (uses fs). Never import from client components.
import fs from 'node:fs';
import path from 'node:path';
import { DEFAULT_LOCALE, type Catalog } from './i18n';

const dir = () => path.join(process.cwd(), 'messages');

export function availableLocales(): string[] {
  let list: string[] = [];
  try {
    list = fs
      .readdirSync(dir())
      .filter((f) => /^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(f))
      .map((f) => f.slice(0, -5));
  } catch {
    list = [];
  }
  if (!list.includes(DEFAULT_LOCALE)) list.push(DEFAULT_LOCALE);
  return list.sort();
}

// Only reads files for locales that exist in messages/ (no path traversal).
export function getMessages(locale: string): Catalog {
  const read = (l: string): Catalog => {
    try {
      return JSON.parse(fs.readFileSync(path.join(dir(), `${l}.json`), 'utf8')) as Catalog;
    } catch {
      return {};
    }
  };
  const en = read(DEFAULT_LOCALE);
  if (locale === DEFAULT_LOCALE || !availableLocales().includes(locale)) return en;
  return { ...en, ...read(locale) };
}
