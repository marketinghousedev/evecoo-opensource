'use client';

import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { formatPrice } from '@/lib/i18n';
import { Icon } from './Icon';
import { SectionHead } from './Features';
import './p8.css';

export function Pricing() {
  const { t, locale } = useT();
  const items = Array.from({ length: 15 }, (_, i) => i + 1);
  return (
    <section className="sec alt" id="pricing">
      <SectionHead eyebrow={t('landing.price.eyebrow')} t1={t('landing.price.title1')} t2={t('landing.price.title2')} sub={t('landing.price.sub')} />
      <div className="price" data-reveal>
        <div className="pnavy">
          <div className="pn-top"><small className="ey">{t('landing.price.all')}</small><span className="free-pill"><i />{t('landing.price.free')}</span></div>
          <div className="amount"><b>{formatPrice(locale, 29)}</b><span>{t('landing.price.perMonth')}</span></div>
          <p>{t('landing.price.lt')}</p>
          <ul>{[1, 2, 3].map((i) => <li key={i}><Icon name="check_circle" size={18} fill />{t(`landing.price.n${i}`)}</li>)}</ul>
          <div className="pn-cta">
            <Link href="/signup" className="btn btn-white btn-lg wide">{t('landing.price.cta')} <Icon name="arrow_forward" size={20} /></Link>
            <small>{t('landing.price.nocc')}</small>
          </div>
        </div>
        <div className="pwhite">
          <small className="ey">{t('landing.price.included')}</small>
          <ul>{items.map((i) => <li key={i}><Icon name="check_circle" size={20} fill />{t(`landing.price.i${i}`)}</li>)}</ul>
          <p>{t('landing.price.foot')}</p>
        </div>
      </div>
    </section>
  );
}

export function Faq() {
  const { t } = useT();
  const cols = [[1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14]];
  return (
    <section className="sec faq" id="faq">
      <h2 className="faq-h" data-reveal>{t('landing.faq.title')}</h2>
      <div className="faq-grid">
        {cols.map((col, ci) => (
          <div key={ci}>
            {col.map((n) => (
              <details key={n} className="qa">
                <summary><span>{t(`landing.faq.q${n}`)}</span><Icon name="expand_more" size={22} /></summary>
                <p>{t(`landing.faq.a${n}`)}</p>
              </details>
            ))}
          </div>
        ))}
      </div>
      <p className="faq-more">{t('landing.faq.more')} <a href="#support">{t('landing.faq.write')}</a></p>
    </section>
  );
}
