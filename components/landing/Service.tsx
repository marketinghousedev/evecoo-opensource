'use client';

import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { QrMock, SectionHead } from './Features';

export function Service() {
  const { t } = useT();
  return (
    <section className="sec alt2" id="service">
      <SectionHead eyebrow={t('landing.svc.eyebrow')} t1={t('landing.svc.title1')} t2={t('landing.svc.title2')} br sub={t('landing.svc.sub')} />
      <div className="svc">
        <article className="scard s-post" data-reveal>
          <span className="free"><Icon name="check_circle" size={20} fill />{t('landing.svc.post')}</span>
          <div className="poster-big">
            <i className="moon" />
            <b>{t('landing.svc.poster1')}</b><strong>{t('landing.svc.poster2')}</strong>
            <QrMock size={92} />
            <small>{t('landing.svc.poster3')}</small>
          </div>
          <div className="stand" />
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
          <div className="svis chat">
            <div className="bub out">{t('landing.svc.chat1')}<small>10:12</small></div>
            <div className="bub in"><LogoMark size={18} />{t('landing.svc.chat2')}<small>10:14</small></div>
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
