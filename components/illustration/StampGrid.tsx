'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import { IlloSvg } from './IlloSvg';
import { STAMPS, type StampName, type StampTone } from './stamps';

export type StampGridProps = {
  /** Industry icon from public/illustrations/stamps. */
  name: StampName;
  /** Number of slots. */
  n: number;
  /** Slots stamped so far (K). Increasing it pops the newly stamped slots. */
  filled: number;
  /** Slot size in px. */
  size?: number;
  /** 'color': full-colour disc + faded outline for empty. 'mono': currentColor, for dark passes. */
  tone?: StampTone;
  /** Fixed column count; default flows (flex-wrap). */
  columns?: number;
  className?: string;
  style?: CSSProperties;
  /** Accessible name, e.g. "3 of 8 stamps". Without it the grid is decorative. */
  label?: string;
};

/**
 * N stamp slots with K filled. Filled and empty slots share one silhouette, so they align
 * exactly. A newly stamped slot pops (260 ms scale/rotate, see .stamp-slot in globals.css);
 * prefers-reduced-motion switches the animation off. Filled slots also carry a check notch so
 * the state never relies on colour alone.
 */
export function StampGrid({ name, n, filled, size = 40, tone = 'color', columns, className, style, label }: StampGridProps) {
  const k = Math.max(0, Math.min(filled, n));
  const prev = useRef(k);
  const popFrom = k > prev.current ? prev.current : k; // slots in [popFrom, k) were just stamped
  useEffect(() => {
    prev.current = k;
  }, [k]);

  const set = STAMPS[name];
  const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true as const };
  const grid: CSSProperties = { '--stamp-size': `${size}px`, ...(columns ? { gridTemplateColumns: `repeat(${columns}, ${size}px)` } : null), ...style } as CSSProperties;
  return (
    <span className={['stamp-slots', tone === 'mono' ? 'is-mono' : '', className].filter(Boolean).join(' ')} style={grid} {...a11y}>
      {Array.from({ length: n }, (_, i) => {
        const on = i < k;
        const pop = on && i >= popFrom && popFrom < k;
        const data = on ? (tone === 'mono' ? set.mono : set.filled) : tone === 'mono' ? set.mono : set.empty;
        return (
          <span key={i} className={`stamp-slot${on ? ' is-filled' : ''}${pop ? ' is-pop' : ''}`}>
            <IlloSvg data={data} />
            {on && tone === 'mono' && (
              <svg className="stamp-notch-mono" viewBox="0 0 40 40" aria-hidden="true" focusable="false">
                <circle cx="31.5" cy="31.5" r="6" fill="currentColor" />
                <path d="M28.9 31.7L30.8 33.6L34.2 29.8" fill="none" stroke="var(--stamp-bg, #0B1F44)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </span>
        );
      })}
    </span>
  );
}
