'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { DoodleHeader, Ico, Qr, ShopLogo, StatusBar } from './art';
import { WalletPass } from '../WalletPass';
import { PASS_BY_SLUG } from '../passes';
import './howitworks.css';
import type { HowCopy } from './keys';


/* ---- timeline (ms) ---- */
const STEP_AT = [0, 7600, 14000];
const LOOP = 20600;
/** Representative "complete" moment of each step (used for reduced motion). */
const REST_AT = [7200, 13600, 20000];
const TYPE_AT = 2950;
const TYPE_EVERY = 170;
const STAMP_AT = 10500;
const STAMP_EVERY = 220;
const NOTIF_AT = [14700, 16400, 18100];

type Scene = 'cam' | 'join' | 'wallet' | 'scan' | 'added' | 'lock';
type Snap = {
  step: number;
  scene: Scene;
  focus: boolean; link: boolean; tap: boolean;
  typed: number; picker: number; dateSet: boolean; consent: boolean; press: boolean;
  passIn: boolean; stamps: number; reward: boolean;
  scanOk: boolean;
  notifs: number;
};

function snapshot(t: number, nameLen: number): Snap {
  const step = t >= STEP_AT[2] ? 2 : t >= STEP_AT[1] ? 1 : 0;
  let scene: Scene = 'cam';
  if (t >= 2500) scene = 'join';
  if (t >= 5700) scene = 'wallet';
  if (t >= 7600) scene = 'scan';
  if (t >= 9150) scene = 'added';
  if (t >= 10050) scene = 'wallet';
  if (t >= STEP_AT[2]) scene = 'lock';
  const stamps = t < 10000 ? 0 : t < STAMP_AT ? 1 : Math.min(10, 2 + Math.floor((t - STAMP_AT) / STAMP_EVERY));
  return {
    step,
    scene,
    focus: t >= 450,
    link: t >= 1000,
    tap: t >= 1900 && t < 2600,
    typed: Math.max(0, Math.min(nameLen, Math.floor((t - TYPE_AT) / TYPE_EVERY) + 1)),
    picker: t < 3650 ? 0 : t < 3950 ? 1 : t < 4800 ? 2 : 0,
    dateSet: t >= 4800,
    consent: t >= 5050,
    press: t >= 5300 && t < 5550,
    passIn: t >= 5900,
    stamps: t >= STEP_AT[1] ? stamps : 0,
    reward: t >= 12650 && t < STEP_AT[2],
    scanOk: t >= 8450,
    notifs: NOTIF_AT.filter((a) => t >= a).length,
  };
}

const sameSnap = (a: Snap, b: Snap) => (Object.keys(a) as (keyof Snap)[]).every((k) => a[k] === b[k]);

export function HowItWorksStory({ c }: { c: HowCopy }) {
  const nameLen = c.nameVal.length;
  const [snap, setSnap] = useState<Snap>(() => snapshot(0, nameLen));
  const tRef = useRef(0);
  const lines = useRef<(HTMLSpanElement | null)[]>([]);
  const rootRef = useRef<HTMLDivElement>(null);
  const reduced = useRef(false);
  const snapRef = useRef(snap);

  const paint = useCallback((t: number) => {
    for (let i = 0; i < 2; i++) {
      const el = lines.current[i];
      if (!el) continue;
      const p = Math.max(0, Math.min(1, (t - STEP_AT[i]) / (STEP_AT[i + 1] - STEP_AT[i])));
      el.style.transform = `scaleX(${p})`;
    }
    const s = snapshot(t, nameLen);
    if (!sameSnap(s, snapRef.current)) {
      snapRef.current = s;
      setSnap(s);
    }
  }, [nameLen]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    reduced.current = mq.matches;
    if (reduced.current) {
      tRef.current = REST_AT[0];
      paint(tRef.current);
      return;
    }
    let visible = false;
    let raf = 0;
    let last = 0;
    const frame = (now: number) => {
      const dt = last ? Math.min(64, now - last) : 16;
      last = now;
      tRef.current = (tRef.current + dt) % LOOP;
      paint(tRef.current);
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      const run = visible && !document.hidden;
      if (run && !raf) { last = 0; raf = requestAnimationFrame(frame); }
      if (!run && raf) { cancelAnimationFrame(raf); raf = 0; }
    };
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; sync(); }, { threshold: 0.15 });
    io.observe(root);
    document.addEventListener('visibilitychange', sync);
    return () => { io.disconnect(); document.removeEventListener('visibilitychange', sync); cancelAnimationFrame(raf); };
  }, [paint]);

  const jump = (i: number) => {
    tRef.current = reduced.current ? REST_AT[i] : STEP_AT[i] + 1;
    paint(tRef.current);
  };

  const s = snap;
  const on = (sc: Scene) => (s.scene === sc ? ' is-on' : '');
  const steps = [c.s1, c.s2, c.s3];
  const months = c.months.split(',');
  // date picker wheels: [day index, month index, year offset]
  const wheel = s.picker === 2 || s.dateSet ? [13, 5, 2008 - 1998] : [3, 1, 2008 - 2004];
  const years = Array.from({ length: 19 }, (_, i) => String(2008 - i));
  const days = Array.from({ length: 31 }, (_, i) => String(i + 1));
  const notifs = [
    { t: c.n1t, b: c.n1b },
    { t: c.n2t, b: c.n2b },
    { t: c.n3t, b: c.n3b },
  ];
  const pass = (stamps: number, compact = false) => (
    <WalletPass pass={PASS_BY_SLUG.kebab} filled={stamps} required={10} holder={c.nameVal} compact={compact} />
  );

  return (
    <div className="hw" ref={rootRef}>
      <ol className="hw-steps">
        {steps.map((label, i) => (
          <li key={i} className={`hw-step${i === s.step ? ' is-active' : ''}${i < s.step ? ' is-done' : ''}`}>
            <button type="button" onClick={() => jump(i)} aria-current={i === s.step ? 'step' : undefined}>
              <span className="hw-dot">
                <span className="n">{i + 1}</span>
                <span className="ck">{Ico.check(16)}</span>
              </span>
              <span className="hw-lbl">{label}</span>
            </button>
            {i < 2 && <span className="hw-line" aria-hidden="true"><span ref={(el) => { lines.current[i] = el; }} /></span>}
          </li>
        ))}
      </ol>

      <div className="hw-stage">
        <div className={`hw-phone${s.step === 1 ? ' zoom' : ''}`} role="img" aria-label={c.phoneLabel}>
          <span className="hw-btn a" /><span className="hw-btn b" /><span className="hw-btn c" /><span className="hw-btn d" />
          <div className={`hw-screen sc-${s.scene}`}>
            <span className="hw-island" />

            {/* 1a camera */}
            <section className={`hw-scene hw-cam${on('cam')}`}>
              <StatusBar />
              <div className="hw-cam-top"><span className="ic">{Ico.flashOff(14)}</span><span>{Ico.chevU(12)}</span><span className="ic">{Ico.live(14)}</span></div>
              <div className={`hw-vf${s.focus ? ' focus' : ''}`}>
                <div className="hw-vf-world">
                  <span className="wall" />
                  <span className="spit"><i /></span>
                  <span className="lamp" />
                  <span className="pos"><i /></span>
                  <span className="counter" />
                  <div className="standee">
                    <b>{c.brand}</b>
                    <small>{c.brandSub}</small>
                    <em>{c.scanTitle}</em>
                    <span className="qrw">
                      <Qr size={84} seed={5} />
                      <span className="fb" />
                    </span>
                    <span className="badges"><i>{c.wallet2}</i><i>{c.wallet1}</i></span>
                  </div>
                  <span className="base" />
                </div>
                <span className={`hw-link${s.link ? ' show' : ''}${s.tap ? ' tap' : ''}`}>{Ico.link(10)}{c.url}</span>
                <span className="hw-zoom"><i>.5</i><i className="on">1×</i><i>2</i></span>
              </div>
              <div className="hw-modes"><span>{c.camSlo}</span><span>{c.camVideo}</span><span className="on">{c.cam}</span><span>{c.camPortrait}</span><span>{c.camPano}</span></div>
              <div className="hw-shutter-row"><span className="thumb" /><span className="shutter"><i /></span><span className="flip">{Ico.flip(14)}</span></div>
              <span className="hw-home light" />
            </section>

            {/* 1b join page */}
            <section className={`hw-scene hw-join${on('join')}`}>
              <div className="hw-join-head"><DoodleHeader /><StatusBar /></div>
              <div className="hw-join-logo"><ShopLogo name={c.brand} sub={c.brandSub} size={76} /></div>
              <div className="hw-join-body">
                <small className="shop">{c.shop}</small>
                <b className="ttl">{c.joinTitle}</b>
                <small className="sub">{c.joinSub}</small>
                <span className="rl">{c.rewardLabel}</span>
                <strong className="rw">{c.reward}</strong>
                <span className={`hw-in${s.typed > 0 ? ' filled' : ''}${s.typed > 0 && s.typed < nameLen ? ' typing' : ''}`}>
                  {s.typed > 0 ? c.nameVal.slice(0, s.typed) : c.namePh}<i className="caret" />
                </span>
                <span className="lab">{c.bdayLabel}</span>
                <span className={`hw-in date${s.dateSet ? ' filled' : ''}`}>{s.dateSet ? c.bdayVal : c.bdayPh}<span className="cal">{Ico.cal(11)}</span></span>
                <span className="hw-consent"><i className={s.consent ? 'on' : ''}>{Ico.check(9)}</i><span>{c.consent} <u>{c.consentLink}</u></span></span>
                <span className={`hw-addw${s.press ? ' press' : ''}`}>{Ico.pass(16)}<span><small>{c.addTo}</small>{c.wallet1}</span></span>
              </div>
              <div className={`hw-dim${s.picker ? ' show' : ''}`} />
              <div className={`hw-picker${s.picker ? ' show' : ''}`}>
                <div className="bar"><span>{c.pickCancel}</span><b>{c.pickDone}</b></div>
                <div className="wheels">
                  <span className="sel" />
                  {[days, months, years].map((list, w) => (
                    <div key={w} className={`wheel w${w}`}>
                      <div className="track" style={{ transform: `translateY(${(2 - wheel[w]) * 22}px)` }}>
                        {list.map((v, i) => <span key={i} className={i === wheel[w] ? 'cur' : ''}>{v}</span>)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <span className="hw-home" />
            </section>

            {/* 1c + 2b wallet */}
            <section className={`hw-scene hw-wallet${on('wallet')}`}>
              <StatusBar />
              <div className="hw-wallet-head"><b>{c.walletTitle}</b><span>+</span></div>
              <div className={`hw-pass-wrap${s.passIn || s.step > 0 ? ' in' : ''}`}>{pass(s.stamps)}</div>
              <div className="hw-others"><i /><i /><i /></div>
              <div className={`hw-banner${s.reward ? ' show' : ''}`}>
                <span className="app"><ShopLogo name={c.brand} sub={c.brandSub} size={26} /></span>
                <span className="tx"><b>{c.shop}<em>{c.now}</em></b><strong>{c.rewardTitle}</strong><small>{c.rewardBody}</small></span>
              </div>
            </section>

            {/* 2a staff scanner */}
            <section className={`hw-scene hw-scan${on('scan')}`}>
              <StatusBar />
              <div className="hw-scan-head">{Ico.chevL(11)}<b>{c.scannerTitle}</b></div>
              <div className="hw-modes2">
                <span className="m on">{Ico.scan(16)}<b>{c.giveStamp}</b><small>{c.giveStampSub}</small></span>
                <span className="m">{Ico.gift(16)}<b>{c.redeem}</b><small>{c.redeemSub}</small></span>
              </div>
              <div className="hw-mode-note"><b>{c.modeLabel}</b><small>{c.modeHint}</small></div>
              <div className={`hw-scanbox${s.scanOk ? ' ok' : ''}`}>
                <div className="card">{pass(0, true)}</div>
                <span className="cn tl" /><span className="cn tr" /><span className="cn bl" /><span className="cn br" />
                <span className="beam" />
              </div>
              <span className="hw-manual">{c.manual}</span>
              <small className="hw-scan-hint">{c.scanHint}</small>
            </section>

            {/* 2a' stamp added */}
            <section className={`hw-scene hw-added${on('added')}`}>
              <StatusBar />
              <span className="ring">{Ico.check(30)}</span>
              <span className="lbl">{c.stampAdded}</span>
              <span className="cnt"><b>1</b>/10</span>
            </section>

            {/* 3 lock screen */}
            <section className={`hw-scene hw-lock${on('lock')}`}>
              <StatusBar />
              <span className="lk">{Ico.lock(12)}</span>
              <span className="date">{c.lockDate}</span>
              <b className="clock">9:41</b>
              <div className="hw-notifs">
                {notifs.map((n, k) => {
                  const shown = k < s.notifs;
                  const pos = s.notifs - 1 - k;
                  const ago = pos === 0 ? c.now : c.minAgo.replace('{n}', String(pos * 2 + 1));
                  return (
                    <div key={k} className={`hw-notif${shown ? ' show' : ''}`} style={shown ? { transform: `translateY(${pos * 64}px)` } : undefined}>
                      <span className="app"><ShopLogo name={c.brand} sub={c.brandSub} size={26} /></span>
                      <span className="tx"><b>{c.shop}<em>{ago}</em></b><strong>{n.t}</strong><small>{n.b}</small></span>
                    </div>
                  );
                })}
              </div>
              <span className="hw-home light" />
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
