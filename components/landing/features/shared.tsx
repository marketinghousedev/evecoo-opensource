export function QrMock({ size = 80, dark = '#0B1F44' }: { size?: number; dark?: string }) {
  const cells: number[] = [];
  let s = 7;
  for (let i = 0; i < 169; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; cells.push(s % 100 < 48 ? 1 : 0); }
  const finder = (x: number, y: number) => (
    <g key={`${x}${y}`}>
      <rect x={x} y={y} width="35" height="35" fill={dark} />
      <rect x={x + 5} y={y + 5} width="25" height="25" fill="#fff" />
      <rect x={x + 10} y={y + 10} width="15" height="15" fill={dark} />
    </g>
  );
  return (
    <svg width={size} height={size} viewBox="0 0 130 130" aria-hidden="true" style={{ background: '#fff' }}>
      {cells.map((c, i) => {
        const x = (i % 13) * 10, y = Math.floor(i / 13) * 10;
        const inFinder = (x < 40 && y < 40) || (x > 90 && y < 40) || (x < 40 && y > 90);
        return c && !inFinder ? <rect key={i} x={x} y={y} width="10" height="10" fill={dark} /> : null;
      })}
      {finder(0, 0)}{finder(95, 0)}{finder(0, 95)}
    </svg>
  );
}

/** Simple illustrated avatar (flat SVG, no photos). */
export function Avatar({ skin, hair, shirt, size = 34 }: { skin: string; hair: string; shirt: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" style={{ borderRadius: '50%', flex: 'none', background: '#EEF1F8' }}>
      <path d="M6 40c1-9 7-13 14-13s13 4 14 13z" fill={shirt} />
      <path d="M12 17c0-7 4-10 8-10s8 3 8 10v1H12z" fill={hair} />
      <circle cx="20" cy="19" r="8" fill={skin} />
      <path d="M12 17c3-1 6-4 8-6 3 3 6 5 8 6-1-6-4-9-8-9s-7 3-8 9z" fill={hair} />
      <circle cx="17" cy="20" r="1" fill="#2B2321" /><circle cx="23" cy="20" r="1" fill="#2B2321" />
      <path d="M17.5 23.4c1.5 1.2 3.5 1.2 5 0" stroke="#2B2321" strokeWidth="1" fill="none" strokeLinecap="round" />
    </svg>
  );
}
