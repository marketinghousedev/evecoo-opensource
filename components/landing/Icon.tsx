import type { ReactNode } from 'react';

/**
 * The few UI glyphs the landing page needs, drawn inline (24 grid, round caps). Replaces the
 * Material Symbols web font: no 300 KB font download and no render-blocking third-party stylesheet.
 * Sized in em, so `size` or an inherited font-size sets the glyph size.
 */
const GLYPHS = {
  arrow_forward: <path d="M5 12h14M13 6l6 6-6 6" />,
  check_circle: <><circle cx="12" cy="12" r="9" /><path d="M8 12.4l2.8 2.8L16.2 9.6" /></>,
  eco: <><path d="M6 18.5C5 11 9.5 5.2 19.5 4.5c.7 9.6-4.6 14.6-12 14.3Z" fill="currentColor" stroke="none" /><path d="M4.5 20.5c3-4.3 6.3-7.6 10-10.2" /></>,
  expand_more: <path d="M6.5 9.5L12 15l5.5-5.5" />,
  lock: <><rect x="5" y="10.5" width="14" height="10" rx="2.2" /><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" /></>,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  star: <path d="M12 3.6l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 16.5l-5.1 2.8 1.1-5.7-4.3-4 5.8-.7Z" fill="currentColor" strokeWidth="1.2" />,
  trending_down: <path d="M3 7.5l6 6 4-4 7.5 7.5M21 11.5V17h-5.5" />,
} satisfies Record<string, ReactNode>;

export type IconName = keyof typeof GLYPHS;

export function Icon({ name, size, className = '' }: { name: IconName; size?: number; fill?: boolean; className?: string }) {
  return (
    <span className={`lp-ico ${className}`.trim()} aria-hidden="true" style={size ? { fontSize: size } : undefined}>
      <svg width="1em" height="1em" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" focusable="false">
        {GLYPHS[name]}
      </svg>
    </span>
  );
}
