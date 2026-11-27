'use client';

import { useT } from '@/components/I18nProvider';
import { CardCarousel, type CarouselCopy } from './features/CardCarousel';
import { PushPhone, type PushCopy } from './features/PushPhone';
import { DashMini, type DashCopy } from './features/DashMini';
import './features/features.css';
import './p8.css';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import * as wm from './wordmarks';

export function SectionHead({ eyebrow, t1, t2, sub, id, br }: { eyebrow: string; t1: string; t2: string; sub?: string; id?: string; br?: boolean }) {
  return (
    <div className="sec-head" data-reveal>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id}>{t1}{br ? <br /> : ' '}<span className="blue">{t2}</span></h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

export function Logos() {
  const { t } = useT();
  const set = (hidden: boolean) => (
    <ul className="logo-set" aria-hidden={hidden || undefined}>
      {wm.WORDMARKS.map(([data, key]) => (
        <li key={key}><IlloSvg data={data} className="wm" title={hidden ? undefined : t(`landing.logos.${key}`)} /></li>
      ))}
    </ul>
  );
  return (
    <section className="logos">
      <p>{t('landing.logos.title')}</p>
      <div className="logo-marquee">
        <div className="logo-track">{set(false)}{set(true)}</div>
      </div>
    </section>
  );
}

export { QrMock } from './features/shared';

export function Features() {
  const { t } = useT();
  const carousel: CarouselCopy = { how: t('landing.feat.c1.how'), prev: t('landing.feat.c1.prev'), next: t('landing.feat.c1.next'), goto: t('landing.feat.c1.goto') };
  const push: PushCopy = {
    date: t('landing.feat.c2.date'),
    ago: [t('landing.feat.c2.now'), t('landing.feat.c2.ago2'), t('landing.feat.c2.ago3')],
    msgs: [1, 2, 3].map((i) => ({ shop: t(`landing.feat.c2.m${i}.shop`), title: t(`landing.feat.c2.m${i}.title`), body: t(`landing.feat.c2.m${i}.body`) })),
  };
  const dash: DashCopy = {
    ret: t('landing.feat.c3.ret'), retSub: t('landing.feat.c3.retSub', { a: '{a}', b: '{b}' }), cust: t('landing.feat.c3.cust'),
    week: t('landing.feat.c3.week', { n: '{n}' }), byTime: t('landing.feat.c3.byTime'), peak: t('landing.feat.c3.peak'),
    byDay: t('landing.feat.c3.byDay'), best: t('landing.feat.c3.best'), days: t('landing.feat.c3.days').split(','),
  };
  return (
    <section className="sec" id="features">
      <SectionHead eyebrow={t('landing.feat.eyebrow')} t1={t('landing.feat.title1')} t2={t('landing.feat.title2')} sub={t('landing.feat.sub')} />
      <div className="cards3">
        <article className="fcard fx-card" data-reveal>
          <h3>{t('landing.feat.c1.title')}</h3>
          <p>{t('landing.feat.c1.body')}</p>
          <CardCarousel copy={carousel} />
        </article>
        <article className="fcard fx-card" data-reveal>
          <h3>{t('landing.feat.c2.title')}</h3>
          <p>{t('landing.feat.c2.body')}</p>
          <PushPhone copy={push} />
        </article>
        <article className="fcard fx-card" data-reveal>
          <h3>{t('landing.feat.c3.title')}</h3>
          <p>{t('landing.feat.c3.body')}</p>
          <DashMini copy={dash} />
        </article>
      </div>
    </section>
  );
}
