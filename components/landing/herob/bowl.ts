/* Pure maths for hero variant B (docs/HERO-BOWL-SPEC.md). Numbers are fitted to a reference motion: do not tweak. */

export const KEY_Q = [0, 0.03, 0.08, 0.18, 0.4, 0.66, 0.87, 1.15, 1.43, 1.8];
export const KEY_TIP = [0.3, 0.45, 0.65, 0.8, 0.95, 1.05, 1.05, 1.1, 1.3, 2.4];
export const KEY_HALF = [0.34, 0.38, 0.38, 0.38, 0.38, 0.46, 0.66, 0.9, 1.6, 3.0];
export const KEY_SOFT = [0.22, 0.26, 0.22, 0.22, 0.19, 0.16, 0.13, 0.1, 0.1, 0.1];
export const RND = 0.25;
export const GW = 96;
export const GH = 60;
export const INTRO_START: Bowl = { tip: -0.3, half: 0.3, soft: 0.1 };

export type Bowl = { tip: number; half: number; soft: number };

export const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
export const smooth = (p: number) => { const c = clamp(p); return c * c * (3 - 2 * c); };

function interp(keys: number[], q: number) {
  if (q <= KEY_Q[0]) return keys[0];
  const n = KEY_Q.length;
  if (q >= KEY_Q[n - 1]) return keys[n - 1];
  let i = 1;
  while (KEY_Q[i] < q) i++;
  const f = (q - KEY_Q[i - 1]) / (KEY_Q[i] - KEY_Q[i - 1]);
  return keys[i - 1] + (keys[i] - keys[i - 1]) * f;
}
export function bowlTarget(q: number): Bowl {
  return { tip: interp(KEY_TIP, q), half: interp(KEY_HALF, q), soft: interp(KEY_SOFT, q) };
}

export type Rgb = [number, number, number];
export function hex(h: string): Rgb {
  const v = h.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
const mix = (a: Rgb, b: Rgb, t: number): Rgb => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

export type BowlColors = { white: Rgb; lilac: Rgb; cyan: Rgb };
export const DEFAULT_COLORS: BowlColors = { white: [255, 255, 255], lilac: hex('#E4DAFF'), cyan: hex('#BFA8FA') };

export function bowlColor(g: number, c: BowlColors): Rgb {
  return g < 0.38 ? mix(c.white, c.lilac, smooth(g / 0.38)) : mix(c.lilac, c.cyan, smooth((g - 0.38) / 0.62));
}

const NPTS = 48;
/** Edge polyline: yy from -0.3 to tip, CX = half*aspect*(1 - yy/tip)^0.72. */
export function edge(tip: number, half: number, aspect: number, cx = new Float32Array(NPTS), cy = new Float32Array(NPTS)) {
  const t = Math.max(tip, 0.001);
  for (let k = 0; k < NPTS; k++) {
    const yy = -0.3 + ((t + 0.3) * k) / (NPTS - 1);
    cx[k] = half * aspect * Math.pow(Math.max(0, 1 - yy / t), 0.72);
    cy[k] = yy;
  }
  return { cx, cy };
}

/** Signed distance (negative inside) to the nearest polyline segment, minus the bottom rounding. */
export function signedDistance(px: number, py: number, tip: number, half: number, aspect: number, cx: Float32Array, cy: Float32Array) {
  let d2 = Infinity;
  for (let k = 0; k < NPTS - 1; k++) {
    const ax = cx[k], ay = cy[k];
    const bx = cx[k + 1] - ax, by = cy[k + 1] - ay;
    const l2 = bx * bx + by * by;
    let t = l2 > 0 ? ((px - ax) * bx + (py - ay) * by) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const dx = px - ax - bx * t, dy = py - ay - by * t;
    const d = dx * dx + dy * dy;
    if (d < d2) d2 = d;
  }
  const inside = py < tip && px < half * aspect * Math.pow(Math.max(0, 1 - py / tip), 0.72);
  const sd = Math.sqrt(d2);
  return (inside ? -sd : sd) - RND;
}

export function fillG(sd: number, soft: number) {
  return 1 - smooth((sd + soft) / (2 * soft));
}

/** Paints the bowl into 96x60 RGBA data. Returns true when every pixel is solid cyan. */
export function paintBowl(data: Uint8ClampedArray, b: Bowl, aspect: number, drift: { t: number } | null, colors: BowlColors = DEFAULT_COLORS) {
  const tip = b.tip + (drift ? Math.sin(drift.t * 0.00033 + 1.3) * 0.02 : 0);
  const half = b.half + (drift ? Math.sin(drift.t * 0.0005) * 0.015 : 0);
  const { cx, cy } = edge(tip, half, aspect);
  let solid = true;
  let o = 0;
  for (let j = 0; j < GH; j++) {
    const py = (j + 0.5) / GH;
    for (let i = 0; i < GW; i++) {
      const px = Math.abs((i + 0.5) / GW - 0.5) * aspect;
      const g = fillG(signedDistance(px, py, tip, half, aspect, cx, cy), b.soft);
      if (g < 0.9995) solid = false;
      const c = bowlColor(g, colors);
      data[o++] = c[0]; data[o++] = c[1]; data[o++] = c[2]; data[o++] = 255;
    }
  }
  return solid;
}

/* ---- letter reveal ---- */
export type Ch = { el: HTMLElement; hl: boolean; k: number };
export type RevealColors = { final: Rgb; hl: Rgb; accent: Rgb; ghost: Rgb };

export function collectChars(root: HTMLElement): Ch[] {
  return Array.from(root.querySelectorAll<HTMLElement>('.ch')).map((el) => ({ el, hl: el.classList.contains('hl'), k: -1 }));
}
const rgb = (c: Rgb) => `rgb(${Math.round(c[0])},${Math.round(c[1])},${Math.round(c[2])})`;

/** t = clamp((p(1+spread) - i/n)/spread); see the state table in the spec. */
export function paintChars(chars: Ch[], p: number, spread: number, c: RevealColors) {
  const n = chars.length;
  for (let i = 0; i < n; i++) {
    const ch = chars[i];
    const t = clamp((p * (1 + spread) - i / n) / spread);
    const key = Math.round(t * 400);
    if (key === ch.k) continue;
    ch.k = key;
    const fin = ch.hl ? c.hl : c.final;
    let op: number, col: Rgb, blur: number;
    if (t < 0.35) { const u = t / 0.35; op = u; col = c.ghost; blur = 8 - 6.5 * u; }
    else if (t < 0.7) { const u = (t - 0.35) / 0.35; op = 1; col = mix(c.ghost, c.accent, u); blur = 1.5 * (1 - u); }
    else { const u = (t - 0.7) / 0.3; op = 1; col = mix(c.accent, fin, u); blur = 0; }
    const s = ch.el.style;
    s.opacity = String(Math.round(op * 1000) / 1000);
    s.color = rgb(col);
    s.filter = blur > 0.01 ? `blur(${blur.toFixed(2)}px)` : 'none';
  }
}
