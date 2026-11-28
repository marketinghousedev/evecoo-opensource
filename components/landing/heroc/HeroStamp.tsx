'use client';

import { useCallback, useEffect, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { Icon } from '../Icon';
import { HeroFlow } from '../hero/HeroFlow';
import { WalletPass } from '../WalletPass';
import { PASS_BY_SLUG, PASSES } from '../passes';
import { useBiz } from '../bizTheme';
import './heroc.css';

const N = 10;
const AV = ['#F4A261', '#E76F51', '#2A9D8F', '#264653'];
const CONFETTI = Array.from({ length: 34 }, (_, i) => {
  const a = (i / 34) * Math.PI * 2 + (i % 3) * 0.2;
  const r = 140 + ((i * 53) % 120);
  return { x: Math.cos(a) * r, y: Math.sin(a) * r * 0.8 - 40, rot: (i * 97) % 360, d: (i % 5) * 0.04, c: i % 4, w: 6 + (i % 3) * 3 };
});

/** Hero variant C: a big wallet pass the visitor stamps; at 10/10 it flies into a phone's Wallet. */
export function HeroStamp() {
  const { t } = useT();
  const biz = useBiz();
  const pass = PASS_BY_SLUG[biz?.pass ?? 'coffee'];
  const [k, setK] = useState(0);
  const [boom, setBoom] = useState(0);
  const [live, setLive] = useState(true);
  const root = useRef<HTMLElement>(null);
  const done = k >= N;

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setLive(e.isIntersecting), { threshold: 0.1 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const tap = useCallback(() => {
    setK((v) => {
      if (v >= N) return v;
      if (v + 1 >= N) setBoom((b) => b + 1);
      return v + 1;
    });
  }, []);
  const key = (e: KeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); tap(); } };
  const stack = PASSES.filter((p) => p.slug !== pass.slug).slice(0, 2);

  return (
    <section className={`hero hc${done ? ' is-done' : ''}`} ref={root} data-live={live || undefined}>
      <div className="hc-flow" aria-hidden="true">
        <HeroFlow
          bare
          copy={{
            once: t('landing.hero.once'), regulars: t('landing.hero.regulars'), label: t('landing.hero.flowLabel'),
            left: [t('landing.hero.walkin'), t('landing.hero.firstVisit'), t('landing.hero.oneTimeChip')],
            right: [t('landing.hero.newreg'), t('landing.hero.back'), t('landing.hero.plusStamp')],
          }}
        />
      </div>
      <div className="hc-in">
        <div className="hc-copy">
          <div className="proof">
            <span className="proof-faces">{AV.map((c) => <span key={c} style={{ background: c }} />)}</span>
            <span className="proof-txt">
              <span className="stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={13} fill />)}</span>
              <b>{t('landing.hero.badgeCount')}</b>
            </span>
          </div>
          <h1>
            {t('landing.hero.title1')} {t('landing.hero.title2')}{' '}
            <span className="blue">{t('landing.hero.title3')}</span>
          </h1>
          <p className="hero-sub">{t('landing.hero.sub1')} {t('landing.hero.sub2')}</p>
          <div>
            <Link href="/signup" className="btn btn-xl btn-glow">{t('landing.cta.create')} <Icon name="arrow_forward" size={22} /></Link>
          </div>
          <p className="hero-note">
            <Icon name="lock" size={15} fill /> <span>{t('landing.hero.note1')}</span>
            <i className="sep" /> <span>{t('landing.hero.note2')}</span>
          </p>
        </div>

        <div className="hc-stage" style={{ '--hc-accent': 'var(--biz-accent, var(--brand))' } as CSSProperties}>
          <div className="hc-phone" aria-hidden="true">
            <i className="hc-notch" />
            <b className="hc-wtitle">{t('landing.heroC.wallet')}</b>
            {stack.map((p, i) => (
              <span key={p.slug} className="hc-mini" style={{ background: p.bg, color: p.fg, '--i': i } as CSSProperties}>{p.name}</span>
            ))}
          </div>
          <div
            className="hc-card"
            role="button"
            tabIndex={done ? -1 : 0}
            aria-disabled={done || undefined}
            aria-label={done ? t('landing.heroC.done') : t('landing.heroC.aria', { a: k, b: N })}
            onClick={tap}
            onKeyDown={key}
          >
            <WalletPass pass={pass} filled={k} required={N} />
          </div>
          <div className="hc-boom" key={boom} aria-hidden="true">
            {boom > 0 && CONFETTI.map((c, i) => (
              <i key={i} className={`c${c.c}`} style={{ '--x': `${c.x}px`, '--y': `${c.y}px`, '--r': `${c.rot}deg`, '--dl': `${c.d}s`, width: c.w, height: c.w * 1.6 } as CSSProperties} />
            ))}
          </div>
          <div className="hc-under" aria-live="polite">
            {done ? <span className="hc-msg">{t('landing.heroC.done')}</span> : <span className="hc-hint">{k === 0 ? t('landing.heroC.hint') : t('landing.heroC.count', { a: k, b: N })}</span>}
            {k > 0 && <button type="button" className="hc-reset" onClick={() => setK(0)}>{t('landing.heroC.reset')}</button>}
          </div>
        </div>
      </div>
    </section>
  );
}
