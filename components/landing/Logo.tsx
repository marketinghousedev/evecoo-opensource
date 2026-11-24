import Link from 'next/link';

export function LogoMark({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="lm" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2F6BFF" />
          <stop offset="1" stopColor="#0338C9" />
        </linearGradient>
      </defs>
      <path d="M3 17c3-8 11-12 26-12-1 10-6 16-15 17-5 .5-9-1.5-11-5Z" fill="url(#lm)" />
      <path d="M3 24c5-4 11-6 18-6-3 5-8 8-14 8-2 0-3.5-.8-4-2Z" fill="#0B1F44" opacity=".9" />
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
