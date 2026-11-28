/* Small inline-SVG illustrations used by the How-it-works phone story. All drawn by hand, no images. */
import { IlloSvg } from '@/components/illustration/IlloSvg';
import QRCode from 'qrcode';
import { stampsStampKebabMono } from '@/components/illustration/illo-data';

/** A real, scannable QR code (same `qrcode` encoder the card page uses), drawn as one crisp path. */
export function Qr({ size = 80, text, dark = '#0B1222' }: { size?: number | string; text: string; dark?: string }) {
  const { modules } = QRCode.create(text, { errorCorrectionLevel: 'M' });
  const n = modules.size;
  let d = '';
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) if (modules.get(x, y)) d += `M${x} ${y}h1v1h-1z`;
  return (
    <svg width={size} height={size} viewBox={`-2 -2 ${n + 4} ${n + 4}`} aria-hidden="true" className="hw-qr" shapeRendering="crispEdges">
      <rect x="-2" y="-2" width={n + 4} height={n + 4} fill="#fff" />
      <path d={d} fill={dark} />
    </svg>
  );
}

/** Kebab stamp from the stamp library (mono, takes the pass ink). `ghost` renders the faded empty slot. */
export function KebabStamp({ size = 34, ghost = false }: { size?: number; ghost?: boolean }) {
  return (
    <span style={{ position: 'relative', display: 'block', width: size, height: size, color: '#fff' }}>
      <IlloSvg data={stampsStampKebabMono} style={{ width: size, height: size, opacity: ghost ? 0.28 : 1 }} />
      {!ghost && (
        <svg viewBox="0 0 40 40" width={size} height={size} aria-hidden="true" style={{ position: 'absolute', inset: 0 }}>
          <circle cx="31.5" cy="31.5" r="6" fill="#fff" />
          <path d="M28.9 31.7L30.8 33.6L34.2 29.8" fill="none" stroke="#A80F1E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
    </span>
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
  // generic pass glyph (monochrome): not the Apple Wallet app icon; the official badge goes in brands/badge-*
  pass: (s = 16) => <svg width={s} height={s} viewBox="0 0 24 24" aria-hidden="true"><rect x="2" y="4" width="20" height="16" rx="3" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M2 9.5h20M6 14h7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>,
};
