'use client';

import Link from 'next/link';
import { useLayoutEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useT } from '@/components/I18nProvider';
import { Icon } from '../Icon';
import { SectionHead } from '../Features';
import { QrPoster } from '../QrPoster';
import { WalletPass } from '../WalletPass';
import { BENTO_PASSES } from '../passes';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { iconsUiCheckCircle, iconsUiStamp, scenesCounterStand, scenesParcel } from '@/components/illustration/illo-data';
import '../p8.css';
import './serviceb.css';

const N = 4;
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

function Visual({ i, t }: { i: number; t: (k: string) => string }): ReactNode {
  if (i === 0) {
    return (
      <div className="tl-form">
        <span className="tl-field"><i /><i className="s" /></span>
        <span className="tl-field"><i className="s" /></span>
        <span className="tl-ok"><IlloSvg data={iconsUiCheckCircle} className="tl-okic" />{t('landing.svcb.formDone')}</span>
      </div>
    );
  }
  if (i === 1) return <div className="tl-pass"><WalletPass pass={BENTO_PASSES[0]} compact /></div>;
  if (i === 2) {
    return (
      <div className="stand-scene tl-stand">
        <IlloSvg data={scenesCounterStand} className="stand-art illo-lift" />
        <div className="stand-poster"><QrPoster /></div>
      </div>
    );
  }
  return (
    <div className="tl-first">
      <div className="tl-thumb"><QrPoster /></div>
      <span className="tl-chip"><IlloSvg data={iconsUiStamp} className="tl-chipic" />{t('landing.svcb.stamp')}</span>
    </div>
  );
}

export function ServiceB() {
  const { t } = useT();
  const root = useRef<HTMLDivElement>(null);
  const parcel = useRef<HTMLDivElement>(null);
  const dots = useRef<(HTMLElement | null)[]>([]);
  const [reached, setReached] = useState(N); // server / no-JS / reduced motion: everything shown
  const prog = useRef({ p: 1, pts: [] as { x: number; y: number }[], reached: N, vertical: false });

  const paint = () => {
    const el = root.current, pc = parcel.current, o = prog.current;
    if (!el || !pc || o.pts.length < N) return;
    const f = clamp01(o.p) * (N - 1);
    const a = Math.min(N - 2, Math.floor(f)), k = f - a;
    const x = o.pts[a].x + (o.pts[a + 1].x - o.pts[a].x) * k;
    const y = o.pts[a].y + (o.pts[a + 1].y - o.pts[a].y) * k;
    pc.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    el.style.setProperty('--fill', `${(o.vertical ? y - o.pts[0].y : x - o.pts[0].x).toFixed(1)}px`);
    const r = Math.min(N, Math.floor(f + 0.02) + 1);
    if (r !== o.reached) { o.reached = r; setReached(r); }
  };

  useLayoutEffect(() => {
    const el = root.current;
    if (!el) return;
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const measure = () => {
      const base = el.getBoundingClientRect();
      const o = prog.current;
      o.pts = dots.current.map((d) => {
        const r = d!.getBoundingClientRect();
        return { x: r.left - base.left + r.width / 2, y: r.top - base.top + r.height / 2 };
      });
      o.vertical = Math.abs(o.pts[N - 1].y - o.pts[0].y) > Math.abs(o.pts[N - 1].x - o.pts[0].x);
      el.style.setProperty('--x0', `${o.pts[0].x.toFixed(1)}px`);
      el.style.setProperty('--y0', `${o.pts[0].y.toFixed(1)}px`);
      el.style.setProperty('--len', `${(o.vertical ? o.pts[N - 1].y - o.pts[0].y : o.pts[N - 1].x - o.pts[0].x).toFixed(1)}px`);
    };
    const progress = () => {
      const r = el.getBoundingClientRect(), vh = window.innerHeight;
      const range = vh * 0.25 + r.height;
      prog.current.p = clamp01((vh * 0.85 - r.top) / range);
    };
    if (mq.matches) {
      measure(); prog.current.p = 1; paint();
      const ro = new ResizeObserver(() => { measure(); paint(); });
      ro.observe(el);
      return () => ro.disconnect();
    }
    let raf = 0, near = false;
    const tick = () => { raf = 0; progress(); paint(); };
    const onScroll = () => { if (near && !raf) raf = requestAnimationFrame(tick); };
    const ro = new ResizeObserver(() => { measure(); onScroll(); });
    ro.observe(el);
    measure(); progress(); paint();
    const io = new IntersectionObserver(([e]) => { near = e.isIntersecting; if (near) onScroll(); }, { rootMargin: '200px 0px' });
    io.observe(el);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);


  return (
    <section className="sec alt2" id="service">
      <SectionHead eyebrow={t('landing.svc.eyebrow')} t1={t('landing.svc.title1')} t2={t('landing.svc.title2')} br sub={t('landing.svc.sub')} />
      <div className="tl" ref={root} data-reached={reached}>
        <i className="tl-rail" aria-hidden="true" />
        <i className="tl-fill" aria-hidden="true" />
        <div className="tl-parcel" ref={parcel} aria-hidden="true"><IlloSvg data={scenesParcel} className="tl-parcel-art illo-lift" /></div>
        <ol className="tl-stops" aria-label={t('landing.svcb.title')}>
          {[0, 1, 2, 3].map((i) => (
            <li key={i} className={`tl-stop${i < reached ? ' on' : ''}`}>
              <span className="tl-dot" ref={(el) => { dots.current[i] = el; }} />
              <div className="tl-body">
                <small className="tl-day">{t(`landing.svcb.s${i + 1}.day`)}</small>
                <h3>{t(`landing.svcb.s${i + 1}.title`)}</h3>
                <div className="tl-card"><Visual i={i} t={t} /></div>
                <p>{t(`landing.svcb.s${i + 1}.body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
      <div className="tl-cta"><Link href="/signup" className="btn btn-lg">{t('landing.cta.signupNow')} <Icon name="arrow_forward" size={20} /></Link></div>
    </section>
  );
}
