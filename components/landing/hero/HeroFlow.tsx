'use client';

import { useEffect, useRef } from 'react';
import { LogoMark } from '../Logo';
import { Avatar, PersonGlyph } from './avatars';
import './hero-flow.css';

export type HeroFlowCopy = {
  once: string; regulars: string; label: string;
  left: [string, string, string];
  right: [string, string, string];
};

/* ---- deterministic motion model (pure; identical on server and client) ---- */
const G = 6; // guests in flight
const P = 15600; // ms one guest needs from the left edge to the right edge
const L = 0.56; // share of the journey spent left of the beam
const CHIP_LIFE = 5200;
const LC = 3; // left chips
const LP = 10500;
const T0 = 6800; // a pleasant, busy moment used for the first paint and reduced motion
const BEAM_X = 0.5;
const NODE_Y = 0.54;

const offs = Array.from({ length: G }, (_, k) => k * (P / G) + ((k * 7919) % 5) * 90);
function rnd(k: number, c: number, salt: number) {
  let h = Math.imul(k + 1, 0x9e3779b1) ^ Math.imul(c + 7, 0x85ebca6b) ^ Math.imul(salt + 3, 0xc2b2ae35);
  h ^= h >>> 15; h = Math.imul(h, 0x2c1b3c6d); h ^= h >>> 12; h = Math.imul(h, 0x297a2d39); h ^= h >>> 15;
  return (h >>> 0) / 4294967296;
}
const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const smooth = (p: number) => p * p * (3 - 2 * p);
const r4 = (v: number) => Math.round(v * 10000) / 10000;

type Guest = { x: number; y: number; s: number; o: number; conv: boolean };
type Chip = { x: number; y: number; o: number; label: number };
type Frame = { guests: Guest[]; chips: Chip[]; left: Chip[]; pulse: number };

function compute(t: number): Frame {
  const guests: Guest[] = [];
  const chips: Chip[] = [];
  let since = Infinity;
  for (let k = 0; k < G; k++) {
    const tt = t + offs[k];
    const c = Math.floor(tt / P);
    const u = (tt % P) / P;
    const y0 = 0.16 + rnd(k, c, 1) * 0.72;
    const yc = 0.36 + rnd(k, c, 2) * 0.36;
    const y1 = 0.14 + rnd(k, c, 3) * 0.74;
    const s = 0.84 + rnd(k, 0, 4) * 0.3;
    const bob = Math.sin(t / 1100 + k * 1.7) * 0.01;
    let x: number, y: number, o: number;
    const conv = u >= L;
    if (!conv) {
      const p = u / L;
      x = -0.04 + (BEAM_X + 0.04) * p;
      y = y0 + (yc - y0) * Math.pow(smooth(p), 1.35) + bob * (1 - p);
      o = clamp(p / 0.1);
    } else {
      const q = (u - L) / (1 - L);
      x = BEAM_X + 0.56 * q;
      y = yc + (y1 - yc) * (1 - (1 - q) * (1 - q)) + bob * q;
      o = 1 - clamp((x - 0.86) / 0.14);
    }
    guests.push({ x: r4(x), y: r4(y), s: r4(s), o: r4(o), conv });
    // ms since this guest last crossed the beam (current or previous cycle)
    const dt = conv ? (u - L) * P : (u + 1 - L) * P;
    since = Math.min(since, dt);
    // chip born at that crossing
    const cc = conv ? c : c - 1;
    const pyc = 0.36 + rnd(k, cc, 2) * 0.36;
    const a = dt / CHIP_LIFE;
    const above = pyc > NODE_Y;
    chips.push({
      x: r4(BEAM_X + 0.035 + 0.2 * Math.pow(clamp(a), 0.85)),
      y: r4(pyc + (above ? -0.13 : 0.13) - 0.03 * a),
      o: r4(a >= 1 ? 0 : clamp(dt / 380) * (1 - clamp((a - 0.72) / 0.28))),
      label: k % 3,
    });
  }
  const left: Chip[] = [];
  for (let k = 0; k < LC; k++) {
    const tt = t + k * (LP / LC) + 1300;
    const c = Math.floor(tt / LP);
    const u = (tt % LP) / LP;
    const lanes = [0.22, 0.4, 0.72, 0.86];
    left.push({
      x: r4(0.07 + 0.22 * u),
      y: r4(lanes[(k + c * 2) % lanes.length] + (rnd(k, c, 9) - 0.5) * 0.06),
      o: r4(Math.pow(Math.sin(Math.PI * u), 0.6) * 0.92),
      label: (k + c) % 3,
    });
  }
  const pulse = since < 2000 ? Math.exp(-since / 420) : 0;
  return { guests, chips, left, pulse: r4(pulse) };
}

const vars = (x: number, y: number, o: number, s = 1) =>
  ({ '--x': x, '--y': y, '--o': o, '--s': s }) as React.CSSProperties;

export function HeroFlow({ copy }: { copy: HeroFlowCopy }) {
  const root = useRef<HTMLDivElement>(null);
  const first = compute(T0);

  useEffect(() => {
    const el = root.current;
    if (!el) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const gEls = Array.from(el.querySelectorAll<HTMLElement>('.hf-g'));
    const cEls = Array.from(el.querySelectorAll<HTMLElement>('.hf-chip.r'));
    const lEls = Array.from(el.querySelectorAll<HTMLElement>('.hf-chip.l'));
    const beam = el.querySelector<HTMLElement>('.hf-beam');
    const node = el.querySelector<HTMLElement>('.hf-node');
    const set = (n: HTMLElement, x: number, y: number, o: number, s?: number) => {
      n.style.setProperty('--x', String(x));
      n.style.setProperty('--y', String(y));
      n.style.setProperty('--o', String(o));
      if (s !== undefined) n.style.setProperty('--s', String(s));
    };
    const text = (n: HTMLElement, v: string) => {
      const span = n.lastElementChild as HTMLElement | null;
      if (span && span.textContent !== v) span.textContent = v;
    };
    let t = T0;
    let raf = 0;
    let last = 0;
    let visible = false;
    const frame = (now: number) => {
      t += last ? Math.min(64, now - last) : 16;
      last = now;
      const f = compute(t);
      f.guests.forEach((g, i) => {
        const n = gEls[i];
        if (!n) return;
        set(n, g.x, g.y, g.o, g.s);
        n.classList.toggle('conv', g.conv);
      });
      f.chips.forEach((c, i) => { const n = cEls[i]; if (n) { set(n, c.x, c.y, c.o); text(n, copy.right[c.label]); } });
      f.left.forEach((c, i) => { const n = lEls[i]; if (n) { set(n, c.x, c.y, c.o); text(n, copy.left[c.label]); } });
      beam?.style.setProperty('--p', String(f.pulse));
      node?.style.setProperty('--p', String(f.pulse));
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const run = visible && !document.hidden;
      if (run && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); });
    io.observe(el);
    document.addEventListener('visibilitychange', sync);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); cancelAnimationFrame(raf); };
  }, [copy]);

  return (
    <div className="hf" ref={root} role="img" aria-label={copy.label}>
      <svg className="hf-bg" viewBox="0 0 1400 500" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <linearGradient id="hf-band" x1="0" x2="1" y1="0" y2="0">
            <stop offset="0" stopColor="#fff" stopOpacity=".55" />
            <stop offset=".5" stopColor="#fff" stopOpacity=".95" />
            <stop offset="1" stopColor="#fff" stopOpacity=".55" />
          </linearGradient>
        </defs>
        <path d="M0 58C380 58 520 150 700 150S1020 58 1400 58V472C1020 472 880 392 700 392S380 472 0 472Z" fill="url(#hf-band)" />
        <path d="M0 58C380 58 520 150 700 150S1020 58 1400 58M0 472C380 472 520 392 700 392S1020 472 1400 472" fill="none" stroke="#E2E6F1" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
        <g fill="none" stroke="#E3E7F2" strokeWidth="1" vectorEffect="non-scaling-stroke">
          {[110, 175, 230, 300, 360, 420].map((y) => <path key={`l${y}`} d={`M0 ${y}C320 ${y} 520 ${270 + (y - 270) * 0.25} 700 270`} />)}
          {[95, 160, 225, 310, 370, 435].map((y) => <path key={`r${y}`} d={`M700 270C880 ${270 + (y - 270) * 0.25} 1080 ${y} 1400 ${y}`} />)}
        </g>
      </svg>
      <span className="hf-label l">{copy.once}</span>
      <span className="hf-label r">{copy.regulars}</span>

      {first.left.map((c, i) => (
        <span key={`l${i}`} className="hf-chip l" style={vars(c.x, c.y, c.o)}><PersonGlyph /><span>{copy.left[c.label]}</span></span>
      ))}

      <span className="hf-beam" style={{ '--p': first.pulse } as React.CSSProperties} />

      {first.guests.map((g, i) => (
        <span key={`g${i}`} className={`hf-g${g.conv ? ' conv' : ''}`} style={vars(g.x, g.y, g.o, g.s)}>
          <span className="hf-person"><PersonGlyph /></span>
          <span className="hf-av">
            <span className="pic"><Avatar i={i} /></span>
            <span className={`hf-badge ${i % 3 === 1 ? 'user' : 'check'}`}>
              {i % 3 === 1 ? (
                <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><circle cx="12" cy="8" r="4.2" fill="currentColor" /><path d="M3.5 21c.6-4.6 4-7 8.5-7s7.9 2.4 8.5 7Z" fill="currentColor" /></svg>
              ) : (
                <svg viewBox="0 0 24 24" width="11" height="11" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              )}
            </span>
          </span>
        </span>
      ))}

      <span className="hf-node" style={{ '--p': first.pulse } as React.CSSProperties}><LogoMark size={30} /></span>

      {first.chips.map((c, i) => (
        <span key={`c${i}`} className="hf-chip r" style={vars(c.x, c.y, c.o)}><span className="lg"><LogoMark size={14} /></span><span>{copy.right[c.label]}</span></span>
      ))}
    </div>
  );
}
