'use client';

import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { avatarsAvatar01, avatarsBadgeCheck, avatarsGuestGrey, iconsSpotCoins, iconsSpotFootsteps, iconsSpotLoop } from '@/components/illustration/illo-data';
import { SectionHead } from './Features';
import { AutoRows, WalletStack, LiveFeed, TeamRows, BdayPhone, NearMap } from './bento/BentoVis';
import type { AutoCopy, WalletCopy, LiveCopy, TeamCopy, BdayCopy, NearCopy } from './bento/BentoVis';
import './bento/bento.css';
import './p8.css';

export function Bento() {
  const { t } = useT();
  const auto: AutoCopy = { rows: [1, 2, 3].map((i) => ({ t: t(`landing.bento.auto.r${i}`), s: t(`landing.bento.auto.r${i}s`), m: t(`landing.bento.auto.r${i}m`) })), sent: t('landing.bento.auto.sent') };
  const wallet: WalletCopy = { apple: t('landing.bento.wallet.a'), google: t('landing.bento.wallet.g') };
  const live: LiveCopy = {
    live: t('landing.bento.live.live'),
    names: [1, 2, 3, 4, 5].map((i) => t(`landing.bento.live.n${i}`)),
    actions: [1, 2, 3].map((i) => t(`landing.bento.live.e${i}`)),
    when: [0, 1, 2].map((i) => t(`landing.bento.live.w${i}`)),
  };
  const team: TeamCopy = {
    rows: [{ n: 'Sarah', r: t('landing.bento.team.r1') }, { n: 'Tom', r: t('landing.bento.team.r2') }],
    perms: [1, 2, 3].map((i) => t(`landing.bento.team.p${i}`)),
  };
  const bday: BdayCopy = { shop: t('landing.bento.bday.shop'), msg: t('landing.bento.bday.msg'), now: t('landing.bento.bday.now') };
  const near: NearCopy = { shop: t('landing.bento.near.shop'), msg: t('landing.bento.near.msg'), when: t('landing.bento.near.when') };
  const txt = (k: string) => <div className="bx-txt"><h3>{t(`landing.bento.${k}.title`)}</h3><p>{t(`landing.bento.${k}.body`)}</p></div>;
  return (
    <section className="sec alt" id="benefits">
      <SectionHead eyebrow={t('landing.bento.eyebrow')} t1={t('landing.bento.title1')} t2={t('landing.bento.title2')} sub={t('landing.bento.sub')} />
      <div className="bx-grid">
        <div className="bx-col">
          <article className="bx-card bx-auto-c" data-reveal><AutoRows copy={auto} />{txt('auto')}</article>
          <article className="bx-card bx-team-c" data-reveal><TeamRows copy={team} />{txt('team')}</article>
        </div>
        <div className="bx-col">
          <article className="bx-card bx-wallet-c" data-reveal><WalletStack copy={wallet} />{txt('wallet')}</article>
          <article className="bx-card bx-bday-c" data-reveal><BdayPhone copy={bday} />{txt('bday')}</article>
        </div>
        <div className="bx-col">
          <article className="bx-card bx-live-c" data-reveal><LiveFeed copy={live} />{txt('live')}</article>
          <article className="bx-card bx-near-c" data-reveal><NearMap copy={near} />{txt('near')}</article>
        </div>
      </div>
    </section>
  );
}

export function Problem() {
  const { t } = useT();
  return (
    <section className="sec">
      <SectionHead eyebrow={t('landing.prob.eyebrow')} t1={t('landing.prob.title1')} t2={t('landing.prob.title2')} br sub={t('landing.prob.sub')} />
      <div className="cards3 prob">
        <article className="pcard" data-reveal>
          <div className="pvis">
            <div className="pm"><span className="pm-h"><small>{t('landing.prob.c1.mock')}</small><em className="loss"><Icon name="trending_down" size={13} /> {t('landing.prob.c1.loss')}</em></span>
              <b className="num60">60<span>%</span></b>
              <span className="track"><u className="bar60" style={{ width: '60%' }} /></span>
              <small>{t('landing.prob.c1.of')}</small></div>
          </div>
          <div className="plabel"><i className="n r">1</i>{t('landing.prob.c1.label')}<IlloSvg data={iconsSpotFootsteps} className="spot" /></div>
          <h3>{t('landing.prob.c1.title')}</h3><p>{t('landing.prob.c1.body')}</p>
        </article>
        <article className="pcard" data-reveal>
          <div className="pvis">
            <div className="pm row">
              <svg width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r="30" fill="none" stroke="#D7DDE7" strokeWidth="9" /><circle className="ring65" cx="38" cy="38" r="30" fill="none" stroke="#044DF2" strokeWidth="9" strokeDasharray="122 189" strokeLinecap="round" transform="rotate(-90 38 38)" /><text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="500" fill="#071130">65 %</text></svg>
              <span className="legend"><small>{t('landing.prob.c2.mock')}</small>
                <span><i className="d b" />{t('landing.prob.c2.reg')}</span><b>650€</b>
                <span><i className="d" />{t('landing.prob.c2.one')}</span><b className="dim">350€</b></span>
            </div>
          </div>
          <div className="plabel"><i className="n">2</i>{t('landing.prob.c2.label')}<IlloSvg data={iconsSpotCoins} className="spot" /></div>
          <h3>{t('landing.prob.c2.title')}</h3><p>{t('landing.prob.c2.body')}</p>
        </article>
        <article className="pcard" data-reveal>
          <div className="pvis flowv">
            <div className="fl"><span className="fn fn-av"><IlloSvg data={avatarsGuestGrey} className="fn-art" /></span><small>{t('landing.prob.c3.guest')}</small></div>
            <i className="fline" aria-hidden="true"><b /></i>
            <div className="fl"><span className="fn sq"><LogoMark size={26} /></span><small>{t('common.appName').toLowerCase()}</small></div>
            <i className="fline f2" aria-hidden="true"><b /></i>
            <div className="fl"><span className="fn fn-av"><IlloSvg data={avatarsAvatar01} className="fn-art" /><IlloSvg data={avatarsBadgeCheck} className="fcheck" /></span><small>{t('landing.prob.c3.reg')}</small></div>
            <Link href="/signup" className="btn btn-lg wide">{t('landing.cta.trial')} <Icon name="arrow_forward" size={20} /></Link>
          </div>
          <div className="plabel"><i className="n b">3</i>{t('landing.prob.c3.label')}<IlloSvg data={iconsSpotLoop} className="spot" /></div>
          <h3>{t('landing.prob.c3.title')}</h3><p>{t('landing.prob.c3.body')}</p>
        </article>
      </div>
      <p className="fine">{t('landing.prob.note')}</p>
    </section>
  );
}
