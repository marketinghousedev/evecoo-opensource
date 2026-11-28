'use client';

import { useState } from 'react';
import { useT } from '@/components/I18nProvider';
import { LogoMark } from '../Logo';
import './faqb.css';

type Cat = 'start' | 'customers' | 'pricing' | 'privacy';
const CATS: [Cat, string][] = [['start', 'landing.faqb.c1'], ['customers', 'landing.faqb.c2'], ['pricing', 'landing.faqb.c3'], ['privacy', 'landing.faqb.c4']];
// Category of each existing FAQ entry (landing.faq.q<n> / a<n>).
const CATEGORY: Record<number, Cat> = {
  1: 'start', 2: 'start', 3: 'start', 4: 'start', 9: 'start', 11: 'start',
  7: 'customers', 8: 'customers', 10: 'customers', 12: 'customers',
  5: 'pricing', 6: 'pricing', 14: 'pricing',
  13: 'privacy',
};
const NUMS = Array.from({ length: 14 }, (_, i) => i + 1);

/** Lower-case and strip diacritics so "cafe" finds "Café" and "für" finds "fur". */
const fold = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function FaqB() {
  const { t } = useT();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState<Cat | 'all'>('all');
  const words = fold(q).split(/\s+/).filter(Boolean);
  const shown = NUMS.filter((n) => (cat === 'all' || CATEGORY[n] === cat) && (() => { const hay = fold(`${t(`landing.faq.q${n}`)} ${t(`landing.faq.a${n}`)}`); return words.every((w) => hay.includes(w)); })());
  const chip = (id: Cat | 'all', label: string) => (
    <button key={id} type="button" aria-pressed={cat === id} className={cat === id ? 'on' : ''} onClick={() => setCat(id)}>{label}</button>
  );
  return (
    <section className="sec faq fqb" id="faq">
      <div className="fqb-wrap">
        <h2 className="faq-h" data-reveal>{t('landing.faqb.title')}</h2>
        <p className="fqb-sub">{t('landing.faqb.sub')}</p>
        <div className="fqb-search">
          <label className="vh" htmlFor="fqb-q">{t('landing.faqb.search')}</label>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input id="fqb-q" type="search" value={q} placeholder={t('landing.faqb.placeholder')} autoComplete="off" onChange={(e) => setQ(e.target.value)} />
          {q && <button type="button" className="clr" aria-label={t('landing.faqb.reset')} onClick={() => setQ('')}>×</button>}
        </div>
        <div className="fqb-chips" role="group" aria-label={t('landing.faqb.cats')}>
          {chip('all', t('landing.faqb.all'))}
          {CATS.map(([id, key]) => chip(id, t(key)))}
        </div>
        <p className="fqb-count" aria-live="polite">{t('landing.faqb.count', { count: shown.length })}</p>
        {shown.length === 0 ? (
          <div className="fqb-none">
            <span className="av"><LogoMark size={32} /></span>
            <div className="a"><b>{t('landing.faqb.none')}</b><p>{t('landing.faqb.noneHelp')}</p><a className="btn btn-lg" href="#support">{t('landing.faqb.contact')}</a></div>
          </div>
        ) : (
          <ol className="fqb-chat">
            {shown.map((n) => (
              <li key={n}>
                <div className="qb"><p>{t(`landing.faq.q${n}`)}</p></div>
                <div className="ab"><span className="av" role="img" aria-label={t('landing.faqb.avatar')}><LogoMark size={32} /></span><p>{t(`landing.faq.a${n}`)}</p></div>
              </li>
            ))}
          </ol>
        )}
        <p className="faq-more">{t('landing.faq.more')} <a href="#support">{t('landing.faq.write')}</a></p>
      </div>
    </section>
  );
}
