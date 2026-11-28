'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { formatPrice } from '@/lib/i18n';
import { Icon } from '../Icon';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { iconsUiCheckCircle } from '@/components/illustration/illo-data';
import { SectionHead } from '../Features';
import '../p8.css';
import './pricb.css';

const MONTHLY = 29;
// PRICING ASSUMPTION, TO CONFIRM before launch: the yearly plan is shown as 2 months free (10 x 29 = 290).
// There is no yearly plan in billing yet; change this constant (and confirm with the business owner) first.
const YEARLY = 290;
// Paper model assumptions (illustrative, shown to visitors as an example): cost per printed paper card
// including design share and cutting, and the share of cards that get lost and have to be reprinted.
const PRINT_COST = 0.18;
const LOST_RATE = 0.3;
const MIN = 50, MAX = 1500, STEP = 50, START = 500;

export function PricingB() {
  const { t, locale } = useT();
  const [cards, setCards] = useState(START);
  const [yearly, setYearly] = useState(false);
  const k = yearly ? 12 : 1;
  const print = cards * PRINT_COST * k;
  const lost = cards * LOST_RATE * PRINT_COST * k;
  const paper = print + lost;
  const biome = yearly ? YEARLY : MONTHLY;
  const save = paper - biome;
  const pct = paper > 0 ? Math.round((save / paper) * 100) : 0;
  const top = Math.max(paper, biome);
  const eur = (n: number) => formatPrice(locale, Math.round(n));
  const items = Array.from({ length: 15 }, (_, i) => i + 1);
  const per = yearly ? t('landing.pricb.perYear') : t('landing.pricb.perMonth');
  return (
    <section className="sec alt" id="pricing">
      <SectionHead eyebrow={t('landing.pricb.eyebrow')} t1={t('landing.pricb.title1')} t2={t('landing.pricb.title2')} sub={t('landing.pricb.sub')} />
      <div className="pcb" data-reveal>
        <div className="pcb-calc">
          <div className="pcb-row">
            <div className="pcb-tog" role="group" aria-label={t('landing.pricb.period')}>
              <button type="button" aria-pressed={!yearly} onClick={() => setYearly(false)}>{t('landing.pricb.monthly')}</button>
              <button type="button" aria-pressed={yearly} onClick={() => setYearly(true)}>{t('landing.pricb.yearly')}<em>{t('landing.pricb.yearlyNote')}</em></button>
            </div>
          </div>
          <label className="pcb-sl" htmlFor="pcb-range">
            <span>{t('landing.pricb.slider')}</span>
            <b>{t('landing.pricb.cards', { n: cards.toLocaleString('en-US') })}</b>
          </label>
          <input id="pcb-range" type="range" min={MIN} max={MAX} step={STEP} value={cards}
            style={{ ['--p' as string]: `${((cards - MIN) / (MAX - MIN)) * 100}%` }}
            onChange={(e) => setCards(Number(e.target.value))} aria-valuetext={t('landing.pricb.cards', { n: cards })} />

          <div className="pcb-bars" aria-live="polite">
            <div className="pcb-bar">
              <div className="hd"><span>{t('landing.pricb.paper')}</span><b>{eur(paper)}<small> {per}</small></b></div>
              <div className="track"><u className="print" style={{ width: `${(print / top) * 100}%` }} /><u className="lost" style={{ width: `${(lost / top) * 100}%` }} /></div>
              <div className="lg"><span><i className="print" />{t('landing.pricb.print')} {eur(print)}</span><span><i className="lost" />{t('landing.pricb.lost')} {eur(lost)}</span></div>
            </div>
            <div className="pcb-bar">
              <div className="hd"><span>{t('landing.pricb.biome')}</span><b>{eur(biome)}<small> {per}</small></b></div>
              <div className="track"><u className="biome" style={{ width: `${(biome / top) * 100}%` }} /></div>
            </div>
          </div>

          <div className={`pcb-save${save > 0 ? '' : ' none'}`}>
            {save > 0
              ? <><small>{t('landing.pricb.save')}</small><strong>{eur(save)}</strong><span>{t('landing.pricb.saveNote', { pct })}</span></>
              : <p>{t('landing.pricb.noSave')}</p>}
          </div>
          <p className="pcb-assume">{t('landing.pricb.assume', { print: PRINT_COST.toLocaleString(locale, { style: 'currency', currency: 'EUR' }), lost: Math.round(LOST_RATE * 100) })}</p>
          <div className="pcb-cta">
            <Link href="/signup" className="btn btn-lg">{t('landing.pricb.cta')} <Icon name="arrow_forward" size={20} /></Link>
            <small>{t('landing.pricb.nocc')}</small>
          </div>
        </div>
        <div className="pwhite pcb-list">
          <small className="ey">{t('landing.pricb.included')}</small>
          <ul>{items.map((i) => <li key={i}><IlloSvg data={iconsUiCheckCircle} className="ck" width={20} height={20} />{t(`landing.price.i${i}`)}</li>)}</ul>
          <p>{t('landing.price.foot')}</p>
        </div>
      </div>
    </section>
  );
}
