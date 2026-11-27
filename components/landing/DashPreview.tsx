'use client';

import { useT } from '@/components/I18nProvider';
import { LogoMark } from './Logo';
import { SectionHead } from './Features';
import './p8.css';

export function DashPreview() {
  const { t } = useT();
  const pts = [20, 26, 34, 28, 40, 58, 46, 30, 36, 52, 70, 50, 38, 44, 60, 78, 55, 42, 48, 66, 84, 60, 50, 56, 72, 88, 96, 70, 62, 74];
  const W = 620, H = 220;
  const xy = pts.map((v, i) => [i * (W / (pts.length - 1)), H - (v / 100) * (H - 20) - 10] as const);
  let d = `M${xy[0][0]},${xy[0][1]}`;
  for (let i = 1; i < xy.length; i++) {
    const [x0, y0] = xy[i - 1], [x1, y1] = xy[i], cx = (x0 + x1) / 2;
    d += ` C${cx},${y0} ${cx},${y1} ${x1},${y1}`;
  }
  const last = xy[xy.length - 1];
  const hours = [12, 20, 26, 38, 55, 100, 52, 36, 30, 38, 48, 34, 22];
  const stats: [string, string, string][] = [
    [t('landing.dash.s1'), '248', t('landing.dash.s1d')],
    [t('landing.dash.s2'), t('landing.dash.s2v'), t('landing.dash.s2d')],
    [t('landing.dash.s3'), t('landing.dash.s3v'), t('landing.dash.s3d')],
    [t('landing.dash.s4'), '37', t('landing.dash.s4d')],
  ];
  return (
    <section className="sec" id="dashboard">
      <SectionHead eyebrow={t('landing.dash.eyebrow')} t1={t('landing.dash.title1')} t2={t('landing.dash.title2')} br sub={t('landing.dash.sub')} />
      <div className="dprev" data-reveal>
        <div className="dp-top">
          <span className="dp-id"><LogoMark size={28} /><span><b>{t('landing.dash.shop')}</b><small>{t('landing.dash.overview')}</small></span></span>
          <span className="seg"><i>{t('landing.dash.d7')}</i><i className="on">{t('landing.dash.d30')}</i></span>
        </div>
        <div className="dp-stats">
          {stats.map(([l, v, dd]) => (
            <div key={l} className="dp-tile"><small>{l}</small><b>{v}</b><span>{dd}</span></div>
          ))}
        </div>
        <div className="dp-main">
          <div className="dp-chart">
            <div className="dp-h"><span><b>{t('landing.dash.chart')}</b><small>{t('landing.dash.chartSub')}</small></span><span className="lg"><i />{t('landing.dash.legend')}</span></div>
            <svg viewBox={`0 0 ${W} ${H + 20}`} preserveAspectRatio="none" aria-hidden="true">
              <defs><linearGradient id="ag" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#044DF2" stopOpacity=".28" /><stop offset="1" stopColor="#044DF2" stopOpacity="0" /></linearGradient></defs>
              {[0, 1, 2, 3].map((i) => <line key={i} x1="0" x2={W} y1={10 + i * 70} y2={10 + i * 70} stroke="#E4E9F5" />)}
              <path d={`${d} L${W},${H} L0,${H}Z`} fill="url(#ag)" />
              <path d={d} fill="none" stroke="#044DF2" strokeWidth="2.5" vectorEffect="non-scaling-stroke" />
              <circle cx={last[0] - 4} cy={last[1]} r="5" fill="#044DF2" stroke="#fff" strokeWidth="2" />
            </svg>
            <div className="dp-x"><span>{t('landing.dash.w1')}</span><span>{t('landing.dash.w2')}</span><span>{t('landing.dash.w3')}</span><span>{t('landing.dash.w4')}</span></div>
          </div>
          <div className="dp-side">
            <div className="dp-peak">
              <div className="dp-h"><b>{t('landing.dash.peak')}</b><small>{t('landing.dash.peakDay')}</small></div>
              <strong>{t('landing.dash.peakVal')}</strong>
              <div className="hrs">{hours.map((v, i) => <i key={i} style={{ height: `${v}%`, background: v === 100 ? '#044DF2' : '#DCE5FA' }} />)}</div>
              <div className="dp-x"><span>{t('landing.dash.h1')}</span><span>{t('landing.dash.h2')}</span><span>{t('landing.dash.h3')}</span></div>
            </div>
            <div className="dp-peak">
              <b>{t('landing.dash.phone')}</b>
              <span className="split"><u style={{ width: '61%' }} /></span>
              <div className="dp-x"><span>{t('landing.dash.apple')}</span><span>{t('landing.dash.google')}</span></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
