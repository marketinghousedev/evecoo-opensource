import Link from 'next/link';
import { getServerI18n } from '@/lib/i18n-server';
import { Icon } from './Icon';
import { LogoMark } from './Logo';

const AV = ['#F4A261', '#E76F51', '#2A9D8F', '#264653', '#8E7DBE'];
const SKIN = ['#F3C9A5', '#D9A27A', '#B9835F', '#F0D2B8'];

function Face({ i, size = 52, badge }: { i: number; size?: number; badge?: 'user' | 'check' }) {
  return (
    <span className="face" style={{ width: size, height: size, background: AV[i % AV.length] }}>
      <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true">
        <circle cx="20" cy="16" r="7" fill={SKIN[i % SKIN.length]} />
        <path d="M6 40c1-9 7-13 14-13s13 4 14 13Z" fill="#fff" opacity=".9" />
      </svg>
      {badge && <span className={`face-badge ${badge}`}><Icon name={badge === 'user' ? 'person' : 'check'} size={11} fill /></span>}
    </span>
  );
}

export async function Hero() {
  const { t } = await getServerI18n();
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
          {t('landing.hero.title1')}<br />{t('landing.hero.title2')}<br />
          <span className="blue">{t('landing.hero.title3')}</span>
        </h1>
        <p className="hero-sub" data-reveal>
          {t('landing.hero.sub1')}<br />{t('landing.hero.sub2')}
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

      <div className="flow" aria-hidden="true">
        <svg className="flow-lines" viewBox="0 0 1440 440" preserveAspectRatio="none">
          <path d="M0 140C300 40 560 150 720 220S1140 400 1440 300" fill="none" stroke="#C9D6F5" strokeWidth="1.5" />
          <path d="M0 260C300 170 560 230 720 260S1100 220 1440 120" fill="none" stroke="#C9D6F5" strokeWidth="1.5" />
          <path d="M0 330C320 330 560 300 720 290S1120 330 1440 400" fill="none" stroke="#DCE5F8" strokeWidth="1.5" />
        </svg>
        <span className="flow-label l">{t('landing.hero.once')}</span>
        <span className="flow-label r">{t('landing.hero.regulars')}</span>
        <span className="flow-line" />
        <span className="flow-node"><LogoMark size={30} /></span>
        <span className="fc fc-a"><Face i={4} size={46} /></span>
        <span className="fc fc-b chip"><Icon name="person" size={18} />{t('landing.hero.walkin')}</span>
        <span className="fc fc-c"><Face i={3} size={42} /></span>
        <span className="fc fc-d chip faded"><Icon name="person" size={18} />{t('landing.hero.oneTimeChip')}</span>
        <span className="fc fc-e"><Face i={0} size={52} badge="user" /></span>
        <span className="fc fc-f chip"><LogoMark size={16} />{t('landing.hero.newreg')}</span>
        <span className="fc fc-g"><Face i={1} size={54} badge="user" /></span>
        <span className="fc fc-h chip"><LogoMark size={16} />{t('landing.hero.back')}</span>
        <span className="fc fc-i"><Face i={2} size={50} badge="check" /></span>
      </div>
    </section>
  );
}
