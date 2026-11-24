import Link from 'next/link';
import { getServerI18n } from '@/lib/i18n-server';
import { Icon } from './Icon';
import { LogoMark } from './Logo';
import { SectionHead, StampGrid } from './Features';

function Toggle() { return <span className="tgl"><i /></span>; }

export async function Bento() {
  const { t } = await getServerI18n();
  const rows: [string, string, string, string][] = [
    ['history', 'r1', 'r1s', '#FFF1E0'],
    ['celebration', 'r2', 'r2s', '#E6F6EC'],
    ['cake', 'r3', 'r3s', '#FCE8F1'],
  ];
  return (
    <section className="sec alt" id="benefits">
      <SectionHead eyebrow={t('landing.bento.eyebrow')} t1={t('landing.bento.title1')} t2={t('landing.bento.title2')} sub={t('landing.bento.sub')} />
      <div className="bento">
        <article className="bcard b-auto" data-reveal>
          <div className="bvis">
            {rows.map(([ic, a, b, bg], i) => (
              <div key={a} className={`arow${i === 0 ? ' open' : ''}`}>
                <div className="arow-h">
                  <span className="aic" style={{ background: bg }}><Icon name={ic} size={18} /></span>
                  <span className="atx"><b>{t(`landing.bento.auto.${a}`)}</b><small>{t(`landing.bento.auto.${b}`)}</small></span>
                  <Toggle />
                </div>
                {i === 0 && <div className="aq"><span>{t('landing.bento.auto.r1m')}</span><em><Icon name="done_all" size={14} /> {t('landing.bento.auto.sent')}</em></div>}
              </div>
            ))}
          </div>
          <div className="btxt"><h3>{t('landing.bento.auto.title')}</h3><p>{t('landing.bento.auto.body')}</p></div>
        </article>

        <article className="bcard b-wallet" data-reveal>
          <div className="bvis wallets">
            {[['c1', '#3B2A22'], ['c2', '#4A3126'], ['c3', '#5A3B2B']].map(([k, c], i) => (
              <div key={k} className="wc" style={{ background: c, top: i * 12, transform: `scale(${0.9 + i * 0.05})`, zIndex: i }}>
                <b>{t(`landing.bento.wallet.${k}`)}</b>
                {i === 2 && <><strong>{t('landing.bento.wallet.of')}</strong><small>{t('landing.bento.wallet.stamps')}</small></>}
              </div>
            ))}
            <div className="wbtns"><span className="wb dark"><Icon name="phone_iphone" size={14} fill /> {t('landing.bento.wallet.a')}</span><span className="wb"><b className="g">G</b> {t('landing.bento.wallet.g')}</span></div>
          </div>
          <div className="btxt"><h3>{t('landing.bento.wallet.title')}</h3><p>{t('landing.bento.wallet.body')}</p></div>
        </article>

        <article className="bcard b-live" data-reveal>
          <div className="bvis">
            <span className="live"><i />{t('landing.bento.live.live')}</span>
            {[['e1', .5], ['e2', 1], ['e3', 1]].map(([k, o], i) => (
              <div key={String(k)} className="lrow" style={{ opacity: Number(o) }}>
                <span className="av" style={{ background: ['#F4A261', '#E76F51', '#2A9D8F'][i] }} />
                <span className="atx"><b>{['Jonas B.', 'Helga S.', 'Max M.'][i]}</b><small className={i === 1 ? 'g' : ''}>{t(`landing.bento.live.${k}`)}</small></span>
                <small>{t(`landing.bento.live.${k}w`)}</small>
              </div>
            ))}
          </div>
          <div className="btxt"><h3>{t('landing.bento.live.title')}</h3><p>{t('landing.bento.live.body')}</p></div>
        </article>

        <article className="bcard b-team" data-reveal>
          <div className="bvis">
            {[['Sarah', 'r1', [1, 1, 0]], ['Tom', 'r2', [1, 0, 0]]].map(([n, r, on]) => (
              <div key={String(n)} className="trow">
                <span className="aic" style={{ background: '#E8EFFE' }}><Icon name="badge" size={18} /></span>
                <span className="atx"><b>{n as string}</b><small>{t(`landing.bento.team.${r}`)}</small></span>
                <span className="perms">{[1, 2, 3].map((p, i) => <i key={p} className={(on as number[])[i] ? 'on' : ''}>{t(`landing.bento.team.p${p}`)}</i>)}</span>
              </div>
            ))}
          </div>
          <div className="btxt"><h3>{t('landing.bento.team.title')}</h3><p>{t('landing.bento.team.body')}</p></div>
        </article>

        <article className="bcard b-bday" data-reveal>
          <div className="bvis phone-crop">
            <div className="phone sm">
              <div className="phone-screen lock">
                <span className="island" />
                <b className="clock">9:41</b>
                <div className="notifs"><div className="notif"><span className="app"><LogoMark size={20} /></span><div><b>{t('landing.bento.bday.shop')}<em>{t('landing.bento.bday.now')}</em></b><small>{t('landing.bento.bday.msg')}</small></div></div></div>
              </div>
            </div>
          </div>
          <div className="btxt"><h3>{t('landing.bento.bday.title')}</h3><p>{t('landing.bento.bday.body')}</p></div>
        </article>

        <article className="bcard b-near" data-reveal>
          <div className="bvis map">
            <svg viewBox="0 0 300 150" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
              <rect width="300" height="150" fill="#EEF1F6" />
              <path d="M-10 40h320M-10 120h320M70-10v170M190-10v170M260-10v170" stroke="#fff" strokeWidth="10" />
              <path d="M-10 80l320-20" stroke="#fff" strokeWidth="6" />
              <rect x="90" y="52" width="40" height="28" fill="#E1E6EF" /><rect x="200" y="86" width="45" height="26" fill="#E1E6EF" /><rect x="10" y="90" width="38" height="22" fill="#E1E6EF" />
              <circle cx="150" cy="70" r="40" fill="#044DF2" opacity=".1" />
            </svg>
            <span className="pin"><LogoMark size={22} /></span>
            <div className="notif"><span className="app"><LogoMark size={20} /></span><div><b>{t('landing.bento.near.shop')}<em>{t('landing.bento.near.when')}</em></b><small>{t('landing.bento.near.msg')}</small></div></div>
          </div>
          <div className="btxt"><h3>{t('landing.bento.near.title')}</h3><p>{t('landing.bento.near.body')}</p></div>
        </article>
      </div>
    </section>
  );
}

export async function Problem() {
  const { t } = await getServerI18n();
  return (
    <section className="sec">
      <SectionHead eyebrow={t('landing.prob.eyebrow')} t1={t('landing.prob.title1')} t2={t('landing.prob.title2')} br sub={t('landing.prob.sub')} />
      <div className="cards3 prob">
        <article className="pcard" data-reveal>
          <div className="pvis">
            <div className="pm"><span className="pm-h"><small>{t('landing.prob.c1.mock')}</small><em className="loss"><Icon name="trending_down" size={13} /> {t('landing.prob.c1.loss')}</em></span>
              <b className="num60">60<span>%</span></b>
              <span className="track"><u style={{ width: '60%' }} /></span>
              <small>{t('landing.prob.c1.of')}</small></div>
          </div>
          <div className="plabel"><i className="n r">1</i>{t('landing.prob.c1.label')}</div>
          <h3>{t('landing.prob.c1.title')}</h3><p>{t('landing.prob.c1.body')}</p>
        </article>
        <article className="pcard" data-reveal>
          <div className="pvis">
            <div className="pm row">
              <svg width="76" height="76" viewBox="0 0 76 76"><circle cx="38" cy="38" r="30" fill="none" stroke="#D7DDE7" strokeWidth="9" /><circle cx="38" cy="38" r="30" fill="none" stroke="#044DF2" strokeWidth="9" strokeDasharray="122 189" strokeLinecap="round" transform="rotate(-90 38 38)" /><text x="38" y="43" textAnchor="middle" fontSize="15" fontWeight="500" fill="#071130">65 %</text></svg>
              <span className="legend"><small>{t('landing.prob.c2.mock')}</small>
                <span><i className="d b" />{t('landing.prob.c2.reg')}</span><b>650€</b>
                <span><i className="d" />{t('landing.prob.c2.one')}</span><b className="dim">350€</b></span>
            </div>
          </div>
          <div className="plabel"><i className="n">2</i>{t('landing.prob.c2.label')}</div>
          <h3>{t('landing.prob.c2.title')}</h3><p>{t('landing.prob.c2.body')}</p>
        </article>
        <article className="pcard" data-reveal>
          <div className="pvis flowv">
            <div className="fl"><span className="fn"><Icon name="person" size={22} /></span><small>{t('landing.prob.c3.guest')}</small></div>
            <i className="fdot" />
            <div className="fl"><span className="fn sq"><LogoMark size={26} /></span><small>{t('common.appName').toLowerCase()}</small></div>
            <i className="fdot" />
            <div className="fl"><span className="fn blue"><Icon name="person" size={22} fill /></span><small>{t('landing.prob.c3.reg')}</small></div>
            <Link href="/signup" className="btn btn-lg wide">{t('landing.cta.trial')} <Icon name="arrow_forward" size={20} /></Link>
          </div>
          <div className="plabel"><i className="n b">3</i>{t('landing.prob.c3.label')}</div>
          <h3>{t('landing.prob.c3.title')}</h3><p>{t('landing.prob.c3.body')}</p>
        </article>
      </div>
      <p className="fine">{t('landing.prob.note')}</p>
    </section>
  );
}
