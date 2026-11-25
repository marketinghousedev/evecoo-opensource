'use client';

import type { ReactNode } from 'react';
import { LogoMark } from '../Logo';
import { QrMock } from './shared';
import { mod, useTicker } from './useTicker';

export type CarouselCopy = {
  owner: string; lblName: string; lblReward: string; lblBy: string; lblProg: string; by: string;
  how: string; prev: string; next: string; goto: string;
  cards: { name: string; reward: string; prog: string }[];
};

function Glyph({ kind, c, d }: { kind: string; c: string; d: string }) {
  switch (kind) {
    case 'burger':
      return (<g><path d="M5 12a7 5.5 0 0114 0z" fill={c} /><rect x="4.5" y="13" width="15" height="2.4" rx="1.2" fill={d} /><rect x="5" y="16.2" width="14" height="3.2" rx="1.6" fill={c} /></g>);
    case 'sushi':
      return (<g><circle cx="12" cy="12" r="7.4" fill={c} /><circle cx="12" cy="12" r="4.4" fill={d} /><circle cx="12" cy="12" r="1.8" fill={c} /></g>);
    case 'scissors':
      return (<g stroke={c} strokeWidth="1.8" strokeLinecap="round" fill="none"><circle cx="7.5" cy="17" r="2.6" /><circle cx="16.5" cy="17" r="2.6" /><path d="M9 14.8 17 5M15 14.8 7 5" /></g>);
    case 'cup':
      return (<g><path d="M5 9h11v5a5 5 0 01-5 5h-1a5 5 0 01-5-5z" fill={c} /><path d="M16 10.5h1.6a2.4 2.4 0 010 4.8H16" stroke={c} strokeWidth="1.6" fill="none" /><path d="M8 3.5c-1 1 1 2 0 3M12 3.5c-1 1 1 2 0 3" stroke={d} strokeWidth="1.2" fill="none" strokeLinecap="round" /></g>);
    default:
      return (<g><rect x="8.5" y="11" width="7" height="9" rx="2" fill={c} /><rect x="10.4" y="4" width="3.2" height="7" rx="1.2" fill={d} /></g>);
  }
}

const THEMES = [
  { bg: '#4A2220', art: 'radial-gradient(120% 90% at 30% 20%, #8C4A2E 0%, #4A2220 70%)', ink: '#fff', c: '#F2C27B', d: '#8A4B22', glyph: 'burger', n: 6 },
  { bg: '#171E2E', art: 'radial-gradient(120% 90% at 70% 20%, #3E4B63 0%, #171E2E 72%)', ink: '#fff', c: '#FF9A6B', d: '#F6F1E7', glyph: 'sushi', n: 5 },
  { bg: '#0F0F12', art: 'radial-gradient(120% 90% at 30% 20%, #3A3A44 0%, #0F0F12 72%)', ink: '#fff', c: '#E8E8EE', d: '#6D6D78', glyph: 'scissors', n: 4 },
  { bg: '#4B3023', art: 'radial-gradient(120% 90% at 70% 20%, #8E6244 0%, #4B3023 72%)', ink: '#fff', c: '#EBCDA2', d: '#B88B5E', glyph: 'cup', n: 6 },
  { bg: '#F4B9CD', art: 'radial-gradient(120% 90% at 30% 20%, #FFD9E5 0%, #F4B9CD 72%)', ink: '#4A1730', c: '#C23A72', d: '#7A1F4A', glyph: 'nail', n: 3 },
] as const;

export function CardCarousel({ copy, qr }: { copy: CarouselCopy; qr: ReactNode }) {
  const { ref, tick, setTick } = useTicker(2600);
  const N = THEMES.length;
  const idx = mod(tick, N);
  return (
    <div className="fx-car" ref={ref}>
      <div className="fx-stage">
        {THEMES.map((th, i) => {
          const rel = mod(i - idx + 2, N) - 2; // -2..2 around the active card
          const state = rel === 0 ? 'on' : rel < 0 ? 'prev' : 'next';
          const k = copy.cards[i];
          const big = th.glyph === 'nail';
          return (
            <div key={i} className={`fx-wc ${state}`} style={{ background: th.bg, color: th.ink }} aria-hidden={rel !== 0}>
              <div className="fx-wc-top"><b>{k.name}</b><span><small>{copy.lblName}</small>{copy.owner}</span></div>
              <div className="fx-wc-art" style={{ background: th.art }}>
                {big ? (
                  <span className="fx-big"><b>{k.prog.split(' ')[0]}</b> {k.prog.split(' ').slice(1).join(' ')}</span>
                ) : (
                  <span className="fx-stamps">
                    {Array.from({ length: 8 }, (_, s) => (
                      <svg key={s} viewBox="0 0 24 24" width="34" height="34" style={{ opacity: s < th.n ? 1 : .28 }}>
                        <Glyph kind={th.glyph} c={th.c} d={th.d} />
                      </svg>
                    ))}
                  </span>
                )}
              </div>
              <div className="fx-wc-meta">
                <span><small>{copy.lblReward}</small>{k.reward}</span>
                <span><small>{copy.lblBy}</small>{copy.by}</span>
                <span><small>{copy.lblProg}</small>{k.prog}</span>
              </div>
            </div>
          );
        })}
        <div className="fx-qr">{qr}</div>
      </div>
      <div className="fx-pill">
        <button type="button" aria-label={copy.prev} onClick={() => setTick((t) => t - 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <span><LogoMark size={16} />{copy.how}</span>
        <button type="button" aria-label={copy.next} onClick={() => setTick((t) => t + 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
      <div className="fx-dots">
        {THEMES.map((_, i) => (
          <button key={i} type="button" aria-label={[copy.goto, i + 1].join(" ")} className={i === idx ? 'on' : ''} onClick={() => setTick(i)} />
        ))}
      </div>
    </div>
  );
}
