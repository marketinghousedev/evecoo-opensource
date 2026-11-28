'use client';

import { Fragment, useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { backgroundsPosterCoffeeHills } from '@/components/illustration/illo-data';
import { Icon } from '../Icon';
import { HeroFlow } from '../hero/HeroFlow';
import {
  GW, GH, INTRO_START, DEFAULT_COLORS, bowlTarget, paintBowl, collectChars, paintChars, clamp, smooth, hex,
  type Bowl, type BowlColors, type RevealColors,
} from './bowl';
import './herob.css';

/** Set to a photo URL to replace the coffee-hills landscape in the dark split. */
export const SPLIT_PHOTO_SRC: string | undefined = undefined;

const AV = ['#F4A261', '#E76F51', '#2A9D8F', '#264653', '#8E7DBE'];
type Part = string | { hl: string } | null; // null = <br>

function Split({ parts }: { parts: Part[] }) {
  const sr = parts.map((p) => (p === null ? ' ' : typeof p === 'string' ? p : p.hl)).join('').replace(/\s+/g, ' ').trim();
  const words = (text: string, hl: boolean) =>
    text.split(/(\s+)/).map((w, i) =>
      /^\s+$/.test(w) || w === '' ? w : (
        <span className="w" key={i}>
          {Array.from(w).map((c, j) => <span key={j} className={hl ? 'ch hl' : 'ch'} style={{ opacity: 0 }}>{c}</span>)}
        </span>
      ),
    );
  return (
    <>
      <span className="hb-sr">{sr}</span>
      <span aria-hidden="true">
        {parts.map((p, i) =>
          p === null ? <Fragment key={i}><br />{' '}</Fragment>
            : <Fragment key={i}>{typeof p === 'string' ? words(p, false) : words(p.hl, true)}</Fragment>,
        )}
      </span>
    </>
  );
}

/** Fixed background layer for variant B. Rendered before <main> (main sits above it, z-index 1). */
export function BowlAtmo() {
  return (
    <div className="atmo" id="atmo" aria-hidden="true">
      <canvas id="bg" width={GW} height={GH} />
    </div>
  );
}

const cssHex = (cs: CSSStyleDeclaration, name: string, fb: string) => hex(cs.getPropertyValue(name).trim() || fb);

export function HeroBowl() {
  const { t } = useT();
  const appName = t('common.appName');
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const $ = <T extends HTMLElement>(sel: string) => el.querySelector<T>(sel);
    const hero = $('.hb-hero')!, stmt = $('#stmt')!, split = $('.hb-split')!, h2 = $('#h2')!, row = $('.hb-split .row')!, img = $('.hb-split .img')!;
    const atmo = document.getElementById('atmo')!;
    const canvas = document.getElementById('bg') as HTMLCanvasElement;
    const ctx = canvas.getContext('2d')!;
    const imageData = ctx.createImageData(GW, GH);
    const nav = document.querySelector<HTMLElement>('.site-nav');
    const rm = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const cs = getComputedStyle(document.documentElement);
    const cyan = cssHex(cs, '--glow-bowl-cyan', '#8fd5f1');
    const colors: BowlColors = { white: [255, 255, 255], lilac: cssHex(cs, '--glow-bowl-lilac', '#d2daff'), cyan };
    const accent = cssHex(cs, '--glow-accent', '#3f7cff'), hl = cssHex(cs, '--glow-hl', '#5b7cf0');
    const ink = cssHex(cs, '--on-surface', '#071130');
    const dark: RevealColors = { final: [255, 255, 255], hl, accent: cssHex(cs, '--glow-accent-cyan', '#8fe6f4'), ghost: cssHex(cs, '--glow-ghost', '#5c6f92') };
    const light: RevealColors = { final: ink, hl, accent, ghost: [255, 255, 255] };

    const cH1 = collectChars($('#h1')!), cSt = collectChars(stmt), cH2 = collectChars(h2);
    const h1p = (p: number) => paintChars(cH1, p, 0.35, light);
    const stp = (p: number) => paintChars(cSt, p, 0.16, light);
    const h2p = (p: number) => paintChars(cH2, p, 0.35, dark);

    let aspect = innerWidth / innerHeight;
    let cur: Bowl = { ...bowlTarget(0) };
    let tgt: Bowl = { ...cur };
    const draw = (drift: { t: number } | null) => {
      const solid = paintBowl(imageData.data, cur, aspect, drift, colors);
      ctx.putImageData(imageData, 0, 0);
      return solid;
    };
    const rgbHex = '#' + cyan.map((v) => v.toString(16).padStart(2, '0')).join('');

    /* reduced motion: draw the q=0 bowl once, everything else in its final state */
    if (rm) {
      el.classList.add('hb-rm');
      hero.classList.add('hb-ready');
      h1p(1); stp(1); h2p(1);
      row.classList.add('in');
      draw(null);
      const onResize = () => { aspect = innerWidth / innerHeight; draw(null); };
      addEventListener('resize', onResize);
      return () => { removeEventListener('resize', onResize); el.classList.remove('hb-rm'); };
    }

    h1p(0); stp(0); h2p(0);
    draw(null);

    let splitOff = 0;
    const measure = () => {
      aspect = innerWidth / innerHeight;
      const off = hero.getBoundingClientRect().top + scrollY;
      el.style.setProperty('--hb-top', `${Math.max(0, off)}px`);
      splitOff = split.getBoundingClientRect().top + scrollY;
    };
    measure();

    let raf = 0, running = false, solidStopped = false, introStart = -1, introDone = false, hidden = document.hidden;
    let y = scrollY, q = y / innerHeight, navOn = false, rowOn = false;
    const win = window as unknown as { __bowlFrames?: number };
    win.__bowlFrames = 0;

    const active = () => !hidden && y < splitOff;
    const stop = () => { if (raf) cancelAnimationFrame(raf); raf = 0; running = false; };

    const frame = (now: number) => {
      raf = 0;
      if (introStart < 0) introStart = now;
      const e = now - introStart;
      if (!introDone) {
        h1p(clamp(e / 1250));
        const u = smooth((e - 250) / 1050);
        cur = {
          tip: INTRO_START.tip + (tgt.tip - INTRO_START.tip) * u,
          half: INTRO_START.half + (tgt.half - INTRO_START.half) * u,
          soft: INTRO_START.soft + (tgt.soft - INTRO_START.soft) * u,
        };
        if (e >= 1300) { introDone = true; h1p(1); }
      } else {
        cur.tip += (tgt.tip - cur.tip) * 0.12;
        cur.half += (tgt.half - cur.half) * 0.12;
        cur.soft += (tgt.soft - cur.soft) * 0.12;
      }
      win.__bowlFrames!++;
      const solid = draw({ t: now });
      if (solid && introDone) { atmo.style.background = rgbHex; solidStopped = true; running = false; return; }
      if (!active()) { running = false; return; }
      raf = requestAnimationFrame(frame);
    };
    const start = () => {
      if (running || !active()) return;
      running = true; solidStopped = false;
      atmo.style.background = '#fff';
      raf = requestAnimationFrame(frame);
    };

    const onScroll = () => {
      y = scrollY; // read once
      const ih = innerHeight;
      q = y / ih;
      tgt = bowlTarget(q);
      const s = clamp((q - 0.69) / 0.74);
      stmt.style.transform = `translateY(${(0.205 * (1 - s) * (1 - s) * ih).toFixed(1)}px)`;
      const p = clamp((q - 0.56) / 2.03);
      stp(p);
      const on = p > 0.4;
      if (on !== navOn) { navOn = on; nav?.classList.toggle('on', on); }
      const top = splitOff - y;
      h2p(clamp((0.8 - top / ih) / 0.65));
      const rIn = clamp((0.8 - top / ih) / 0.65) > 0.92;
      if (rIn !== rowOn) { rowOn = rIn; row.classList.toggle('in', rIn); }
      img.style.transform = `scale(${(1.08 - 0.08 * clamp(1 - top / ih)).toFixed(4)})`;
      if (!running && introDone && (!solidStopped || q < 1.43)) start();
    };
    let ticking = false;
    const onScrollRaf = () => { if (ticking) return; ticking = true; requestAnimationFrame(() => { ticking = false; onScroll(); }); };
    const onResize = () => { measure(); onScroll(); if (!running) draw(null); };
    const onVis = () => { hidden = document.hidden; if (hidden) stop(); else { onScroll(); start(); } };

    /* first rAF: ready, intro and canvas loop; paint h1 at p=0 until then */
    const boot = requestAnimationFrame(() => {
      hero.classList.add('hb-ready');
      onScroll();
      running = true;
      raf = requestAnimationFrame(frame);
    });
    addEventListener('scroll', onScrollRaf, { passive: true });
    addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVis);
    const ro = new ResizeObserver(() => { measure(); onScroll(); });
    ro.observe(document.body);

    return () => {
      cancelAnimationFrame(boot); stop(); ro.disconnect();
      removeEventListener('scroll', onScrollRaf); removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVis);
      nav?.classList.remove('on');
      atmo.style.background = '';
    };
  }, []);

  const d = (s: string) => ({ '--d': s }) as CSSProperties;
  return (
    <div ref={root} className="hb">
      <section className="hb-hero">
        <div className="hb-in">
          <div className="proof hb-fu" style={d('.15s')}>
            <span className="proof-faces">{[0, 1, 2, 3].map((i) => <span key={i} style={{ background: AV[i] }} />)}</span>
            <span className="proof-txt">
              <span className="stars" aria-hidden="true">{[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={13} fill />)}</span>
              <b>{t('landing.hero.badgeCount')}</b>
            </span>
          </div>
          <h1 id="h1">
            <Split parts={[t('landing.hero.title1'), ' ', null, t('landing.hero.title2'), ' ', null, { hl: t('landing.hero.title3') }]} />
          </h1>
          <p className="hero-sub hb-fu" style={d('.55s')}>
            {t('landing.hero.sub1')}{' '}<br />{t('landing.hero.sub2')}
          </p>
          <div className="hb-fu" style={d('.7s')}>
            <Link href="/signup" className="btn btn-xl btn-glow">{t('landing.cta.create')} <Icon name="arrow_forward" size={22} /></Link>
          </div>
          <p className="hero-note hb-fu" style={d('.85s')}>
            <Icon name="lock" size={15} fill /> <span>{t('landing.hero.note1')}</span>
            <i className="sep" /> <span>{t('landing.hero.note2')}</span>
          </p>
        </div>
        <div className="hb-flow hb-fu" style={d('.95s')}>
          <HeroFlow
            bare
            copy={{
              once: t('landing.hero.once'),
              regulars: t('landing.hero.regulars'),
              label: t('landing.hero.flowLabel'),
              left: [t('landing.hero.walkin'), t('landing.hero.firstVisit'), t('landing.hero.oneTimeChip')],
              right: [t('landing.hero.newreg'), t('landing.hero.back'), t('landing.hero.plusStamp')],
            }}
          />
        </div>
      </section>

      <section className="statement">
        <div className="pin">
          <p id="stmt">
            <Split parts={[t('landing.heroB.stmt1', { appName }), ' ', { hl: t('landing.heroB.stmt1hl') }, null, t('landing.heroB.stmt2'), null, t('landing.heroB.stmt3'), null, t('landing.heroB.stmt4')]} />
          </p>
        </div>
      </section>

      <section className="hb-split">
        <div className="l">
          <h2 id="h2"><Split parts={[t('landing.heroB.splitTitle1'), null, t('landing.heroB.splitTitle2')]} /></h2>
          <div className="row">
            <h3>{t('landing.heroB.rowTitle')}</h3>
            <p><b>{t('landing.heroB.rowLead')}</b>{' '}{t('landing.heroB.rowBody')}</p>
          </div>
        </div>
        <div className="r">
          <div className="img">
            {SPLIT_PHOTO_SRC
              ? <img src={SPLIT_PHOTO_SRC} alt={t('landing.heroB.imgAlt')} />
              : <IlloSvg data={backgroundsPosterCoffeeHills} title={t('landing.heroB.imgAlt')} preserveAspectRatio="xMidYMid slice" />}
          </div>
        </div>
      </section>
    </div>
  );
}

/** Floating "Compare: A | B" switch. */
export function HeroSwitch({ value, onChange }: { value: 'a' | 'b'; onChange: (v: 'a' | 'b') => void }) {
  const { t } = useT();
  return (
    <div className="hb-switch" role="group" aria-label={t('landing.heroB.compareLabel')}>
      <span>{t('landing.heroB.compare')}</span>
      {(['a', 'b'] as const).map((v, i) => (
        <Fragment key={v}>
          {i > 0 && <i aria-hidden="true" />}
          <button type="button" aria-pressed={value === v} onClick={() => onChange(v)}>{v.toUpperCase()}</button>
        </Fragment>
      ))}
    </div>
  );
}
