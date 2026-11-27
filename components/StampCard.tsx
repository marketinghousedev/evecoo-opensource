import type { CSSProperties } from 'react';
import s from './StampCard.module.css';
import { StampGrid } from './illustration/StampGrid';
import type { StampName } from './illustration/stamps';

function inkFor(hex: string): string {
  const m = /^#([0-9a-fA-F]{6})$/.exec(hex);
  if (!m) return '#FFFFFF';
  const n = parseInt(m[1], 16);
  const lin = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const l = 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
  return l > 0.4 ? '#1C1B19' : '#FFFFFF';
}

export default function StampCard(p: {
  businessName: string;
  cardName: string;
  reward: string;
  stampsRequired: number;
  stamps: number;
  color: string;
  rewardLabel: string;
  progressLabel: string;
  qrSvg?: string;
  qrHint?: string;
  qrAlt?: string;
  /** Stamp icon from the library; the card setting that picks it comes later. */
  stamp?: StampName;
}) {
  const ink = inkFor(p.color);
  const filled = Math.max(0, Math.min(p.stamps, p.stampsRequired));
  const style = { '--card-color': p.color, '--ink': ink } as CSSProperties;
  return (
    <div className={s.pass} style={style}>
      <div className={s.head}>
        <div className={s.brand}>
          <span className={s.logo} aria-hidden="true">{(p.businessName.trim()[0] ?? '·').toUpperCase()}</span>
          <span className={s.biz}>{p.businessName}</span>
        </div>
        <div className={s.counter}>
          <div className={s.counterValue}>{filled}/{p.stampsRequired}</div>
        </div>
      </div>
      <div className={s.title}>{p.cardName}</div>
      <div className={s.strip}>
        <StampGrid
          name={p.stamp ?? 'star'}
          n={p.stampsRequired}
          filled={filled}
          size={44}
          tone="mono"
          columns={5}
          className={s.stamps}
          style={{ color: 'var(--ink)', '--stamp-bg': 'var(--card-color)' } as CSSProperties}
        />
      </div>
      <div className={s.meta}>
        <span>{p.rewardLabel}</span>
        <span>{p.progressLabel}</span>
      </div>
      {p.qrSvg && (
        <div className={s.qr}>
          <div className={s.code} role="img" aria-label={p.qrAlt} dangerouslySetInnerHTML={{ __html: p.qrSvg }} />
          {p.qrHint && <p>{p.qrHint}</p>}
        </div>
      )}
    </div>
  );
}
