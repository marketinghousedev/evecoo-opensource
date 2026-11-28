'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { useT } from '@/components/I18nProvider';
import { Icon } from '../Icon';
import { SectionHead } from '../Features';
import { useTween } from '../features/useTicker';
import '../p8.css';
import './problemb.css';

type Limits = { min: number; max: number; step: number };
const L = {
  guests: { min: 10, max: 500, step: 5 } as Limits,
  spend: { min: 1, max: 60, step: 0.5 } as Limits,
  pct: { min: 0, max: 100, step: 1 } as Limits,
};
const DAYS = 30;
const clamp = (v: number, l: Limits) => Math.min(l.max, Math.max(l.min, v));

/** Slider plus number field, one value. The field keeps a draft string so typing "1" on the way to "12" is allowed. */
function Field({ label, value, lim, onChange, suffix, min }: { label: string; value: number; lim: Limits; onChange: (v: number) => void; suffix?: string; min?: number }) {
  const id = useId();
  const lo = Math.max(lim.min, min ?? lim.min);
  const [draft, setDraft] = useState<string | null>(null);
  const shown = draft ?? String(value);
  return (
    <div className="pb-field">
      <label htmlFor={id}>{label}</label>
      <div className="pb-row">
        <input
          type="range" aria-label={label} min={lo} max={lim.max} step={lim.step} value={value}
          style={{ '--fill': `${((value - lo) / (lim.max - lo)) * 100}%` } as React.CSSProperties}
          onChange={(e) => onChange(Number(e.target.value))}
        />
        <span className="pb-num">
          <input
            id={id} type="number" inputMode="decimal" min={lo} max={lim.max} step={lim.step} value={shown}
            onChange={(e) => {
              setDraft(e.target.value);
              const n = e.target.valueAsNumber;
              if (Number.isFinite(n) && n >= lo && n <= lim.max) onChange(n);
            }}
            onBlur={() => {
              const n = Number(draft);
              if (draft !== null && draft !== '' && Number.isFinite(n)) onChange(clamp(Math.max(n, lo), lim));
              setDraft(null);
            }}
          />
          {suffix && <i aria-hidden="true">{suffix}</i>}
        </span>
      </div>
    </div>
  );
}

function niceStep(max: number, n: number) {
  const raw = max / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

type ChartCopy = { title: string; desc: string; x: string; y: string; without: string; with: string; gap: string };

function Chart({ perMonth0, perMonth1, copy, fmt, compact, drawn }: { perMonth0: number; perMonth1: number; copy: ChartCopy; fmt: (n: number) => string; compact: (n: number) => string; drawn: boolean }) {
  const box = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(600);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(280, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const small = w < 460;
  const m = { l: 66, r: small ? 12 : 20, t: 22, b: 52 };
  const h = small ? 260 : 320;
  const iw = w - m.l - m.r, ih = h - m.t - m.b;
  const top = Math.max(perMonth1 * 12, 1);
  const step = niceStep(top, 4);
  const yMax = Math.ceil(top / step) * step;
  const X = (month: number) => m.l + (month / 12) * iw;
  const Y = (v: number) => m.t + ih - (v / yMax) * ih;
  const ticks: number[] = [];
  for (let v = 0; v <= yMax + 1e-6; v += step) ticks.push(v);
  const months = small ? [0, 3, 6, 9, 12] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const pts = (pm: number) => `${X(0)},${Y(0)} ${X(12)},${Y(pm * 12)}`;
  const area = `M${X(0)},${Y(0)} L${X(12)},${Y(perMonth1 * 12)} L${X(12)},${Y(perMonth0 * 12)} Z`;
  return (
    <div className="pb-chart" ref={box}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} role="img" aria-labelledby="pb-ct pb-cd">
        <title id="pb-ct">{copy.title}</title>
        <desc id="pb-cd">{copy.desc}</desc>
        {ticks.map((v) => (
          <g key={v}>
            <line x1={m.l} x2={w - m.r} y1={Y(v)} y2={Y(v)} className={v === 0 ? 'pb-axis' : 'pb-grid'} />
            <text x={m.l - 8} y={Y(v) + 4} textAnchor="end" className="pb-tick">{compact(v)}</text>
          </g>
        ))}
        {months.map((mo) => (
          <g key={mo}>
            <line x1={X(mo)} x2={X(mo)} y1={Y(0)} y2={Y(0) + 5} className="pb-axis" />
            <text x={X(mo)} y={Y(0) + 20} textAnchor="middle" className="pb-tick">{mo}</text>
          </g>
        ))}
        <text x={m.l + iw / 2} y={h - 8} textAnchor="middle" className="pb-axt">{copy.x}</text>
        <text transform={`translate(12 ${m.t + ih / 2}) rotate(-90)`} textAnchor="middle" className="pb-axt">{copy.y}</text>
        <path d={area} className="pb-area" />
        <polyline points={pts(perMonth0)} className={`pb-l0${drawn ? ' draw' : ''}`} pathLength={1} />
        <polyline points={pts(perMonth1)} className={`pb-l1${drawn ? ' draw' : ''}`} pathLength={1} />
        <circle cx={X(12)} cy={Y(perMonth0 * 12)} r="4.5" className="pb-d0" />
        <circle cx={X(12)} cy={Y(perMonth1 * 12)} r="5.5" className="pb-d1" />
        <text x={X(12) - 10} y={Y(perMonth1 * 12) - 12} textAnchor="end" className="pb-lab1">{copy.with} {fmt(perMonth1 * 12)}</text>
        <text x={X(12) - 10} y={Y(perMonth0 * 12) + 32} textAnchor="end" className="pb-lab0">{copy.without} {fmt(perMonth0 * 12)}</text>
      </svg>
    </div>
  );
}

export function ProblemB() {
  const { t, locale } = useT();
  const [guests, setGuests] = useState(60);
  const [spend, setSpend] = useState(8);
  const [p0, setP0] = useState(40);
  const [p1, setP1] = useState(65);
  const eur = (n: number, o: Intl.NumberFormatOptions = {}) => {
    try { return new Intl.NumberFormat(locale, { style: 'currency', currency: 'EUR', maximumFractionDigits: 0, ...o }).format(n); } catch { return `€${Math.round(n)}`; }
  };
  const fmt = (n: number) => eur(n);
  const compact = (n: number) => (n === 0 ? eur(0) : eur(n, { notation: 'compact', maximumFractionDigits: 1 }));

  const base = guests * DAYS * spend;
  const m0 = base * (p0 / 100), m1 = base * (p1 / 100);
  const extra = Math.max(0, m1 - m0);
  const month = useTween(Math.round(extra), 700);
  const year = useTween(Math.round(extra * 12), 700);

  const sec = useRef<HTMLElement>(null);
  const [drawn, setDrawn] = useState(false);
  useEffect(() => {
    const el = sec.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setDrawn(true); io.disconnect(); } }, { threshold: 0.25 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="sec" id="problem" ref={sec}>
      <SectionHead eyebrow={t('landing.probb.eyebrow')} t1={t('landing.probb.title1')} t2={t('landing.probb.title2')} br sub={t('landing.probb.sub')} />
      <div className="pb-wrap" data-reveal>
        <div className="pb-card pb-in">
          <Field label={t('landing.probb.guests')} value={guests} lim={L.guests} onChange={setGuests} />
          <Field label={t('landing.probb.spend')} value={spend} lim={L.spend} onChange={setSpend} />
          <Field label={t('landing.probb.without')} value={p0} lim={L.pct} suffix="%" onChange={(v) => { setP0(v); if (v > p1) setP1(v); }} />
          <Field label={t('landing.probb.with')} value={p1} lim={L.pct} suffix="%" min={p0} onChange={setP1} />
        </div>
        <div className="pb-card pb-out">
          <div className="pb-kpis" aria-live="polite">
            <div><small>{t('landing.probb.perMonth')}</small><b>{fmt(month)}</b></div>
            <div className="big"><small>{t('landing.probb.perYear')}</small><b>{fmt(year)}</b></div>
          </div>
          <h3 className="pb-ct">{t('landing.probb.chartTitle')}</h3>
          <Chart
            perMonth0={m0} perMonth1={m1} fmt={fmt} compact={compact} drawn={drawn}
            copy={{
              title: t('landing.probb.chartTitle'),
              desc: t('landing.probb.chartDesc').replace('{without}', fmt(m0 * 12)).replace('{with}', fmt(m1 * 12)),
              x: t('landing.probb.axisX'), y: t('landing.probb.axisY'), without: t('landing.probb.lineWithout'), with: t('landing.probb.lineWith'), gap: t('landing.probb.gap'),
            }}
          />
          <Link href="/signup" className="btn btn-lg pb-cta">{t('landing.cta.trial')} <Icon name="arrow_forward" size={20} /></Link>
        </div>
      </div>
      <p className="pb-formula">{t('landing.probb.formula')}</p>
      <p className="fine">{t('landing.probb.note')}</p>
    </section>
  );
}
