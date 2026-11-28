'use client';

import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { SectionHead } from './Features';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { scenesCounterStand, scenesParcel } from '@/components/illustration/illo-data';
import { QrPoster } from './QrPoster';
import './p8.css';

function Ticks() {
  return (
    <svg className="ticks" viewBox="0 0 18 10" width="15" height="9" fill="none" stroke="#12945A" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m1 5.5 3 3L10 1.5M8 8.5l.5.5L15 1.5" /></svg>
  );
}

export function Service() {
  const { t } = useT();
  return (
    <section className="sec alt2" id="service">
      <SectionHead eyebrow={t('landing.svc.eyebrow')} t1={t('landing.svc.title1')} t2={t('landing.svc.title2')} br sub={t('landing.svc.sub')} />
      <div className="svc">
        <article className="scard s-post" data-reveal>
          <span className="free"><Icon name="check_circle" size={20} fill />{t('landing.svc.post')}</span>
          <div className="stand-scene">
            <IlloSvg data={scenesCounterStand} className="stand-art illo-lift" />
            <div className="stand-poster"><QrPoster /></div>
            <IlloSvg data={scenesParcel} className="parcel-art illo-lift" />
          </div>
          <div className="stxt"><h3>{t('landing.svc.shipTitle')}</h3><p>{t('landing.svc.shipBody')}</p></div>
        </article>
        <article className="scard s-card" data-reveal>
          <div className="svis">
            <div className="wcard big mini">
              <div className="wcard-top"><b>{t('landing.svc.shop')}</b><span>{t('landing.feat.c1.owner')}</span></div>
              <div className="wcard-hero"><b>{t('landing.svc.of')}</b></div>
            </div>
          </div>
          <div className="stxt"><h3>{t('landing.svc.cardTitle')}</h3><p>{t('landing.svc.cardBody')}</p></div>
        </article>
        <article className="scard s-setup" data-reveal>
          <div className="svis">
            <ul className="checks">{[1, 2, 3, 4].map((i) => <li key={i}><Icon name="check_circle" size={20} fill />{t(`landing.svc.i${i}`)}</li>)}</ul>
          </div>
          <div className="stxt"><h3>{t('landing.svc.setupTitle')}</h3><p>{t('landing.svc.setupBody')}</p></div>
        </article>
        <article className="scard s-chat" data-reveal>
          <div className="svis chat" aria-hidden="true">
            <div className="msgr">
              <div className="msgr-top"><LogoMark size={22} /><span><b>{t('common.appName')}</b><i className="dot" /></span></div>
              <div className="msgr-body">
                <div className="bub out">{t('landing.svc.chat1')}<small>10:12<Ticks /></small></div>
                <div className="bub in">{t('landing.svc.chat2')}<small>10:14</small></div>
              </div>
              <div className="msgr-in"><span /><i><svg viewBox="0 0 14 14" width="12" height="12" fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 7h10M8 3l4 4-4 4" /></svg></i></div>
            </div>
          </div>
          <div className="stxt"><h3>{t('landing.svc.stayTitle')}</h3><p>{t('landing.svc.stayBody')}</p></div>
        </article>
        <article className="scard s-navy" data-reveal>
          <small className="ey">{t('landing.svc.only')}</small>
          <h3>{t('landing.svc.task')}</h3>
          <Link href="/signup" className="btn btn-white btn-lg">{t('landing.cta.signupNow')} <Icon name="arrow_forward" size={20} /></Link>
        </article>
      </div>
    </section>
  );
}
