'use client';

import type { ReactNode } from 'react';
import { WalletPass } from '../WalletPass';
import { BENTO_PASSES } from '../passes';
import { LogoMark } from '../Logo';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { LiveTag } from './LiveTag';
import { iconsAutomationBirthday, iconsAutomationWelcome, iconsAutomationWinback, scenesConfetti, scenesMapTile } from '@/components/illustration/illo-data';
import { avatarsAvatar03, avatarsAvatar10, avatarsAvatar11, avatarsAvatar12, avatarsAvatar15, avatarsAvatar02, avatarsAvatar08, avatarsBadgePerson } from '@/components/illustration/illo-data';
import { mod, useTicker } from '../features/useTicker';

const ic = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

/* 1. automations ------------------------------------------------------- */
export type AutoCopy = { rows: { t: string; s: string; m: string }[]; sent: string };
const AUTO_ICON = [iconsAutomationWinback, iconsAutomationWelcome, iconsAutomationBirthday];

export function AutoRows({ copy }: { copy: AutoCopy }) {
  const { ref, tick } = useTicker(2600);
  const active = mod(tick, 3);
  return (
    <div className="bx-auto" ref={ref}>
      {copy.rows.map((r, i) => {
        const open = i === active;
        return (
          <div key={i} className={`bx-arow${open ? ' open' : ''}`}>
            <div className="bx-arow-h">
              <IlloSvg data={AUTO_ICON[i]} className="bx-aic" />
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
  { y: 58, s: 1, z: 6, o: 1 },
  { y: 29, s: 0.965, z: 5, o: 1 },
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
      {/* neutral text pills: no redrawn Apple/Google marks. Swap in the official badge files from brands/badge-* once added. */}
      <div className="bx-wbtns">
        <span className="bx-wb dark">{copy.apple}</span>
        <span className="bx-wb">{copy.google}</span>
      </div>
    </div>
  );
}

/* 3. live feed ---------------------------------------------------------- */
export type LiveCopy = { live: string; names: string[]; actions: string[]; when: string[] };
const FACES = [avatarsAvatar03, avatarsAvatar11, avatarsAvatar15, avatarsAvatar12, avatarsAvatar10];
const ROW = 70;

export function LiveFeed({ copy }: { copy: LiveCopy }) {
  const { ref, tick, active } = useTicker(2200);
  const items = [0, 1, 2, 3].map((age) => ({ age, k: tick - age }));
  return (
    <div className="bx-live" ref={ref} data-active={active}>
      <LiveTag label={copy.live} />
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
export type BdayCopy = { shop: string; msg: string; now: string };

export function BdayPhone({ copy }: { copy: BdayCopy }) {
  const { ref, active } = useTicker(1000);
  return (
    <div className="bx-bday" ref={ref} data-active={active}>
      <div className="bx-bphone">
        <span className="bx-bisland" />
        <IlloSvg data={scenesConfetti} className="bx-confetti" preserveAspectRatio="xMidYMin slice" />
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
export type NearCopy = { shop: string; msg: string; when: string; live: string };
/** The map tile repeats 3x2; only the first copy keeps the #pin-anchor id so ids stay unique. */
const TILE_PLAIN = { ...scenesMapTile, body: scenesMapTile.body.replace(/ id="[^"]*"/g, '') };

export function NearMap({ copy, children }: { copy: NearCopy; children?: ReactNode }) {
  const { ref, active } = useTicker(1000);
  return (
    <div className="bx-map" ref={ref} data-active={active}>
      <div className="bx-tiles" aria-hidden="true">
        {[0, 1, 2, 3, 4, 5].map((i) => <IlloSvg key={i} data={i === 1 ? scenesMapTile : TILE_PLAIN} className="bx-tile" />)}
      </div>
      <LiveTag label={copy.live} className="bx-maplive" />
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
