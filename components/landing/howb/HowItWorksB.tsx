'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/components/I18nProvider';
import { SectionHead } from '../Features';
import { HowItWorksStory, STORY_END, STORY_STEP_AT } from '../howitworks/Story';
import { HOW_KEYS, type HowCopy } from '../howitworks/keys';
import './howb.css';

const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const STEP_P = STORY_STEP_AT.map((ms) => ms / STORY_END);

export function HowItWorksB() {
  const { t } = useT();
  const copy = Object.fromEntries(HOW_KEYS.map((k) => [k, t(`landing.how.${k}`)])) as HowCopy;
  const track = useRef<HTMLDivElement>(null);
  const fill = useRef<HTMLSpanElement>(null);
  const [p, setP] = useState(0);
  const [reduced, setReduced] = useState(false);
  const last = useRef(-1);

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReduced(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el || reduced) return;
    let raf = 0;
    const compute = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const span = r.height - window.innerHeight;
      const v = span > 0 ? clamp01(-r.top / span) : 0;
      if (fill.current) fill.current.style.transform = `scaleY(${v})`;
      // state only changes when the story time moves by a visible amount (~1/400 of the range)
      const q = Math.round(v * 400);
      if (q !== last.current) { last.current = q; setP(v); }
    };
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(compute); };
    compute();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); cancelAnimationFrame(raf); };
  }, [reduced]);

  const step = p >= STEP_P[2] ? 2 : p >= STEP_P[1] ? 1 : 0;
  const labels = [copy.s1, copy.s2, copy.s3];
  const titles = [t('landing.howb.t1'), t('landing.howb.t2'), t('landing.howb.t3')];
  const bodies = [t('landing.howb.b1'), t('landing.howb.b2'), t('landing.howb.b3')];

  if (reduced) {
    // stacked static steps: one complete phone state per step
    return (
      <section className="sec" id="how">
        <SectionHead eyebrow={t('landing.how.eyebrow')} t1={t('landing.how.title1')} t2={t('landing.how.title2')} sub={t('landing.how.sub')} />
        <ol className="hwb-stack">
          {[0, 1, 2].map((i) => (
            <li key={i} className="hwb-row">
              <div className="hwb-text">
                <span className="hwb-n">{i + 1}</span>
                <h3>{titles[i]}</h3>
                <p>{bodies[i]}</p>
              </div>
              <div className="hwb-phone"><HowItWorksStory c={copy} bare at={[7200, 13600, 20000][i]} /></div>
            </li>
          ))}
        </ol>
      </section>
    );
  }

  return (
    <section className="sec hwb-sec" id="how">
      <SectionHead eyebrow={t('landing.how.eyebrow')} t1={t('landing.how.title1')} t2={t('landing.how.title2')} sub={t('landing.how.sub')} />
      <div className="hwb-track" ref={track}>
        <div className="hwb-pin">
          <div className="hwb-grid">
            <ol className="hwb-rail" aria-label={t('landing.howb.progress')}>
              <span className="hwb-rail-line" aria-hidden="true"><span ref={fill} /></span>
              {labels.map((l, i) => (
                <li key={i} className={`hwb-rs${i === step ? ' is-active' : ''}${i < step ? ' is-done' : ''}`} aria-current={i === step ? 'step' : undefined}>
                  <span className="hwb-dot">{i + 1}</span>
                  <span className="hwb-lbl">{l}</span>
                </li>
              ))}
            </ol>
            <div className="hwb-phone"><HowItWorksStory c={copy} bare at={p * STORY_END} /></div>
            <div className="hwb-copy" aria-live="polite">
              {titles.map((tt, i) => (
                <div key={i} className={`hwb-step${i === step ? ' is-active' : ''}`} aria-hidden={i !== step}>
                  <span className="hwb-kick">{labels[i]}</span>
                  <h3>{tt}</h3>
                  <p>{bodies[i]}</p>
                </div>
              ))}
              <p className="hwb-hint">{t('landing.howb.hint')}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
