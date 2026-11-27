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
