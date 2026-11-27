'use client';

import type { ReactNode } from 'react';
import { WalletPass } from '../WalletPass';
import { BENTO_PASSES } from '../passes';
import { LogoMark } from '../Logo';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { avatarsAvatar03, avatarsAvatar10, avatarsAvatar11, avatarsAvatar12, avatarsAvatar15, avatarsAvatar02, avatarsAvatar08, avatarsBadgePerson } from '@/components/illustration/illo-data';
import { mod, useTicker } from '../features/useTicker';

const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/* 1. automations ------------------------------------------------------- */
export type AutoCopy = { rows: { t: string; s: string; m: string }[]; sent: string };
const AUTO_ICON = [
  { bg: '#FFF1E0', fg: '#D9822B', d: <g {...ic}><path d="M3.5 12a8.5 8.5 0 1 0 2.6-6.1L3.5 8.5" /><path d="M3.5 3.5v5h5M12 7.5V12l3 2" /></g> },
  { bg: '#E6F6EC', fg: '#12945A', d: <g {...ic}><path d="m4 20 3.5-10 6.5 6.5z" /><path d="M14 4v2M19 9h2M17.5 5.5l1.2-1.2M12 9l2-2" /></g> },
  { bg: '#FCE8F1', fg: '#D6336C', d: <g {...ic}><rect x="4" y="12" width="16" height="8" rx="2" /><path d="M12 12V8M12 4.5c1 1 1 2.5 0 3.5-1-1-1-2.5 0-3.5Z" /></g> },
];

export function AutoRows({ copy }: { copy: AutoCopy }) {
  const { ref, tick } = useTicker(2600);
  const active = mod(tick, 3);
  return (
    <div className="bx-auto" ref={ref}>
      {copy.rows.map((r, i) => {
        const open = i === active;
        const a = AUTO_ICON[i];
        return (
          <div key={i} className={`bx-arow${open ? ' open' : ''}`}>
            <div className="bx-arow-h">
              <span className="bx-aic" style={{ background: a.bg, color: a.fg }}><svg width="20" height="20" viewBox="0 0 24 24">{a.d}</svg></span>
              <span className="bx-atx"><b>{r.t}</b><small>{r.s}</small></span>
              <span className="bx-tgl"><i /></span>
            </div>
            <div className="bx-aq-wrap" aria-hidden={!open}>
              <div className="bx-aq-in">
                <div className="bx-aq"><span>&ldquo;{r.m}&rdquo;</span><em><svg width="14" height="14" viewBox="0 0 24 24" {...ic} strokeWidth={2.4}><path d="m2 13 4 4L14 8M10 15l1.5 1.5L20 7" /></svg>{copy.sent}</em></div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 2. wallet passes ------------------------------------------------------ */
export type WalletCopy = { apple: string; google: string };
/** Stack slot by depth from the front: vertical offset, scale, stacking order, opacity. Depth 3+ is hidden. */
const DEPTH = [
  { y: 66, s: 1, z: 6, o: 1 },
  { y: 33, s: 0.965, z: 5, o: 1 },
  { y: 0, s: 0.93, z: 4, o: 1 },
  { y: 0, s: 0.9, z: 3, o: 0 },
  { y: 0, s: 0.9, z: 2, o: 0 },
  { y: 0, s: 0.9, z: 1, o: 0 },
];

export function WalletStack({ copy }: { copy: WalletCopy }) {
  const { ref, tick } = useTicker(2700);
  const n = BENTO_PASSES.length;
  return (
    <div className="bx-wallet" ref={ref}>
      <div className="bx-stack">
        {BENTO_PASSES.map((p, i) => {
          const d = DEPTH[mod(i - tick, n)];
          return (
            <div key={p.slug} className="bx-pass" style={{ transform: `translateY(${d.y}px) scale(${d.s})`, zIndex: d.z, opacity: d.o }} aria-hidden={d.o === 0 || undefined}>
              <WalletPass pass={p} />
            </div>
          );
        })}
      </div>
      <div className="bx-wbtns">
        <span className="bx-wb dark"><svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.600-2.800-1.800-3.400-1.800-1.400-.1-2.800.8-3.500.8s-1.800-.8-3-.8c-1.500 0-3 .9-3.800 2.300-1.600 2.800-.4 7 1.200 9.300.8 1.100 1.700 2.400 2.900 2.300 1.200 0 1.600-.7 3-.7s1.800.7 3 .7 2-1.100 2.800-2.200c.9-1.300 1.200-2.500 1.300-2.600-.1 0-2.500-1-2.500-3.800ZM14.200 5.700c.6-.8 1.100-1.800 1-2.900-.9 0-2 .6-2.700 1.400-.6.700-1.100 1.800-1 2.800 1 .1 2-.5 2.700-1.300Z" /></svg>{copy.apple}</span>
        <span className="bx-wb"><b className="g">G</b>{copy.google}</span>
      </div>
    </div>
  );
}

/* 3. live feed ---------------------------------------------------------- */
export type LiveCopy = { live: string; names: string[]; actions: string[]; when: string[] };
const FACES = [avatarsAvatar03, avatarsAvatar11, avatarsAvatar15, avatarsAvatar12, avatarsAvatar10];
const ROW = 70;

export function LiveFeed({ copy }: { copy: LiveCopy }) {
  const { ref, tick } = useTicker(2200);
  const items = [0, 1, 2, 3].map((age) => ({ age, k: tick - age }));
  return (
    <div className="bx-live" ref={ref}>
      <span className="bx-livetag"><i />{copy.live}</span>
      <div className="bx-feed">
        {items.map(({ age, k }) => {
          const who = mod(k * 2 + 1, copy.names.length);
          const act = mod(k, 3);
          const f = FACES[who];
          return (
            <div
              key={k}
              className={`bx-lrow${k === tick && tick > 0 ? ' fresh' : ''}`}
              style={{ transform: `translateY(${age * ROW}px)`, opacity: age === 3 ? 0 : 1 }}
            >
              <IlloSvg data={f} className="bx-av" />
              <span className="bx-atx"><b>{copy.names[who]}</b><small className={act === 1 ? 'g' : ''}>{copy.actions[act]}</small></span>
              <small className="bx-when">{copy.when[Math.min(age, 2)]}</small>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* 4. team permissions --------------------------------------------------- */
const TEAM_FACES = [avatarsAvatar02, avatarsAvatar08];
export type TeamCopy = { rows: { n: string; r: string }[]; perms: string[] };
const FRAMES: number[][][] = [
  [[1, 1, 0], [1, 0, 0]],
  [[1, 1, 1], [1, 0, 0]],
  [[1, 1, 1], [1, 1, 0]],
  [[1, 1, 0], [1, 1, 0]],
];

export function TeamRows({ copy }: { copy: TeamCopy }) {
  const { ref, tick } = useTicker(2000);
  const st = FRAMES[mod(tick, FRAMES.length)];
  return (
    <div className="bx-team" ref={ref}>
      {copy.rows.map((r, ri) => (
        <div key={ri} className="bx-trow">
          <span className="bx-tav">
            <IlloSvg data={TEAM_FACES[ri % TEAM_FACES.length]} className="bx-av" />
            <IlloSvg data={avatarsBadgePerson} className="bx-tbadge" />
          </span>
          <span className="bx-atx"><b>{r.n}</b><small>{r.r}</small></span>
          <span className="bx-perms">{copy.perms.map((p, pi) => <i key={pi} className={st[ri][pi] ? 'on' : ''}>{p}</i>)}</span>
        </div>
      ))}
    </div>
  );
}

/* 5. birthday phone ----------------------------------------------------- */
const CONFETTI = [
  { x: 12, y: 8, c: '#22C55E', d: 0, r: 40 }, { x: 78, y: 4, c: '#F472B6', d: .6, r: -30 }, { x: 30, y: 30, c: '#F59E0B', d: 1.2, r: 70 },
  { x: 88, y: 26, c: '#818CF8', d: .3, r: 20 }, { x: 52, y: 0, c: '#2DD4BF', d: 1.8, r: -60 }, { x: 66, y: 38, c: '#F472B6', d: 2.1, r: 10 },
  { x: 20, y: 52, c: '#818CF8', d: 2.6, r: 50 }, { x: 44, y: 18, c: '#F59E0B', d: .9, r: -20 },
];
export type BdayCopy = { shop: string; msg: string; now: string };

export function BdayPhone({ copy }: { copy: BdayCopy }) {
  const { ref, active } = useTicker(1000);
  return (
    <div className="bx-bday" ref={ref} data-active={active}>
      <div className="bx-bphone">
        <span className="bx-bisland" />
        <div className="bx-confetti" aria-hidden="true">
          {CONFETTI.map((c, i) => <i key={i} style={{ left: `${c.x}%`, top: `${c.y}%`, background: c.c, animationDelay: `${c.d}s`, ['--r' as string]: `${c.r}deg` }} />)}
        </div>
        <b className="bx-bclock">9:41</b>
        <div className="bx-bnotif">
          <span className="bx-bapp"><LogoMark size={22} /></span>
          <div><b>{copy.shop}<em>{copy.now}</em></b><small>{copy.msg}</small></div>
        </div>
      </div>
    </div>
  );
}

/* 6. nearby map --------------------------------------------------------- */
export type NearCopy = { shop: string; msg: string; when: string };

export function NearMap({ copy, children }: { copy: NearCopy; children?: ReactNode }) {
  const { ref, active } = useTicker(1000);
  return (
    <div className="bx-map" ref={ref} data-active={active}>
      <svg viewBox="0 0 300 160" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="300" height="160" fill="#EEF1F6" />
        <g fill="#E1E6EF"><rect x="14" y="14" width="46" height="36" rx="3" /><rect x="84" y="56" width="42" height="40" rx="3" /><rect x="205" y="14" width="42" height="30" rx="3" /><rect x="208" y="70" width="60" height="34" rx="3" /><rect x="12" y="92" width="40" height="30" rx="3" /></g>
        <g stroke="#fff" strokeLinecap="round"><path d="M-10 52h320M-10 120h320" strokeWidth="11" /><path d="M72-10v180M190-10v180" strokeWidth="11" /><path d="M262-10v180" strokeWidth="7" /><path d="M-10 90l320-20" strokeWidth="6" /></g>
      </svg>
      <span className="bx-ring r1" /><span className="bx-ring r2" />
      <span className="bx-pin"><LogoMark size={22} /></span>
      <div className="bx-nnotif">
        <span className="bx-bapp"><LogoMark size={22} /></span>
        <div><b>{copy.shop}<em>{copy.when}</em></b><small>{copy.msg}</small></div>
      </div>
      {children}
    </div>
  );
}
