'use client';

import Link from 'next/link';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { KeyboardEvent as RKeyboardEvent, PointerEvent as RPointerEvent, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useT } from '@/components/I18nProvider';
import { Icon } from '../Icon';
import { SectionHead } from '../Features';
import { AutoRows, WalletStack, LiveFeed, TeamRows, BdayPhone, NearMap } from '../bento/BentoVis';
import '../bento/bento.css';
import '../p8.css';
import './bentob.css';

const MAX_TILT = 6; // degrees
const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

type CardDef = { key: string; cls: string; vis: ReactNode };

function useCards(): CardDef[] {
  const { t } = useT();
  const live = {
    live: t('landing.bento.live.live'),
    names: [1, 2, 3, 4, 5].map((i) => t(`landing.bento.live.n${i}`)),
    actions: [1, 2, 3].map((i) => t(`landing.bento.live.e${i}`)),
    when: [0, 1, 2].map((i) => t(`landing.bento.live.w${i}`)),
  };
  return [
    { key: 'auto', cls: 'bx-auto-c', vis: <AutoRows copy={{ rows: [1, 2, 3].map((i) => ({ t: t(`landing.bento.auto.r${i}`), s: t(`landing.bento.auto.r${i}s`), m: t(`landing.bento.auto.r${i}m`) })), sent: t('landing.bento.auto.sent') }} /> },
    { key: 'wallet', cls: 'bx-wallet-c', vis: <WalletStack copy={{ apple: t('landing.bento.wallet.a'), google: t('landing.bento.wallet.g') }} /> },
    { key: 'live', cls: 'bx-live-c', vis: <LiveFeed copy={live} /> },
    { key: 'team', cls: 'bx-team-c', vis: <TeamRows copy={{ rows: [{ n: 'Sarah', r: t('landing.bento.team.r1') }, { n: 'Tom', r: t('landing.bento.team.r2') }], perms: [1, 2, 3].map((i) => t(`landing.bento.team.p${i}`)) }} /> },
    { key: 'bday', cls: 'bx-bday-c', vis: <BdayPhone copy={{ shop: t('landing.bento.bday.shop'), msg: t('landing.bento.bday.msg'), now: t('landing.bento.bday.now') }} /> },
    { key: 'near', cls: 'bx-near-c', vis: <NearMap copy={{ shop: t('landing.bento.near.shop'), msg: t('landing.bento.near.msg'), when: t('landing.bento.near.when'), live: t('landing.bento.live.live') }} /> },
  ];
}

/* 3D tilt toward the cursor with a spring return. Mouse only; never with reduced motion. */
function useTilt() {
  const ref = useRef<HTMLDivElement>(null);
  const s = useRef({ rx: 0, ry: 0, vx: 0, vy: 0, tx: 0, ty: 0, raf: 0 });
  const loop = useCallback(() => {
    const el = ref.current, o = s.current;
    if (!el) return;
    o.vx = (o.vx + (o.tx - o.rx) * 0.1) * 0.78;
    o.vy = (o.vy + (o.ty - o.ry) * 0.1) * 0.78;
    o.rx += o.vx; o.ry += o.vy;
    el.style.setProperty('--rx', `${o.rx.toFixed(3)}deg`);
    el.style.setProperty('--ry', `${o.ry.toFixed(3)}deg`);
    const rest = Math.abs(o.vx) + Math.abs(o.vy) + Math.abs(o.tx - o.rx) + Math.abs(o.ty - o.ry) < 0.01;
    o.raf = rest ? 0 : requestAnimationFrame(loop);
  }, []);
  const kick = () => { if (!s.current.raf) s.current.raf = requestAnimationFrame(loop); };
  useEffect(() => () => cancelAnimationFrame(s.current.raf), []);
  const onMove = (e: RPointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== 'mouse' || reduced()) return;
    const el = ref.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
    s.current.ty = (px - 0.5) * 2 * MAX_TILT;
    s.current.tx = -(py - 0.5) * 2 * MAX_TILT;
    el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`);
    el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`);
    el.dataset.hot = '';
    kick();
  };
  const onLeave = () => {
    s.current.tx = 0; s.current.ty = 0;
    ref.current?.removeAttribute('data-hot');
    kick();
  };
  return { ref, onMove, onLeave };
}

function Card({ def, onOpen }: { def: CardDef; onOpen: (key: string, el: HTMLElement) => void }) {
  const { t } = useT();
  const tilt = useTilt();
  const open = () => tilt.ref.current && onOpen(def.key, tilt.ref.current);
  const onKey = (e: RKeyboardEvent) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(); } };
  return (
    <div className="bxb-slot" data-reveal>
      <div
        ref={tilt.ref}
        className={`bx-card bxb-card ${def.cls}`}
        role="button"
        tabIndex={0}
        aria-haspopup="dialog"
        aria-label={`${t(`landing.bento.${def.key}.title`)}. ${t('landing.bentob.expand')}`}
        data-card={def.key}
        onPointerMove={tilt.onMove}
        onPointerLeave={tilt.onLeave}
        onClick={open}
        onKeyDown={onKey}
      >
        <span className="bxb-glow" aria-hidden="true" />
        <span className="bxb-hint" aria-hidden="true"><Icon name="open_in_full" size={16} /></span>
        <div className="bxb-vis" aria-hidden="true">{def.vis}</div>
        <div className="bx-txt"><h3>{t(`landing.bento.${def.key}.title`)}</h3><p>{t(`landing.bento.${def.key}.body`)}</p></div>
      </div>
    </div>
  );
}

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Overlay({ def, origin, onDone }: { def: CardDef; origin: HTMLElement; onDone: () => void }) {
  const { t } = useT();
  const id = useId();
  const panel = useRef<HTMLDivElement>(null);
  const shade = useRef<HTMLDivElement>(null);
  const closing = useRef(false);

  const flip = useCallback((to: 'open' | 'close') => {
    const p = panel.current, sh = shade.current;
    if (!p || !sh) return Promise.resolve();
    const a = origin.getBoundingClientRect();
    const b = p.getBoundingClientRect();
    const tf = `translate(${a.left - b.left}px, ${a.top - b.top}px) scale(${a.width / b.width}, ${a.height / b.height})`;
    const opts = { duration: 520, easing: 'cubic-bezier(.16,1,.3,1)', fill: 'both' as const };
    const dir = to === 'open' ? [tf, 'none'] : ['none', tf];
    const fade = to === 'open' ? [0, 1] : [1, 0];
    sh.animate({ opacity: fade }, { ...opts, duration: 320 });
    p.querySelectorAll('.bxb-fade').forEach((el) => el.animate({ opacity: to === 'open' ? [0, 1] : [1, 0] }, { duration: to === 'open' ? 320 : 160, delay: to === 'open' ? 200 : 0, easing: 'ease', fill: 'both' }));
    return p.animate({ transform: dir }, opts).finished.then(() => undefined);
  }, [origin]);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    if (reduced()) { onDone(); return; }
    flip('close').then(onDone, onDone);
  }, [flip, onDone]);

  useLayoutEffect(() => {
    if (!reduced()) flip('open');
    panel.current?.querySelector<HTMLElement>('.bxb-close')?.focus({ preventScroll: true });
  }, [flip]);

  useEffect(() => {
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); close(); return; }
      if (e.key !== 'Tab' || !panel.current) return;
      const f = Array.from(panel.current.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1], cur = document.activeElement;
      if (!panel.current.contains(cur)) { e.preventDefault(); first.focus(); }
      else if (e.shiftKey && cur === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && cur === last) { e.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKey, true);
    return () => { html.style.overflow = prev; document.removeEventListener('keydown', onKey, true); };
  }, [close]);

  return createPortal(
    <div className="bxb-ov landing" data-card={def.key}>
      <div ref={shade} className="bxb-shade" onClick={close} />
      <div ref={panel} className="bxb-panel" role="dialog" aria-modal="true" aria-labelledby={id}>
        <button type="button" className="bxb-close bxb-fade" onClick={close} aria-label={t('landing.bentob.close')}><Icon name="close" size={22} /></button>
        <div className={`bxb-demo bxb-fade bx-card-demo ${def.cls}`}>{def.vis}</div>
        <div className="bxb-info bxb-fade">
          <small className="ey">{t('landing.bentob.demo')}</small>
          <h3 id={id}>{t(`landing.bento.${def.key}.title`)}</h3>
          <p>{t(`landing.bento.${def.key}.body`)}</p>
          <Link href="/signup" className="btn btn-lg">{t('landing.cta.trial')} <Icon name="arrow_forward" size={20} /></Link>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export function BentoB() {
  const { t } = useT();
  const cards = useCards();
  const [open, setOpen] = useState<{ key: string; el: HTMLElement } | null>(null);
  const done = useCallback(() => {
    setOpen((o) => { o?.el.focus({ preventScroll: true }); return null; });
  }, []);
  const byKey = (k: string) => cards.find((c) => c.key === k)!;
  const col = (...keys: string[]) => (
    <div className="bx-col">{keys.map((k) => <Card key={k} def={byKey(k)} onOpen={(key, el) => setOpen({ key, el })} />)}</div>
  );
  return (
    <section className="sec alt" id="benefits">
      <SectionHead eyebrow={t('landing.bento.eyebrow')} t1={t('landing.bento.title1')} t2={t('landing.bento.title2')} sub={t('landing.bento.sub')} />
      <div className="bx-grid bxb-grid">
        {col('auto', 'team')}
        {col('wallet', 'bday')}
        {col('live', 'near')}
      </div>
      {open && <Overlay def={byKey(open.key)} origin={open.el} onDone={done} />}
    </section>
  );
}
