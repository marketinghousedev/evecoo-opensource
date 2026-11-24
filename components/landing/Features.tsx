import { getServerI18n } from '@/lib/i18n-server';
import { Icon } from './Icon';
import { LogoMark } from './Logo';

export function SectionHead({ eyebrow, t1, t2, sub, id, br }: { eyebrow: string; t1: string; t2: string; sub?: string; id?: string; br?: boolean }) {
  return (
    <div className="sec-head" data-reveal>
      <span className="eyebrow">{eyebrow}</span>
      <h2 id={id}>{t1}{br ? <br /> : ' '}<span className="blue">{t2}</span></h2>
      {sub && <p>{sub}</p>}
    </div>
  );
}

export async function Logos() {
  const { t } = await getServerI18n();
  const items = Array.from({ length: 10 }, (_, i) => i + 1);
  return (
    <section className="logos">
      <p>{t('landing.logos.title')}</p>
      <div className="logo-row">
        {items.map((i) => <span key={i} className={`lg lg${i % 4}`}>{t(`landing.logos.l${i}`)}</span>)}
      </div>
    </section>
  );
}

export function StampGrid({ n = 8, filled = 6, size = 26, color = '#fff' }: { n?: number; filled?: number; size?: number; color?: string }) {
  return (
    <span className="stamp-grid" style={{ gridTemplateColumns: `repeat(4, ${size}px)` }}>
      {Array.from({ length: n }, (_, i) => (
        <i key={i} style={{ width: size, height: size, background: i < filled ? color : 'transparent', borderColor: color, opacity: i < filled ? 1 : .45 }} />
      ))}
    </span>
  );
}

export function QrMock({ size = 80, dark = '#0B1F44' }: { size?: number; dark?: string }) {
  const cells: number[] = [];
  let s = 7;
  for (let i = 0; i < 169; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; cells.push(s % 100 < 48 ? 1 : 0); }
  const finder = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x} y={y} width="35" height="35" fill={dark} />
      <rect x={x + 5} y={y + 5} width="25" height="25" fill="#fff" />
      <rect x={x + 10} y={y + 10} width="15" height="15" fill={dark} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" aria-hidden="true" style={{ background: '#fff' }}>
      {cells.map((c, i) => {
        const x = (i % 13) * 10, y = Math.floor(i / 13) * 10;
        const inFinder = (x < 40 && y < 40) || (x > 90 && y < 40) || (x < 40 && y > 90);
        return c && !inFinder ? <rect key={i} x={x} y={y} width="10" height="10" fill={dark} /> : null;
      })}
      {finder(0, 0)}{finder(95, 0)}{finder(0, 95)}
    </svg>
  );
}

export async function Features() {
  const { t } = await getServerI18n();
  const bars = [30, 55, 40, 70, 60, 100, 50];
  const hours = [['09-12', 62], ['12-14', 100], ['14-17', 48], ['17-21', 70]] as const;
  return (
    <section className="sec" id="features">
      <SectionHead eyebrow={t('landing.feat.eyebrow')} t1={t('landing.feat.title1')} t2={t('landing.feat.title2')} sub={t('landing.feat.sub')} />
      <div className="cards3">
        <article className="fcard" data-reveal>
          <h3>{t('landing.feat.c1.title')}</h3>
          <p>{t('landing.feat.c1.body')}</p>
          <div className="fvis">
            <div className="wcard">
              <div className="wcard-top"><b>{t('landing.feat.c1.shop')}</b><span>{t('landing.feat.c1.owner')}</span></div>
              <div className="wcard-body"><StampGrid n={8} filled={5} size={30} color="#F3D9B8" /></div>
              <div className="wcard-foot"><span>{t('landing.feat.c1.reward')}</span></div>
              <div className="wcard-qr"><QrMock size={64} /></div>
            </div>
            <div className="pill-tool"><Icon name="chevron_left" size={16} /><LogoMark size={16} /><span>{t('landing.feat.c1.how')}</span><Icon name="chevron_right" size={16} /></div>
            <div className="dots">{Array.from({ length: 12 }, (_, i) => <i key={i} className={i === 6 ? 'on' : ''} />)}</div>
          </div>
        </article>

        <article className="fcard" data-reveal>
          <h3>{t('landing.feat.c2.title')}</h3>
          <p>{t('landing.feat.c2.body')}</p>
          <div className="fvis phone-vis">
            <div className="phone sm">
              <div className="phone-screen lock">
                <span className="island" />
                <Icon name="lock" size={14} fill className="lk" />
                <b className="clock">9:41</b>
                <span className="date">{t('landing.feat.c2.date')}</span>
                <div className="notifs">
                  <div className="notif"><span className="app" style={{ background: '#FFC21A' }} /><div><b>{t('landing.feat.c2.n1t')}<em>{t('landing.feat.c2.n1w')}</em></b><span>{t('landing.feat.c2.n1a')}</span><small>{t('landing.feat.c2.n1b')}</small></div></div>
                  <div className="notif"><span className="app" style={{ background: '#E8503A' }} /><div><b>{t('landing.feat.c2.n2t')}<em>{t('landing.feat.c2.n2w')}</em></b><span>{t('landing.feat.c2.n2a')}</span><small>{t('landing.feat.c2.n2b')}</small></div></div>
                </div>
              </div>
            </div>
          </div>
        </article>

        <article className="fcard" data-reveal>
          <h3>{t('landing.feat.c3.title')}</h3>
          <p>{t('landing.feat.c3.body')}</p>
          <div className="fvis dash-vis">
            <div className="mini-top">
              <div className="mt ring">
                <svg width="48" height="48" viewBox="0 0 48 48"><circle cx="24" cy="24" r="19" fill="none" stroke="#E4E9F5" strokeWidth="6" /><circle cx="24" cy="24" r="19" fill="none" stroke="#044DF2" strokeWidth="6" strokeDasharray="78 120" strokeLinecap="round" transform="rotate(-90 24 24)" /></svg>
                <span><b>{t('landing.feat.c3.ret')}</b><small>{t('landing.feat.c3.retSub')}</small></span>
              </div>
              <div className="mt"><small>{t('landing.feat.c3.cust')}</small><b className="big">250</b><span className="tag">{t('landing.feat.c3.week')}</span></div>
            </div>
            <div className="mini-bot">
              <div className="mt">
                <b className="sm">{t('landing.feat.c3.byTime')}</b>
                <span className="tag grey">{t('landing.feat.c3.peak')}</span>
                {hours.map(([l, v]) => (
                  <div key={l} className="hbar"><small>{l}</small><i><u style={{ width: `${v}%`, background: v === 100 ? '#0B1F44' : '#044DF2' }} /></i></div>
                ))}
              </div>
              <div className="mt">
                <b className="sm">{t('landing.feat.c3.byDay')}</b>
                <small>{t('landing.feat.c3.best')}</small>
                <div className="vbars">{bars.map((v, i) => <i key={i} style={{ height: `${v}%`, background: v === 100 ? '#0B1F44' : '#C4D0EC' }} />)}</div>
              </div>
            </div>
          </div>
        </article>
      </div>
    </section>
  );
}
