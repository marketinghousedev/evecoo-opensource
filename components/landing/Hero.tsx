'use client';

import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { Icon } from './Icon';
import { HeroFlow } from './hero/HeroFlow';

const AV = ['#F4A261', '#E76F51', '#2A9D8F', '#264653', '#8E7DBE'];
export function Hero() {
  const { t } = useT();
  return (
    <section className="hero">
      <div className="hero-in">
        <div className="proof" data-reveal>
          <span className="proof-faces">
            {[0, 1, 2, 3].map((i) => <span key={i} style={{ background: AV[i] }} />)}
          </span>
          <span className="proof-txt">
            <span className="stars" aria-hidden="true">
              {[0, 1, 2, 3, 4].map((i) => <Icon key={i} name="star" size={13} fill />)}
            </span>
            <b>{t('landing.hero.badgeCount')}</b>
          </span>
        </div>
        <h1 data-reveal>
          {t('landing.hero.title1')}{' '}<br />{t('landing.hero.title2')}{' '}<br />
          <span className="blue">{t('landing.hero.title3')}</span>
        </h1>
        <p className="hero-sub" data-reveal>
          {t('landing.hero.sub1')}{' '}<br />{t('landing.hero.sub2')}
        </p>
        <div data-reveal>
          <Link href="/signup" className="btn btn-xl btn-glow">
            {t('landing.cta.create')} <Icon name="arrow_forward" size={22} />
          </Link>
        </div>
        <p className="hero-note">
          <Icon name="lock" size={15} fill /> <span>{t('landing.hero.note1')}</span>
          <i className="sep" /> <span>{t('landing.hero.note2')}</span>
        </p>
      </div>

      <HeroFlow
        copy={{
          once: t('landing.hero.once'),
          regulars: t('landing.hero.regulars'),
          label: t('landing.hero.flowLabel'),
          left: [t('landing.hero.walkin'), t('landing.hero.firstVisit'), t('landing.hero.oneTimeChip')],
          right: [t('landing.hero.newreg'), t('landing.hero.back'), t('landing.hero.plusStamp')],
        }}
      />
    </section>
  );
}
