'use client';

import { IlloSvg } from '@/components/illustration/IlloSvg';
import {
  iconsDashCalendar, iconsDashClock, iconsDashCustomers, iconsDashGift, iconsDashMessage, iconsDashReturning, iconsDashStamp, iconsDashTrend,
} from '@/components/illustration/illo-data';
import { mod, useTicker, useTween } from './useTicker';

export type DashCopy = {
  ret: string; retSub: string; cust: string; week: string; byTime: string; peak: string; byDay: string; best: string; days: string[]; stamps: string; rewards: string; messages: string;
};

const HOURS = ['09-12', '12-14', '14-17', '17-21'];
const STEPS = [
  { pct: 64, ret: 158, cust: 248, week: 12, h: [62, 100, 48, 70], d: [48, 30, 56, 62, 88, 100, 58] },
  { pct: 65, ret: 162, cust: 251, week: 14, h: [66, 100, 52, 66], d: [52, 34, 60, 58, 84, 100, 62] },
  { pct: 66, ret: 167, cust: 254, week: 15, h: [60, 100, 55, 74], d: [50, 38, 58, 66, 92, 100, 54] },
  { pct: 67, ret: 172, cust: 257, week: 18, h: [64, 100, 50, 78], d: [54, 32, 64, 70, 90, 100, 60] },
];
const R = 19;
const C = 2 * Math.PI * R;

export function DashMini({ copy }: { copy: DashCopy }) {
  const { ref, tick, seen } = useTicker(2800);
  const s = STEPS[mod(tick, STEPS.length)];
  const z = (v: number) => (seen ? v : 0);
  const pct = useTween(z(s.pct));
  const ret = useTween(s.ret);
  const cust = useTween(s.cust);
  const week = useTween(s.week);
  return (
    <div className={`fx-dash fx-visual${seen ? ' is-in' : ''}`} ref={ref}>
      <div className="fx-dash-top">
        <div className="fx-tile fx-ring">
          <svg width="64" height="64" viewBox="0 0 48 48" aria-hidden="true">
            <circle cx="24" cy="24" r={R} fill="none" stroke="#E4E9F5" strokeWidth="4.5" />
            <circle cx="24" cy="24" r={R} fill="none" stroke="#0B1F44" strokeWidth="4.5" strokeLinecap="round" strokeDasharray={C} strokeDashoffset={C * (1 - z(s.pct) / 100)} transform="rotate(-90 24 24)" style={{ transition: 'stroke-dashoffset .9s var(--ease)' }} />
            <text x="24" y="28.2" textAnchor="middle" fontSize="12" fontWeight="600" letterSpacing="-.3" fill="#0B1F44" style={{ fontVariantNumeric: 'tabular-nums' }}>{pct}%</text>
          </svg>
          <span><b className="fx-ic"><IlloSvg data={iconsDashReturning} />{copy.ret}</b><small>{copy.retSub.replace('{a}', String(ret)).replace('{b}', String(cust))}</small></span>
        </div>
        <div className="fx-tile">
          <small className="fx-lbl"><IlloSvg data={iconsDashCustomers} />{copy.cust}<i /></small>
          <b className="fx-num">{cust}</b>
          <span className="fx-tag"><IlloSvg data={iconsDashTrend} />{copy.week.replace('{n}', String(week))}</span>
        </div>
      </div>
      <div className="fx-chips">
        <span><IlloSvg data={iconsDashStamp} /><b>{Math.round(cust / 6)}</b><small>{copy.stamps}</small></span>
        <span><IlloSvg data={iconsDashGift} /><b>{Math.round(ret / 20)}</b><small>{copy.rewards}</small></span>
        <span><IlloSvg data={iconsDashMessage} /><b>{week / 3 | 0}</b><small>{copy.messages}</small></span>
      </div>
      <div className="fx-dash-bot">
        <div className="fx-tile">
          <b className="fx-h fx-ic"><IlloSvg data={iconsDashClock} />{copy.byTime}</b>
          <span className="fx-tag grey">{copy.peak}</span>
          <div className="fx-hb">
            {HOURS.map((l, i) => (
              <div key={l}><small>{l}</small><i><u style={{ width: `${z(s.h[i])}%`, background: s.h[i] === 100 ? '#0B1F44' : '#4F7AC9' }} /></i></div>
            ))}
          </div>
        </div>
        <div className="fx-tile">
          <b className="fx-h fx-ic"><IlloSvg data={iconsDashCalendar} />{copy.byDay}</b>
          <small className="fx-sub">{copy.best}</small>
          <div className="fx-vb">
            {s.d.map((v, i) => (
              <div key={i}><u style={{ height: `${z(v)}%`, background: v === 100 ? '#0B1F44' : '#BAC5D9' }} /><small>{copy.days[i]}</small></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
