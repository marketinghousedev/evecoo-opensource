'use client';

import { useT } from '@/components/I18nProvider';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { PASS_BY_SLUG } from '../passes';
import { BIZ, setBiz, useBiz, accentOf } from '../bizTheme';
import './logosb.css';

/** Logos variant B: pick your business; the hero pass and the feature carousel follow. */
export function LogosPicker() {
  const { t } = useT();
  const cur = useBiz();
  const curPass = cur ? PASS_BY_SLUG[cur.pass] : null;
  return (
    <section className="logos lb" aria-labelledby="lb-title">
      <p id="lb-title">{t('landing.biz.title')}</p>
      <div className="lb-rail" role="group" aria-label={t('landing.biz.title')}>
        {BIZ.map((b) => {
          const p = PASS_BY_SLUG[b.pass];
          const on = cur?.id === b.id;
          return (
            <button
              key={b.id}
              type="button"
              className="lb-chip"
              aria-pressed={on}
              style={{ '--chip': accentOf(p) } as React.CSSProperties}
              onClick={() => setBiz(on ? null : b.id)}
            >
              <IlloSvg data={p.mark} className="lb-mark" />
              {t(b.msg)}
            </button>
          );
        })}
      </div>
      <p className="lb-live" aria-live="polite">
        {curPass ? t('landing.biz.live', { name: curPass.name }) : t('landing.biz.hint')}
        {cur && <button type="button" className="lb-clear" onClick={() => setBiz(null)}>{t('landing.biz.clear')}</button>}
      </p>
    </section>
  );
}
