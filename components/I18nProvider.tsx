'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { cookieValue, resolveLocale, translate, DEFAULT_LOCALE, type Catalog, type T } from '@/lib/i18n';

const Ctx = createContext<{ t: T; locale: string }>({ t: (k) => k, locale: 'en' });

// First render is always the prerendered `en` catalog (no hydration mismatch). After mount the
// locale is resolved from the `locale` cookie, then navigator.languages; non-en catalogs are
// fetched from /i18n/<locale>.json and merged over en.
export function I18nProvider(p: { locales: string[]; messages: Catalog; children: ReactNode }) {
  const [state, setState] = useState<{ locale: string; messages: Catalog }>({ locale: DEFAULT_LOCALE, messages: p.messages });

  useEffect(() => {
    const locale = resolveLocale(p.locales, {
      cookie: cookieValue(document.cookie, 'locale'),
      acceptLanguage: (navigator.languages?.length ? navigator.languages : [navigator.language]).filter(Boolean).join(','),
    });
    if (locale === DEFAULT_LOCALE) return;
    let cancelled = false;
    fetch(`/i18n/${encodeURIComponent(locale)}.json`)
      .then((r) => (r.ok ? (r.json() as Promise<Catalog>) : Promise.reject(new Error('catalog'))))
      .then((cat) => {
        if (cancelled) return;
        const messages = { ...p.messages, ...cat };
        document.documentElement.lang = locale;
        document.title = `${translate(messages, locale, 'common.appName')} – ${translate(messages, locale, 'common.tagline')}`;
        setState({ locale, messages });
      })
      .catch(() => {
        /* keep English */
      });
    return () => {
      cancelled = true;
    };
  }, [p.locales, p.messages]);

  const value = useMemo(
    () => ({ locale: state.locale, t: ((key, vars) => translate(state.messages, state.locale, key, vars)) as T }),
    [state],
  );
  return <Ctx.Provider value={value}>{p.children}</Ctx.Provider>;
}

export function useT(): { t: T; locale: string } {
  return useContext(Ctx);
}
