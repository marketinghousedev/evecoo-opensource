/* Illustrated avatars for the hero flow (simple hand-drawn SVG, no photos). */

type Look = { bg: string; skin: string; hair: string; shirt: string; style: 'short' | 'bun' | 'long' | 'curly' | 'bald' | 'cap' };

export const LOOKS: Look[] = [
  { bg: '#FFE7C7', skin: '#F6C9A0', hair: '#E0A43A', shirt: '#C8352B', style: 'short' },
  { bg: '#DCE8FF', skin: '#E9B48A', hair: '#2B1B14', shirt: '#2463EB', style: 'long' },
  { bg: '#E3F6EA', skin: '#C98E64', hair: '#3A2418', shirt: '#F08A24', style: 'curly' },
  { bg: '#F3E6FF', skin: '#F2CFB0', hair: '#C9CBD3', shirt: '#7C5BD6', style: 'bald' },
  { bg: '#FFE3E3', skin: '#B97D55', hair: '#1D1D22', shirt: '#13A37A', style: 'bun' },
  { bg: '#E6F4FF', skin: '#F4D1B4', hair: '#8A4B22', shirt: '#0E2A66', style: 'cap' },
];

export function Avatar({ i }: { i: number }) {
  const l = LOOKS[i % LOOKS.length];
  return (
    <svg viewBox="0 0 48 48" width="100%" height="100%" aria-hidden="true">
      <circle cx="24" cy="24" r="24" fill={l.bg} />
      {l.style === 'long' && <path d="M12 26c-1-10 4-16 12-16s13 6 12 16l1 14H11Z" fill={l.hair} />}
      <path d="M8 48c1-9 7-13 16-13s15 4 16 13Z" fill={l.shirt} />
      <path d="M20 31h8v6c-1 2-7 2-8 0Z" fill={l.skin} />
      <ellipse cx="24" cy="23" rx="8.5" ry="9.5" fill={l.skin} />
      <ellipse cx="15.6" cy="24" rx="1.6" ry="2.2" fill={l.skin} />
      <ellipse cx="32.4" cy="24" rx="1.6" ry="2.2" fill={l.skin} />
      {l.style === 'short' && <path d="M15 21c-1-7 4-11 9-11 6 0 10 3 9 11-2-3-4-5-9-5-3 0-6 1-9 5Z" fill={l.hair} />}
      {l.style === 'long' && <path d="M15.5 22c0-6 3-10 8.5-10s8.5 4 8.5 10c-3-1-6-4-7-7-2 3-6 6-10 7Z" fill={l.hair} />}
      {l.style === 'curly' && <path d="M14.5 22c-2-3 0-7 2-8 0-3 4-5 6-3 2-2 6-1 7 1 3 0 5 4 3 6 2 2 1 4 0 5-1-3-4-5-8-5s-8 2-10 4Z" fill={l.hair} />}
      {l.style === 'bald' && <path d="M15.6 22c0-3 1-4 1.5-4.5M32.4 22c0-3-1-4-1.5-4.5" stroke={l.hair} strokeWidth="2.6" strokeLinecap="round" />}
      {l.style === 'bun' && <><circle cx="24" cy="10.5" r="4" fill={l.hair} /><path d="M15.5 22c-.5-6 3-9.5 8.5-9.5s9 3.5 8.5 9.5c-2-3-5-4.5-8.5-4.5s-6.5 1.5-8.5 4.5Z" fill={l.hair} /></>}
      {l.style === 'cap' && <><path d="M15 20c0-6 4-9 9-9s9 3 9 9Z" fill={l.shirt} /><path d="M24 19h12c0 1.6-1 2.4-2.5 2.4H24Z" fill={l.shirt} /></>}
      {l.style === 'bald' && <><circle cx="20.5" cy="23.5" r="2.6" fill="none" stroke="#555" strokeWidth=".9" /><circle cx="27.5" cy="23.5" r="2.6" fill="none" stroke="#555" strokeWidth=".9" /><path d="M23.1 23.5h1.8" stroke="#555" strokeWidth=".9" /></>}
      <circle cx="20.6" cy="23.6" r="1.1" fill="#2A1A12" />
      <circle cx="27.4" cy="23.6" r="1.1" fill="#2A1A12" />
      <path d="M20.5 27.6c2 1.8 5 1.8 7 0" stroke="#8A3B2A" strokeWidth="1.3" fill="none" strokeLinecap="round" />
      <ellipse cx="18.6" cy="26.8" rx="1.5" ry=".9" fill="#F08F7A" opacity=".35" />
      <ellipse cx="29.4" cy="26.8" rx="1.5" ry=".9" fill="#F08F7A" opacity=".35" />
    </svg>
  );
}

export function PersonGlyph() {
  return (
    <svg viewBox="0 0 24 24" width="44%" height="44%" aria-hidden="true">
      <circle cx="12" cy="8" r="4.2" fill="currentColor" />
      <path d="M3.5 21c.6-4.6 4-7 8.5-7s7.9 2.4 8.5 7Z" fill="currentColor" />
    </svg>
  );
}
