'use client';

import { LogoMark } from '../Logo';
import { WalletPass } from '../WalletPass';
import { PASSES } from '../passes';
import { setBiz, useBiz } from '../bizTheme';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { backgroundsCardStudio } from '@/components/illustration/illo-data';
import { mod, useTicker } from './useTicker';

export type CarouselCopy = { how: string; prev: string; next: string; goto: string };

export function CardCarousel({ copy }: { copy: CarouselCopy }) {
  const { ref, tick, setTick } = useTicker(2600);
  const N = PASSES.length;
  const biz = useBiz();
  const bizIdx = biz ? PASSES.findIndex((p) => p.slug === biz.pass) : -1;
  const idx = bizIdx >= 0 ? bizIdx : mod(tick, N);
  const go = (to: number) => { setBiz(null); setTick(to); };
  return (
    <div className="fx-car fx-visual" ref={ref}>
      <IlloSvg data={backgroundsCardStudio} className="fx-bg" preserveAspectRatio="xMidYMid slice" />
      <div className="fx-stage">
        {PASSES.map((p, i) => {
          const rel = mod(i - idx + N / 2, N) - N / 2; // -6..5 around the active card
          const state = rel === 0 ? 'on' : rel < 0 ? 'prev' : 'next';
          return (
            <div key={p.slug} className={`fx-wc ${state}`} aria-hidden={rel !== 0}>
              <WalletPass pass={p} />
            </div>
          );
        })}
      </div>
      <div className="fx-pill">
        <button type="button" aria-label={copy.prev} onClick={() => go(idx - 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 6-6 6 6 6" /></svg>
        </button>
        <span><LogoMark size={16} />{copy.how}</span>
        <button type="button" aria-label={copy.next} onClick={() => go(idx + 1)}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 6 6 6-6 6" /></svg>
        </button>
      </div>
      <div className="fx-dots">
        {PASSES.map((p, i) => (
          <button key={p.slug} type="button" aria-label={[copy.goto, p.name].join(' ')} className={i === idx ? 'on' : ''} onClick={() => { setBiz(null); setTick(i); }} />
        ))}
      </div>
    </div>
  );
}
