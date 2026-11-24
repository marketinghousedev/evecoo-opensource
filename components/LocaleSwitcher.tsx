'use client';

import { useT } from './I18nProvider';

export function LocaleSwitcher({ locales }: { locales: string[] }) {
  const { t, locale } = useT();
  if (locales.length < 2) return null;
  const nameOf = (l: string) => {
    try {
      return new Intl.DisplayNames([l], { type: 'language' }).of(l) ?? l;
    } catch {
      return l;
    }
  };
  return (
    <div className="container" style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 0 }}>
      <select
        className="input"
        style={{ width: 'auto', minHeight: 36, padding: '4px 8px' }}
        aria-label={t('locale.label')}
        value={locale}
        onChange={(e) => {
          document.cookie = `locale=${encodeURIComponent(e.target.value)}; path=/; max-age=31536000; samesite=lax`;
          window.location.reload();
        }}
      >
        {locales.map((l) => (
          <option key={l} value={l}>
            {nameOf(l)}
          </option>
        ))}
      </select>
    </div>
  );
}

export default LocaleSwitcher;
