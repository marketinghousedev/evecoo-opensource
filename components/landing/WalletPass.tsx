'use client';

import type { CSSProperties } from 'react';
import { useT } from '@/components/I18nProvider';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { StampGrid } from '@/components/illustration/StampGrid';
import { QrMock } from './features/shared';
import type { PassDef } from './passes';
import './walletpass.css';

export type WalletPassProps = {
  pass: PassDef;
  /** Stamps collected; defaults to the demo state in passes.ts. */
  filled?: number;
  /** Stamps needed; defaults to pass.stampsRequired. */
  required?: number;
  /** Overrides pass.holder. */
  holder?: string;
  /** Overrides the reward line (live designer). */
  reward?: string;
  /** Hides the stamp grid (small scanner preview). */
  compact?: boolean;
  className?: string;
};

/**
 * The one wallet pass used everywhere on the landing page (feature carousel, bento stack, how-it-works
 * phone). It scales with its container width: every length is in cqw, so it looks identical at any size.
 * Layout: header (mark, name, holder), strip art, stamp grid, 3 label/value fields, QR.
 */
export function WalletPass({ pass, filled, required, holder, reward, compact = false, className }: WalletPassProps) {
  const { t } = useT();
  const n = required ?? pass.stampsRequired;
  const k = Math.min(filled ?? pass.current, n);
  const cols = Math.ceil(n / 2);
  const size = cols >= 5 ? 14 : 15;
  const vars = { '--wp-bg': pass.bg, '--wp-fg': pass.fg, '--wp-label': pass.label, '--stamp-bg': pass.bg } as CSSProperties;
  const grid = { '--stamp-size': `${size}cqw`, gridTemplateColumns: `repeat(${cols}, ${size}cqw)`, gap: '1.6cqw' } as CSSProperties;
  return (
    <div className={['wp-box', className].filter(Boolean).join(' ')}>
      <div className={`wp${compact ? ' is-compact' : ''}`} style={vars}>
        <div className="wp-head">
          <IlloSvg data={pass.mark} className="wp-mark" />
          <b>{pass.name}</b>
          <span className="wp-holder"><small>{t('landing.passes.lblName')}</small>{holder ?? pass.holder}</span>
        </div>
        <div className="wp-strip"><IlloSvg data={pass.strip} /></div>
        {!compact && <StampGrid className="wp-stamps" name={pass.stamp} n={n} filled={k} tone="mono" style={grid} />}
        <div className="wp-fields">
          <span><small>{t('landing.passes.lblReward')}</small>{reward ?? t(`landing.passes.${pass.slug}.reward`)}</span>
          <span><small>{t('landing.passes.lblBy')}</small>{t('common.appName')}</span>
          <span><small>{t('landing.passes.lblProg')}</small>{t('landing.passes.progress', { a: k, b: n })}</span>
        </div>
        <div className="wp-qr"><QrMock size="100%" /></div>
      </div>
    </div>
  );
}
