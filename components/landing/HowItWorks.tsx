import { getServerI18n } from '@/lib/i18n-server';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { QrMock, SectionHead, StampGrid } from './Features';

export async function HowItWorks() {
  const { t } = await getServerI18n();
  const steps = [1, 2, 3] as const;
  return (
    <section className="sec" id="how">
      <SectionHead eyebrow={t('landing.how.eyebrow')} t1={t('landing.how.title1')} t2={t('landing.how.title2')} sub={t('landing.how.sub')} />
      <div className="hiw" data-reveal>
        {steps.map((n) => (
          <input key={n} type="radio" name="hiw" id={`hs${n}`} defaultChecked={n === 1} className="hiw-r" aria-label={t(`landing.how.s${n}`)} />
        ))}
        <div className="hiw-steps">
          {steps.map((n, i) => (
            <span key={n} className="hs-wrap">
              <label htmlFor={`hs${n}`} className={`hs hs${n}`}>
                <span className="num">{n}</span>
                <span className="lbl">{t(`landing.how.s${n}`)}</span>
              </label>
              {i < 2 && <span className="hs-line" />}
            </span>
          ))}
        </div>
        <div className="hiw-panels">
          <div className="hp hp1">
            <div className="phone lg">
              <div className="phone-screen cam">
                <span className="island" />
                <div className="cam-view">
                  <div className="poster">
                    <b>{t('landing.how.shop')}</b>
                    <span>{t('landing.how.scanTitle')}</span>
                    <QrMock size={64} />
                    <div className="pwb"><i>{t('landing.how.wallet1')}</i><i>{t('landing.how.wallet2')}</i></div>
                  </div>
                  <span className="frame" />
                </div>
                <div className="cam-modes"><span>{t('landing.how.cam')}</span></div>
                <div className="cam-btn"><i /></div>
              </div>
            </div>
          </div>
          <div className="hp hp2">
            <div className="phone lg">
              <div className="phone-screen wallet">
                <span className="island" />
                <div className="wcard big">
                  <div className="wcard-top"><b>{t('landing.how.shop')}</b><span>{t('landing.feat.c1.owner')}</span></div>
                  <div className="wcard-hero"><b>{t('landing.how.stampsOf')}</b><small>{t('landing.how.stampsLabel')}</small></div>
                  <StampGrid n={8} filled={6} size={28} color="#F3D9B8" />
                </div>
                <div className="toast"><Icon name="check_circle" size={20} fill /><span><b>{t('landing.how.staffTitle')}</b><small>{t('landing.how.staffSub')}</small></span></div>
              </div>
            </div>
          </div>
          <div className="hp hp3">
            <div className="phone lg">
              <div className="phone-screen lock">
                <span className="island" />
                <Icon name="lock" size={14} fill className="lk" />
                <b className="clock">9:41</b>
                <span className="date">{t('landing.feat.c2.date')}</span>
                <div className="notifs">
                  <div className="notif"><span className="app"><LogoMark size={20} /></span><div><b>{t('landing.how.shop')}<em>{t('landing.how.now')}</em></b><small>{t('landing.how.lockNote')}</small></div></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
