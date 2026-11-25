/* Small inline-SVG illustrations used by the How-it-works phone story. All drawn by hand, no images. */

export function Qr({ size = 80, seed = 11, dark = '#0B1222' }: { size?: number; seed?: number; dark?: string }) {
  const n = 25;
  let s = seed;
  let d = '';
  const inFinder = (x: number, y: number) => (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      if (!inFinder(x, y) && s % 100 < 50) d += `M${x} ${y}h1v1h-1z`;
    }
  }
  const finder = (x: number, y: number) => `M${x} ${y}h7v7h-7zM${x + 1} ${y + 1}v5h5v-5zM${x + 2} ${y + 2}h3v3h-3z`;
  return (
    <svg width={size} height={size} viewBox={`-1 -1 ${n + 2} ${n + 2}`} aria-hidden="true" className="hw-qr" shapeRendering="crispEdges">
      <rect x="-1" y="-1" width={n + 2} height={n + 2} fill="#fff" />
      <path d={d} fill={dark} />
      <path d={finder(0, 0) + finder(n - 7, 0) + finder(0, n - 7)} fill={dark} fillRule="evenodd" />
    </svg>
  );
}

/** Illustrated kebab wrap used as a stamp. `ghost` renders the faded empty slot. */
export function KebabStamp({ size = 34, ghost = false }: { size?: number; ghost?: boolean }) {
  if (ghost) {
    return (
      <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
        <path d="M4 20c4-7 12-10 19-9 7 1 12 5 13 12 0 6-7 11-16 11-8 0-15-4-16-10Z" fill="#fff" opacity=".26" />
      </svg>
    );
  }
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <path d="M6 16c4-5 11-7 17-6 6 1 11 5 12 9l-2 2c-3-3-8-5-13-5-5 0-10 2-12 4Z" fill="#5DB33E" />
      <path d="M7 15c3-3 8-5 13-5M14 12c3-2 7-2 10-1M22 12c4 0 8 2 10 5" stroke="#3D8E25" strokeWidth="1.4" fill="none" strokeLinecap="round" />
      <path d="M7 18c5-4 12-5 18-3 4 1 8 3 9 6-5-2-11-3-16-2-4 1-8 2-11 3Z" fill="#7A2E10" />
      <path d="M10 18c4-2 9-3 13-2M15 19c4-1 9-1 13 1" stroke="#A9471C" strokeWidth="1.5" fill="none" strokeLinecap="round" />
      <circle cx="14" cy="16" r="1.7" fill="#E2402B" /><circle cx="24" cy="14.5" r="1.7" fill="#E2402B" /><circle cx="30" cy="17.5" r="1.5" fill="#E2402B" />
      <path d="M4 20c6-3 14-4 22-2 5 1 9 3 10 5 0 6-7 11-16 11-8 0-15-4-16-10 0-2 0-3 0-4Z" fill="#E9B46C" />
      <path d="M5 22c7-2 15-2 22 0 4 1 7 2 8 3" stroke="#C98A3F" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <path d="M10 28c3 2 8 3 13 2" stroke="#D29A52" strokeWidth="1.2" fill="none" strokeLinecap="round" />
    </svg>
  );
}

export function ShopLogo({ name, sub, size = 64 }: { name: string; sub: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true">
      <rect width="64" height="64" rx="15" fill="#fff" />
      <path d="M22 14c3 3 1 6 4 8 0-3 2-5 4-7 0 3 3 4 3 7 2-1 3-3 3-5 3 3 4 6 3 9H20c-1-4 0-8 2-12Z" fill="#F29A1E" />
      <path d="M25 18c1 2 0 4 2 5 1-2 2-3 3-4 0 2 2 3 2 5h-8c0-2 0-4 1-6Z" fill="#FFD23F" />
      <rect x="13" y="16" width="6" height="26" rx="3" fill="#B3121F" />
      <path d="M14 20h4M14 25h4M14 30h4M14 35h4" stroke="#7A0A13" strokeWidth="1.4" />
      <text x="40" y="38" textAnchor="middle" fontSize="10.5" fontWeight="800" fill="#111" fontFamily="inherit">{name}</text>
      <text x="40" y="46" textAnchor="middle" fontSize="5.5" fontWeight="600" fill="#555" fontFamily="inherit">{sub}</text>
    </svg>
  );
}

/** Food doodles pattern for the join page header. */
export function DoodleHeader() {
  return (
    <svg className="hw-doodles" width="100%" height="100%" aria-hidden="true">
      <defs>
        <pattern id="hw-doodle" width="64" height="56" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
          <g fill="none" stroke="#000" strokeOpacity=".28" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 18c0-6 6-9 11-9s11 3 11 9Z M5 22h24 M6 26c0 3 3 4 11 4s11-1 11-4" />
            <path d="M40 6l4 16h6l4-16 M42 12h10" />
            <path d="M44 34c4-2 10 0 10 5s-5 8-10 6-4-9 0-11Z M47 38l3 3" />
            <path d="M10 38v14 M8 38h4 M10 42c-3 0-3 4 0 4" />
            <circle cx="30" cy="46" r="3" />
          </g>
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#hw-doodle)" />
    </svg>
  );
}

export function StatusBar() {
  return (
    <div className="hw-status">
      <b>9:41</b>
      <span className="hw-status-r">
        <svg width="17" height="11" viewBox="0 0 17 11" aria-hidden="true"><rect x="0" y="7" width="3" height="4" rx="1" fill="currentColor" /><rect x="4.5" y="5" width="3" height="6" rx="1" fill="currentColor" /><rect x="9" y="2.5" width="3" height="8.5" rx="1" fill="currentColor" /><rect x="13.5" y="0" width="3" height="11" rx="1" fill="currentColor" /></svg>
        <svg width="24" height="11" viewBox="0 0 24 11" aria-hidden="true"><rect x=".5" y=".5" width="20" height="10" rx="3" fill="none" stroke="currentColor" opacity=".45" /><rect x="2" y="2" width="17" height="7" rx="1.8" fill="currentColor" /><path d="M22 4v3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity=".5" /></svg>
      </span>
    </div>
  );
}

export const Ico = {
  check: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  lock: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2.5" fill="currentColor" /><path d="M8 10V7a4 4 0 0 1 8 0v3" fill="none" stroke="currentColor" strokeWidth="2.4" /></svg>,
  chevL: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  chevU: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M5 15l7-7 7 7" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>,
  flashOff: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M13 2L5 13h6l-1 9 8-11h-6l1-9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><path d="M4 4l16 16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
  live: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeWidth="1.8" /><circle cx="12" cy="12" r="4" fill="currentColor" /></svg>,
  flip: (s = 14) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /><circle cx="12" cy="13" r="3" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>,
  link: (s = 10) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M10 14a4 4 0 0 0 6 0l3-3a4 4 0 0 0-6-6l-1 1M14 10a4 4 0 0 0-6 0l-3 3a4 4 0 0 0 6 6l1-1" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" /></svg>,
  cal: (s = 12) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" /></svg>,
  scan: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /><rect x="8" y="8" width="3" height="3" fill="currentColor" /><rect x="13" y="8" width="3" height="3" fill="currentColor" /><rect x="8" y="13" width="3" height="3" fill="currentColor" /></svg>,
  gift: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="9" width="16" height="11" rx="1.5" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9Zm0 0c2-4 6-4 6-1.5S14 9 12 9Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" /></svg>,
  pass: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" fill="#fff" /><rect x="2" y="7" width="20" height="2.5" fill="#F5A623" /><rect x="2" y="10" width="20" height="2.5" fill="#E8453C" /><rect x="2" y="13" width="20" height="2.5" fill="#34A853" /><rect x="2" y="16" width="20" height="2.5" fill="#4285F4" /></svg>,
};
