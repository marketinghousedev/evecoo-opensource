'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { translate, type Catalog, type T } from '@/lib/i18n';

const Ctx = createContext<{ t: T; locale: string }>({ t: (k) => k, locale: 'en' });

export function I18nProvider(p: { locale: string; messages: Catalog; children: ReactNode }) {
  const value = useMemo(
    () => ({ locale: p.locale, t: ((key, vars) => translate(p.messages, p.locale, key, vars)) as T }),
    [p.locale, p.messages],
  );
  return <Ctx.Provider value={value}>{p.children}</Ctx.Provider>;
}

export function useT(): { t: T; locale: string } {
  return useContext(Ctx);
}
