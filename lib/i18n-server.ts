import { cookies, headers } from 'next/headers';
import { getMessages, getT, resolveLocale, type Catalog, type T } from './i18n';

export async function getServerI18n(): Promise<{ locale: string; t: T; messages: Catalog }> {
  const [c, h] = await Promise.all([cookies(), headers()]);
  const locale = resolveLocale({ cookie: c.get('locale')?.value ?? null, acceptLanguage: h.get('accept-language') });
  return { locale, t: getT(locale), messages: getMessages(locale) };
}
