'use client';

import { IlloSvg } from '@/components/illustration/IlloSvg';
import { scenesLockscreenWallpaperBlue } from '@/components/illustration/illo-data';
import { PASSES } from '../passes';
import { mod, useTicker } from './useTicker';

export type PushCopy = {
  date: string; ago: string[];
  msgs: { shop: string; title: string; body: string }[];
};

const APPS = (['coffee', 'pizza', 'burger'] as const).map((slug) => PASSES.find((p) => p.slug === slug)!);

const GAP = 86;

export function PushPhone({ copy }: { copy: PushCopy }) {
  const { ref, tick } = useTicker(2600);
  const n = copy.msgs.length;
  const items = [0, 1, 2, 3].map((age) => ({ age, k: tick - age }));
  return (
    <div className="fx-phone-wrap fx-visual" ref={ref}>
      <div className="fx-phone">
        <div className="fx-screen">
          <IlloSvg data={scenesLockscreenWallpaperBlue} className="fx-wall" preserveAspectRatio="xMidYMid slice" />
          <span className="fx-island" />
          <div className="fx-status"><b>9:41</b><i /></div>
          <svg className="fx-lock" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="9" rx="2" fill="#fff" stroke="none" /><path d="M8.5 11V7.5a3.5 3.5 0 016.6-1.6" /></svg>
          <div className="fx-clock">9:41</div>
          <div className="fx-date">{copy.date}</div>
        </div>
        <div className="fx-notifs">
          {items.map(({ age, k }) => {
            const m = copy.msgs[mod(k, n)];
            const app = APPS[mod(k, n)];
            return (
              <div
                key={k}
                className={`fx-notif${k === tick && tick > 0 ? ' fresh' : ''}`}
                style={{ transform: `translateY(${age * GAP}px)`, opacity: age === 3 ? 0 : 1, zIndex: 4 - age }}
              >
                <span className="fx-app" style={{ background: app.bg }}><IlloSvg data={app.mark} className="fx-app-mark" /></span>
                <div>
                  <b>{m.shop}<em>{copy.ago[Math.min(age, copy.ago.length - 1)]}</em></b>
                  <strong>{m.title}</strong>
                  <small>{m.body}</small>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
