'use client';

import type { CSSProperties, ReactNode } from 'react';
import { LogoMark } from '../Logo';
import { StampGrid } from '@/components/illustration/StampGrid';
import { DEMO_STAMPS } from '../demoStamps';
import { QrMock } from './shared';
import { mod, useTicker } from './useTicker';

export type CarouselCopy = {
  owner: string; lblName: string; lblReward: string; lblBy: string; lblProg: string; by: string;
  how: string; prev: string; next: string; goto: string;
  cards: { name: string; reward: string; prog: string }[];
};

const THEMES = [
  { bg: '#4A2220', art: 'radial-gradient(120% 90% at 30% 20%, #8C4A2E 0%, #4A2220 70%)', ink: '#fff', glyph: 'burger', n: 6 },
  { bg: '#171E2E', art: 'radial-gradient(120% 90% at 70% 20%, #3E4B63 0%, #171E2E 72%)', ink: '#fff', glyph: 'sushi', n: 5 },
  { bg: '#0F0F12', art: 'radial-gradient(120% 90% at 30% 20%, #3A3A44 0%, #0F0F12 72%)', ink: '#fff', glyph: 'scissors', n: 4 },
  { bg: '#4B3023', art: 'radial-gradient(120% 90% at 70% 20%, #8E6244 0%, #4B3023 72%)', ink: '#fff', glyph: 'cup', n: 6 },
  { bg: '#F4B9CD', art: 'radial-gradient(120% 90% at 30% 20%, #FFD9E5 0%, #F4B9CD 72%)', ink: '#4A1730', glyph: 'nail', n: 3 },
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
                  <StampGrid className="fx-stamps" name={DEMO_STAMPS[th.glyph]} n={8} filled={th.n} size={34} tone="mono" columns={4} style={{ color: th.ink, '--stamp-bg': th.bg } as CSSProperties} />
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
