'use client';

import { useEffect, useRef, useState } from 'react';
import { useT } from '@/components/I18nProvider';
import { LogoMark } from '../Logo';
import { Icon } from '../Icon';
import { SectionHead } from '../Features';
import { useTicker, useTween } from '../features/useTicker';
import '../p8.css';
import './dashb.css';

type Tab = 'stats' | 'msg' | 'team';
type Row = { id: number; name: number; kind: 'stamp' | 'reward'; n: number; at: number };

const SEED = [20, 26, 34, 28, 40, 58, 46, 30, 36, 52, 70, 50, 38, 44, 60, 78, 55, 42, 48, 66, 84, 60, 50, 56, 72, 88, 96, 70, 62, 74];
const W = 620, H = 220;
const DELIVER_MS = 2200;

function curve(pts: number[], max: number) {
  const xy = pts.map((v, i) => [i * (W / (pts.length - 1)), H - (v / max) * (H - 20) - 10] as const);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1], [x1, y1] = xy[i], cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  return { d, last: xy[xy.length - 1] };
}

const TEAM = [
  { m: 1, r: 1, p: [1, 1, 1, 1] },
  { m: 2, r: 2, p: [1, 1, 1, 0] },
  { m: 3, r: 3, p: [1, 1, 0, 0] },
  { m: 4, r: 4, p: [1, 0, 0, 0] },
];

export function DashPreviewB() {
  const { t } = useT();
  const { ref, tick, active } = useTicker(2000);
  const [tab, setTab] = useState<Tab>('stats');
  const [series, setSeries] = useState(SEED);
  const [customers, setCustomers] = useState(248);
  const [stamps, setStamps] = useState(1312);
  const [today, setToday] = useState(21);
  const [redeemed, setRedeemed] = useState(37);
  const [rows, setRows] = useState<Row[]>([
    { id: 3, name: 1, kind: 'stamp', n: 4, at: 0 },
    { id: 2, name: 2, kind: 'stamp', n: 9, at: 0 },
    { id: 1, name: 3, kind: 'reward', n: 10, at: 0 },
  ]);
  const seq = useRef(4);

  // Simulated stamp events: one per tick (every ~2 s while the section is on screen).
  useEffect(() => {
    if (tick === 0) return;
    const r = (tick * 7 + 3) % 11; // deterministic pseudo-random, no Math.random during render
    const reward = tick % 6 === 0;
    const id = seq.current++;
    const row: Row = { id, name: (tick * 5 + 1) % 8 + 1, kind: reward ? 'reward' : 'stamp', n: reward ? 10 : (r % 9) + 1, at: tick };
    setRows((x) => [row, ...x].slice(0, 5));
    setStamps((s) => s + 1);
    setToday((s) => s + 1);
    if (reward) setRedeemed((s) => s + 1);
    if (tick % 3 === 0) setCustomers((s) => s + 1);
    setSeries((s) => [...s.slice(1), 40 + ((tick * 17) % 56)]);
  }, [tick]);

  const cV = useTween(customers), sV = useTween(stamps), rV = useTween(redeemed);
  const nf = new Intl.NumberFormat('en-US');
  const max = Math.max(100, ...series);
  const { d, last } = curve(series, max);
  const stats: [string, string, string][] = [
    [t('landing.dash.s1'), nf.format(cV), t('landing.dashb.s1d', { n: today })],
    [t('landing.dash.s2'), t('landing.dash.s2v'), t('landing.dash.s2d')],
    [t('landing.dash.s3'), nf.format(sV), t('landing.dash.s3d')],
    [t('landing.dash.s4'), nf.format(rV), t('landing.dash.s4d')],
  ];
  const hours = [12, 20, 26, 38, 55, 100, 52, 36, 30, 38, 48, 34, 22];
  const tabs: [Tab, string][] = [['stats', t('landing.dashb.tab1')], ['msg', t('landing.dashb.tab2')], ['team', t('landing.dashb.tab3')]];

  return (
    <section className="sec" id="dashboard">
      <SectionHead eyebrow={t('landing.dash.eyebrow')} t1={t('landing.dash.title1')} t2={t('landing.dash.title2')} br sub={t('landing.dash.sub')} />
      <div className="dprev dbb" ref={ref}>
        <div className="dp-top">
          <span className="dp-id"><LogoMark size={28} /><span><b>{t('landing.dash.shop')}</b><small>{t('landing.dash.overview')}</small></span></span>
          <span className="dbb-badges">
            <span className={`dbb-live${active ? ' on' : ''}`}><i />{t('landing.dashb.live')}</span>
            <span className="dbb-demo">{t('landing.dashb.demo')}</span>
          </span>
        </div>
        <div className="dbb-tabs" role="tablist" aria-label={t('landing.dashb.tabs')}>
          {tabs.map(([id, label]) => (
            <button key={id} role="tab" id={`dbb-t-${id}`} aria-selected={tab === id} aria-controls={`dbb-p-${id}`} tabIndex={tab === id ? 0 : -1}
              className={tab === id ? 'on' : ''} onClick={() => setTab(id)}
              onKeyDown={(e) => {
                const i = tabs.findIndex(([x]) => x === tab);
                if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
                  const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length][0];
                  setTab(n); document.getElementById(`dbb-t-${n}`)?.focus();
                }
              }}>{label}</button>
          ))}
        </div>

        {tab === 'stats' && (
          <div role="tabpanel" id="dbb-p-stats" aria-labelledby="dbb-t-stats" className="dbb-panel">
            <div className="dp-stats">
              {stats.map(([l, v, dd]) => (
                <div key={l} className="dp-tile"><small>{l}</small><b>{v}</b><span>{dd}</span></div>
              ))}
            </div>
            <div className="dp-main">
              <div className="dp-chart">
                <div className="dp-h"><span><b>{t('landing.dash.chart')}</b><small>{t('landing.dash.chartSub')}</small></span><span className="lg"><i />{t('landing.dash.legend')}</span></div>
                <svg viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="none" aria-hidden="true">
                  <defs><linearGradient id="agb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#6D3BF5" stopOpacity=".28" /><stop offset="1" stopColor="#6D3BF5" stopOpacity="0" /></linearGradient></defs>
                  {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={W} y1={10 + i * 70} y2={10 + i * 70} stroke="#E4E9F5" />)}
                  <path d={`${d} L${W},${H} L0,${H}Z`} fill="url(#agb)" />
                  <path d={d} fill="none" stroke="#6D3BF5" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
                  <circle cx={last[0] - 4} cy={last[1]} r="5" fill="#6D3BF5" stroke="#fff" strokeWidth="2" />
                </svg>
                <div className="dp-x"><span>{t('landing.dash.w1')}</span><span>{t('landing.dash.w2')}</span><span>{t('landing.dash.w3')}</span><span>{t('landing.dash.w4')}</span></div>
              </div>
              <div className="dp-side">
                <div className="dp-peak dbb-feed">
                  <div className="dp-h"><span><b>{t('landing.dashb.feed')}</b><small>{t('landing.dashb.feedSub')}</small></span></div>
                  <ul aria-live="off">
                    {rows.map((r) => (
                      <li key={r.id} className={`${r.kind}${r.at ? ' new' : ''}`}>
                        <span className="av">{t(`landing.dashb.n${r.name}`).charAt(0)}</span>
                        <span className="tx"><b>{t(`landing.dashb.n${r.name}`)}</b><small>{r.kind === 'reward' ? t('landing.dashb.reward') : t('landing.dashb.stamp', { n: r.n })}</small></span>
                        <em>{r.at ? t('landing.dashb.now') : ''}</em>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dp-peak">
                  <div className="dp-h"><b>{t('landing.dash.peak')}</b><small>{t('landing.dash.peakDay')}</small></div>
                  <strong>{t('landing.dash.peakVal')}</strong>
                  <div className="hrs">{hours.map((v, i) => <i key={i} style={{ height: `${v}%`, background: v === 100 ? '#6D3BF5' : '#DDD1FA' }} />)}</div>
                  <div className="dp-x"><span>{t('landing.dash.h1')}</span><span>{t('landing.dash.h2')}</span><span>{t('landing.dash.h3')}</span></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'msg' && <Composer customers={customers} />}

        {tab === 'team' && (
          <div role="tabpanel" id="dbb-p-team" aria-labelledby="dbb-t-team" className="dbb-panel">
            <Team />
          </div>
        )}
      </div>
    </section>
  );
}

function Composer({ customers }: { customers: number }) {
  const { t } = useT();
  const [text, setText] = useState(() => t('landing.dashb.msg.text'));
  const [phase, setPhase] = useState<'idle' | 'sending' | 'done'>('idle');
  const [sent, setSent] = useState<string[]>([]);
  const [p, setP] = useState(0);
  const total = customers;
  const timers = useRef<number[]>([]);
  useEffect(() => () => { timers.current.forEach((x) => clearTimeout(x)); }, []);
  useEffect(() => {
    if (phase !== 'sending') return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) { setP(1); setPhase('done'); return; }
    let raf = 0;
    const t0 = performance.now();
    const step = (now: number) => {
      const q = Math.min(1, (now - t0) / DELIVER_MS);
      setP(q);
      if (q < 1) raf = requestAnimationFrame(step); else setPhase('done');
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [phase]);
  useEffect(() => { if (phase === 'done') setSent((s) => [text, ...s].slice(0, 2)); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [phase]);
  const eased = 1 - Math.pow(1 - p, 2);
  const delivered = Math.round(total * eased);
  return (
    <div role="tabpanel" id="dbb-p-msg" aria-labelledby="dbb-t-msg" className="dbb-panel dbb-msg">
      <div className="dp-chart dbb-comp">
        <div className="dp-h"><span><b>{t('landing.dashb.msg.title')}</b><small>{t('landing.dashb.msg.sub')}</small></span></div>
        <label className="vh" htmlFor="dbb-text">{t('landing.dashb.msg.label')}</label>
        <textarea id="dbb-text" value={text} maxLength={140} rows={3} disabled={phase !== 'idle'} onChange={(e) => setText(e.target.value)} />
        <div className="dbb-comp-foot">
          <span className="dbb-rcpt"><Icon name="star" size={14} /><span>{t('landing.dashb.msg.to')}: <b>{new Intl.NumberFormat('en-US').format(total)}</b> {t('landing.dashb.msg.customers')}</span></span>
          {phase === 'done'
            ? <button type="button" className="btn btn-lg dbb-send" onClick={() => { setPhase('idle'); setP(0); }}>{t('landing.dashb.msg.again')}</button>
            : <button type="button" className="btn btn-lg dbb-send" disabled={phase === 'sending' || !text.trim()} onClick={() => { setP(0); setPhase('sending'); }}>
                {phase === 'sending' ? t('landing.dashb.msg.sending') : t('landing.dashb.msg.send')} <Icon name="arrow_forward" size={18} />
              </button>}
        </div>
        <div className={`dbb-deliver ${phase}`} aria-live="polite">
          <span className="bar"><u style={{ width: `${p * 100}%` }} /></span>
          <span className="lbl">{phase === 'idle' ? '' : phase === 'sending' ? `${new Intl.NumberFormat('en-US').format(delivered)} / ${new Intl.NumberFormat('en-US').format(total)}` : t('landing.dashb.msg.delivered', { n: new Intl.NumberFormat('en-US').format(total) })}</span>
        </div>
      </div>
      <div className="dp-peak dbb-phone">
        <div className="dp-h"><b>{t('landing.dashb.msg.hist')}</b></div>
        <div className="dbb-bubbles">
          {sent.length === 0 && <p className="dbb-empty">{t('landing.dashb.msg.sub')}</p>}
          {sent.map((m, i) => (
            <div key={i} className="dbb-bub"><span className="av"><LogoMark size={22} /></span><p>{m}</p><small>{t('landing.dashb.msg.delivered', { n: new Intl.NumberFormat('en-US').format(total) })}</small></div>
          ))}
          {phase === 'sending' && <div className="dbb-bub fly" aria-hidden="true"><span className="av"><LogoMark size={22} /></span><p>{text}</p></div>}
        </div>
      </div>
    </div>
  );
}

function Team() {
  const { t } = useT();
  const [perm, setPerm] = useState(() => TEAM.map((x) => x.p.map(Boolean)));
  return (
    <div className="dp-chart dbb-team">
      <div className="dp-h"><span><b>{t('landing.dashb.team.title')}</b><small>{t('landing.dashb.team.sub')}</small></span></div>
      <div className="dbb-trows">
        <div className="dbb-th" aria-hidden="true">{[1, 2, 3, 4].map((i) => <span key={i}>{t(`landing.dashb.team.p${i}`)}</span>)}</div>
        {TEAM.map((m, ri) => (
          <div className="dbb-trow" key={m.m}>
            <span className="who"><span className="av">{t(`landing.dashb.team.m${m.m}`).charAt(0)}</span><span><b>{t(`landing.dashb.team.m${m.m}`)}</b><small>{t(`landing.dashb.team.r${m.r}`)}</small></span></span>
            <span className="tg">
              {[1, 2, 3, 4].map((pi) => {
                const on = perm[ri][pi - 1];
                const locked = m.r === 1;
                return (
                  <span className="cell" key={pi}>
                    <span className="mini">{t(`landing.dashb.team.p${pi}`)}</span>
                    <button type="button" role="switch" aria-checked={on} aria-label={`${t(`landing.dashb.team.m${m.m}`)}: ${t(`landing.dashb.team.p${pi}`)}`} disabled={locked}
                      className="sw" onClick={() => setPerm((x) => x.map((r, i) => i === ri ? r.map((v, j) => j === pi - 1 ? !v : v) : r))}><i /></button>
                  </span>
                );
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
