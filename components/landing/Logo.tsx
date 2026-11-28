import Link from 'next/link';

export function LogoMark({ size = 28 }: { size?: number }) {
  // Biome mark: public/illustrations/brands/biome-mark.svg (keep in sync).
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="logo-mark">
      <rect width="64" height="64" rx="18" fill="#6D3BF5" />
      <g transform="translate(2 0)">
        <rect x="15" y="15" width="12" height="37" rx="4.5" fill="#FFFFFF" />
        <circle cx="32" cy="25" r="10" fill="#FFFFFF" />
        <circle cx="33" cy="40" r="12" fill="#FFFFFF" />
        <circle cx="33" cy="25" r="4.4" fill="#6D3BF5" />
        <circle cx="34" cy="40" r="5.4" fill="#6D3BF5" />
        <circle cx="46" cy="14" r="3.6" fill="#CDBDFB" />
      </g>
    </svg>
  );
}

export function Wordmark({ name, href = '/', light = false }: { name: string; href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`wordmark${light ? ' wordmark-light' : ''}`}>
      <LogoMark />
      <span>{name}</span>
    </Link>
  );
}
