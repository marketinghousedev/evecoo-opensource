'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useT } from '@/components/I18nProvider';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { scenesLockscreenWallpaperBlue } from '@/components/illustration/illo-data';
import { STAMPS, STAMP_NAMES, type StampName } from '@/components/illustration/stamps';
import { core, accents } from '@/components/illustration/palette';
import { SectionHead } from '../Features';
import { WalletPass } from '../WalletPass';
import { PASS_BY_SLUG, PASSES, type PassDef } from '../passes';
import { PushPhone, type PushCopy } from '../features/PushPhone';
import { DashMini, type DashCopy } from '../features/DashMini';
import '../features/features.css';
import './featuresb.css';

/** Card colours, all from the illustration palette. fg/label are checked against bg (>= 4.5:1). */
const SWATCHES = [
  { id: 'brand', bg: core.brand, fg: '#FFFFFF', label: core.brandMuted },
  { id: 'deep', bg: core.brandDeep, fg: '#FFFFFF', label: core.brandMuted },
  { id: 'navy', bg: core.navy, fg: '#FFFFFF', label: core.border },
  { id: 'espresso', bg: accents.espresso, fg: '#FFFFFF', label: accents.espressoSoft },
  { id: 'tomato', bg: accents.tomato, fg: '#FFFFFF', label: '#FFFFFF' },
  { id: 'berry', bg: accents.berry, fg: '#FFFFFF', label: '#FFFFFF' },
  { id: 'herb', bg: accents.herb, fg: '#FFFFFF', label: '#FFFFFF' },
  { id: 'soft', bg: core.brandSoft, fg: core.navy, label: core.brandDeep },
] as const;

const STAMP_COUNTS = [6, 8, 10, 12] as const;
/** Strip/mark art borrowed from the demo pass that uses the same stamp, else Bloom. */
const artFor = (stamp: StampName): PassDef => PASSES.find((p) => p.stamp === stamp) ?? PASS_BY_SLUG.bloom;

type Sent = { id: number };
const GAP = 86;

export function FeaturesB() {
  const { t } = useT();
  const uid = useId();
  const [name, setName] = useState(() => t('landing.featb.defName'));
  const [color, setColor] = useState(0);
  const [stamp, setStamp] = useState<StampName>('coffee');
  const [count, setCount] = useState<number>(8);
  const [reward, setReward] = useState(() => t('landing.featb.defReward'));
  const [sent, setSent] = useState<Sent[]>([]);
  const [tab, setTab] = useState<'push' | 'dash'>('push');
  const seq = useRef(0);

  const sw = SWATCHES[color];
  const art = artFor(stamp);
  const shown = name.trim() || t('landing.featb.defName');
  const rewardShown = reward.trim() || t('landing.featb.defReward');
  const pass: PassDef = { ...art, name: shown, bg: sw.bg, fg: sw.fg, label: sw.label, stamp, stampsRequired: count, current: Math.min(count - 1, Math.max(1, count - 2)) };

  const send = () => setSent((s) => [{ id: ++seq.current }, ...s].slice(0, 3));

  const push: PushCopy = {
    date: t('landing.feat.c2.date'),
    ago: [t('landing.feat.c2.now'), t('landing.feat.c2.ago2'), t('landing.feat.c2.ago3')],
    msgs: [1, 2, 3].map((i) => ({ shop: t(`landing.feat.c2.m${i}.shop`), title: t(`landing.feat.c2.m${i}.title`), body: t(`landing.feat.c2.m${i}.body`) })),
  };
  const dash: DashCopy = {
    ret: t('landing.feat.c3.ret'), retSub: t('landing.feat.c3.retSub', { a: '{a}', b: '{b}' }), cust: t('landing.feat.c3.cust'),
    week: t('landing.feat.c3.week', { n: '{n}' }), byTime: t('landing.feat.c3.byTime'), peak: t('landing.feat.c3.peak'),
    byDay: t('landing.feat.c3.byDay'), best: t('landing.feat.c3.best'), days: t('landing.feat.c3.days').split(','),
    stamps: t('landing.feat.c3.stamps'), rewards: t('landing.feat.c3.rewards'), messages: t('landing.feat.c3.messages'),
  };

  // stamp-pop on colour/icon changes is handled by StampGrid; the pass wrapper gets a short "bump" via key-less class toggle
  const [bump, setBump] = useState(0);
  useEffect(() => { setBump((b) => b + 1); }, [color, stamp, count]);

  return (
    <section className="sec" id="features">
      <SectionHead eyebrow={t('landing.featb.eyebrow')} t1={t('landing.featb.title1')} t2={t('landing.featb.title2')} sub={t('landing.featb.sub')} />
      <div className="fb">
        <div className="fb-controls fcard" data-reveal>
          <div className="fb-field">
            <label htmlFor={`${uid}-name`}>{t('landing.featb.lblName')}</label>
            <input id={`${uid}-name`} className="input" value={name} maxLength={22} placeholder={t('landing.featb.namePh')} onChange={(e) => setName(e.target.value)} autoComplete="off" />
          </div>
          <div className="fb-field" role="group" aria-labelledby={`${uid}-c`}>
            <span id={`${uid}-c`} className="fb-lbl">{t('landing.featb.lblColor')}</span>
            <div className="fb-swatches">
              {SWATCHES.map((s, i) => (
                <button key={s.id} type="button" className={`fb-sw${i === color ? ' on' : ''}`} style={{ background: s.bg }} aria-pressed={i === color} aria-label={t('landing.featb.colorN', { n: i + 1 })} onClick={() => setColor(i)} />
              ))}
            </div>
          </div>
          <div className="fb-field" role="group" aria-labelledby={`${uid}-i`}>
            <span id={`${uid}-i`} className="fb-lbl">{t('landing.featb.lblIcon')}</span>
            <div className="fb-icons">
              {STAMP_NAMES.map((n) => (
                <button key={n} type="button" className={`fb-ic${n === stamp ? ' on' : ''}`} aria-pressed={n === stamp} aria-label={n} onClick={() => setStamp(n)}>
                  <IlloSvg data={STAMPS[n].filled} />
                </button>
              ))}
            </div>
          </div>
          <div className="fb-field" role="group" aria-labelledby={`${uid}-s`}>
            <span id={`${uid}-s`} className="fb-lbl">{t('landing.featb.lblStamps')}</span>
            <div className="fb-seg">
              {STAMP_COUNTS.map((n) => (
                <button key={n} type="button" className={n === count ? 'on' : ''} aria-pressed={n === count} onClick={() => setCount(n)}>{n}</button>
              ))}
            </div>
          </div>
          <div className="fb-field">
            <label htmlFor={`${uid}-r`}>{t('landing.featb.lblReward')}</label>
            <input id={`${uid}-r`} className="input" value={reward} maxLength={26} placeholder={t('landing.featb.rewardPh')} onChange={(e) => setReward(e.target.value)} autoComplete="off" />
          </div>
        </div>

        <div className="fb-stage fcard" data-reveal>
          <div className="fb-pass" role="img" aria-label={t('landing.featb.previewLabel')}>
            <div className="fb-pass-in" key={bump}>
              <WalletPass pass={pass} filled={pass.current} required={count} holder="Max Mustermann" reward={rewardShown} />
            </div>
          </div>

          <div className="fb-phone-col">
            <div className="fb-phone" aria-live="polite">
              <div className="fx-screen">
                <IlloSvg data={scenesLockscreenWallpaperBlue} className="fx-wall" preserveAspectRatio="xMidYMid slice" />
                <span className="fx-island" />
                <div className="fx-status"><b>9:41</b><i /></div>
                <div className="fx-clock fb-clock">9:41</div>
                <div className="fx-date">{push.date}</div>
              </div>
              <div className="fx-notifs fb-notifs">
                {sent.map((m, age) => (
                  <div key={m.id} className={`fx-notif${age === 0 ? ' fresh' : ''}`} style={{ transform: `translateY(${age * GAP}px)`, zIndex: 4 - age }}>
                    <span className="fx-app fb-app" style={{ background: sw.bg }}>
                      <IlloSvg data={STAMPS[stamp].mono} className="fx-app-mark" style={{ color: sw.fg }} />
                    </span>
                    <div>
                      <b>{shown}<em>{age === 0 ? t('landing.featb.now') : t('landing.featb.agoMin', { n: age * 2 })}</em></b>
                      <strong>{t('landing.featb.msgTitle')}</strong>
                      <small>{t('landing.featb.msgBody', { reward: rewardShown })}</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button type="button" className="btn fb-send" onClick={send}>{t('landing.featb.send')}</button>
            <p className="fb-hint">{t('landing.featb.sendHint')}</p>
          </div>
        </div>

        <div className="fb-more" data-reveal>
          <div className="fb-tabs" role="tablist" aria-label={t('landing.featb.tabsLabel')}>
            {(['push', 'dash'] as const).map((k) => (
              <button key={k} type="button" role="tab" id={`${uid}-t-${k}`} aria-selected={tab === k} aria-controls={`${uid}-p-${k}`} tabIndex={tab === k ? 0 : -1}
                className={tab === k ? 'on' : ''} onClick={() => setTab(k)}
                onKeyDown={(e) => { if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') { setTab(k === 'push' ? 'dash' : 'push'); } }}>
                {t(k === 'push' ? 'landing.featb.tabPush' : 'landing.featb.tabDash')}
              </button>
            ))}
          </div>
          <article className="fcard fb-panel" role="tabpanel" id={`${uid}-p-${tab}`} aria-labelledby={`${uid}-t-${tab}`}>
            <h3>{t(tab === 'push' ? 'landing.feat.c2.title' : 'landing.feat.c3.title')}</h3>
            <p>{t(tab === 'push' ? 'landing.feat.c2.body' : 'landing.feat.c3.body')}</p>
            {tab === 'push' ? <PushPhone copy={push} /> : <DashMini copy={dash} />}
          </article>
        </div>
      </div>
    </section>
  );
}
