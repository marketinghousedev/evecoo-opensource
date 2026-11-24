'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/client';
import { weekdayShort } from '@/lib/i18n';
import type { Stats as StatsData } from '@/lib/types';
import { useT } from '@/components/I18nProvider';
import { errorText } from './errorText';
import s from './dashboard.module.css';

const H = 190;
const PAD = { l: 26, r: 8, t: 10, b: 22 };

function niceMax(m: number): number {
  if (m <= 4) return 4;
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  return Math.ceil(m / p) * p;
}

function BarChart({ values, labels, w = 300, every = 1 }: { values: number[]; labels: string[]; w?: number; every?: number }) {
  const max = niceMax(Math.max(1, ...values));
  const iw = w - PAD.l - PAD.r;
  const ih = H - PAD.t - PAD.b;
  const slot = iw / values.length;
  const bw = Math.min(28, slot * 0.62);
  const peak = values.indexOf(Math.max(...values));
  return (
    <svg className={s.chart} viewBox={`0 0 ${w} ${H}`} role="img" aria-label={labels.map((l, i) => `${l}: ${values[i]}`).join(', ')}>
      {[0, 0.5, 1].map((f) => {
        const y = PAD.t + ih * (1 - f);
        return (
          <g key={f}>
            <line className={s.grid} x1={PAD.l} x2={w - PAD.r} y1={y} y2={y} />
            <text className={s.axis} x={PAD.l - 6} y={y + 3} textAnchor="end">{Math.round(max * f)}</text>
          </g>
        );
      })}
      {values.map((v, i) => {
        const h = Math.max(3, (v / max) * ih);
        return (
          <g key={i}>
            <rect className={`${s.bar} ${i === peak && v > 0 ? s.barPeak : ''}`} x={PAD.l + slot * i + (slot - bw) / 2} y={PAD.t + ih - h} width={bw} height={h} rx="5">
              <title>{`${labels[i]}: ${v}`}</title>
            </rect>
            {i % every === 0 && <text className={s.axis} x={PAD.l + slot * i + slot / 2} y={H - 6} textAnchor="middle">{labels[i]}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function Stats() {
  const { t, locale } = useT();
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setError(null);
    api<StatsData>('/api/stats').then(setData, (e) => setError(errorText(t, e)));
  }, [t]);
  useEffect(load, [load]);

  return (
    <section className={s.section} id="overview">
      <h2 className={s.sectionTitle}>{t('dashboard.stats.title')}</h2>
      {error && (
        <p>
          <span className="error">{error}</span>{' '}
          <button className="btn btn-secondary" onClick={load}>{t('common.retry')}</button>
        </p>
      )}
      {!data && !error && <p className="muted">{t('common.loading')}</p>}
      {data && data.customers === 0 && <p className={s.empty}>{t('dashboard.stats.empty')}</p>}
      {data && (
        <>
          <div className={s.tiles}>
            <div className={s.tileCard}><div className={s.tileLabel}>{t('dashboard.stats.customers')}</div><div className={s.value}>{data.customers}</div></div>
            <div className={s.tileCard}><div className={s.tileLabel}>{t('dashboard.stats.returning')}</div><div className={s.value}>{data.returning}</div></div>
            <div className={s.tileCard}><div className={s.tileLabel}>{t('dashboard.stats.returnRate')}</div><div className={s.value}>{t('dashboard.stats.percent', { value: data.returningPercent })}</div></div>
          </div>
          <div className={s.charts}>
            <div className={s.chartCard}>
              <h3>{t('dashboard.stats.byHour')}</h3>
              <BarChart values={data.visitsByHour} labels={data.visitsByHour.map((_, i) => String(i))} w={420} every={3} />
            </div>
            <div className={s.chartCard}>
              <h3>{t('dashboard.stats.byWeekday')}</h3>
              <BarChart values={data.visitsByWeekday} labels={data.visitsByWeekday.map((_, i) => weekdayShort(locale, i))} />
            </div>
          </div>
        </>
      )}
    </section>
  );
}
