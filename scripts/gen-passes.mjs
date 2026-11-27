// Generates the 12 wallet pass strips (375x123) and round brand marks (64x64) from code.
// Output: public/illustrations/passes/strip-<slug>.svg, public/illustrations/brands/mark-<slug>.svg
// Run `npm run passes:gen` (also runs svg:optimize). Palette hexes only; no text, no filters.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const C = {
  navy: '#0B1F44', white: '#FFFFFF', brand: '#044DF2', brandSoft: '#E8EFFE', brandMuted: '#B9CCFB',
  esp: '#8A4B2A', espS: '#F3E6DC', honey: '#B86E00', honeyS: '#FCEFD6', tom: '#D4421C', tomS: '#FCE4DC',
  sal: '#E5674A', salS: '#FDE8E2', berry: '#C2366F', berryS: '#FAE3EC', herb: '#5E7A1F', herbS: '#EAF0DA',
  ok: '#12B76A', okS: '#12945A', okSoft: '#E3F7EE', loss: '#D6244B',
};
const f = (n) => +n.toFixed(1);
const circ = (x, y, r, fill, o = 1, extra = '') => `<circle cx="${f(x)}" cy="${f(y)}" r="${f(r)}" fill="${fill}"${o < 1 ? ` fill-opacity="${o}"` : ''}${extra}/>`;
const ell = (x, y, rx, ry, fill, rot = 0, o = 1) => `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}"${o < 1 ? ` fill-opacity="${o}"` : ''}${rot ? ` transform="rotate(${rot} ${f(x)} ${f(y)})"` : ''}/>`;
const rect = (x, y, w, h, r, fill, o = 1) => `<rect x="${f(x)}" y="${f(y)}" width="${f(w)}" height="${f(h)}" rx="${r}" fill="${fill}"${o < 1 ? ` fill-opacity="${o}"` : ''}/>`;
const path_ = (d, fill, o = 1) => `<path d="${d}" fill="${fill}"${o < 1 ? ` fill-opacity="${o}"` : ''}/>`;
const line = (d, stroke, w = 2, o = 1) => `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"${o < 1 ? ` stroke-opacity="${o}"` : ''}/>`;
const g = (t, ...c) => `<g transform="${t}">${c.join('')}</g>`;
const base = (fill, o) => rect(0, 0, 375, 123, 0, fill, o);
const outline = C.navy;

// ---- strips -------------------------------------------------------------------------------
const strips = {
  kebab: () => {
    const skewer = (x, y, rot, cols) =>
      g(`translate(${x} ${y}) rotate(${rot})`, line('M-6 0H170', C.white, 3, 0.85), cols.map((c, i) => rect(10 + i * 32, -15, 26, 30, 10, c) + line(`M${14 + i * 32} -6q9 -4 18 0`, C.white, 2, 0.55)).join(''), circ(176, 0, 4, C.white, 0.9));
    const flames = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => path_(`M${i * 46 - 10} 123q10 -30 23 -44q2 22 12 30q8 -10 6 -22q22 16 18 36z`, i % 2 ? C.honey : C.tom, 0.55)).join('');
    return [base(C.navy, 0.2), flames, skewer(20, 52, -12, [C.tom, C.honey, C.herb, C.tom, C.honey]), skewer(190, 78, -12, [C.honey, C.tom, C.herb, C.honey, C.tom]), skewer(120, 24, -12, [C.herb, C.honey, C.tom, C.honey]),
      [58, 140, 262, 330, 232, 22, 360].map((x, i) => circ(x, 14 + ((i * 37) % 90), 2.4, C.white, 0.5)).join('')].join('');
  },
  coffee: () => {
    const bean = (x, y, s, rot) =>
      g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, ell(0, 0, 11, 15, C.espS), line('M-2 -14C6 -6 -6 6 2 14', C.esp, 2.4), ell(-4, -6, 2.2, 5, C.white, 25, 0.7));
    const steam = (x, o) => line(`M${x} 110c-14 -14 14 -22 0 -38s14 -22 0 -38`, C.white, 3, o);
    return [base(C.navy, 0.22),
      [[40, 36, 1, -30], [96, 88, 0.8, 40], [150, 30, 0.9, 70], [216, 82, 1.1, -50], [270, 36, 0.85, 20], [318, 90, 1, 110], [352, 34, 0.8, -70], [186, 38, 0.65, 160], [64, 100, 0.6, 15], [296, 62, 0.6, -20]].map((b) => bean(...b)).join(''),
      steam(120, 0.35), steam(246, 0.3), steam(332, 0.25)].join('');
  },
  bakehouse: () => {
    const wheat = (x, y, h, rot) => {
      const grains = [];
      for (let i = 0; i < 6; i++) { const gy = -h + i * 15; grains.push(ell(-8, gy + 6, 5, 10, C.honey, -28), ell(8, gy + 6, 5, 10, C.honey, 28)); }
      return g(`translate(${x} ${y}) rotate(${rot})`, line(`M0 0V${-h - 4}`, C.honey, 3), grains.join(''), ell(0, -h - 8, 5, 10, C.honey));
    };
    const croissant = (x, y, s, rot) =>
      g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, path_('M-42 14C-40 -14 -10 -26 0 -26s40 12 42 40c-8 -8 -16 -12 -24 -12 -2 8 -6 14 -18 14s-16 -6 -18 -14c-8 0 -16 4 -24 12z', C.honey), line('M-26 -6l10 20M-8 -20l4 28M10 -20l-4 28M28 -6l-10 20', C.navy, 2, 0.35), line('M-42 14C-40 -14 -10 -26 0 -26s40 12 42 40', C.white, 2, 0.6));
    return [base(C.white, 0.28), wheat(30, 140, 86, -8), wheat(78, 150, 100, 6), wheat(332, 140, 86, 8), wheat(284, 150, 100, -6), croissant(150, 66, 1.05, -8), croissant(232, 82, 0.8, 10),
      [118, 190, 260, 190, 52, 330].map((x, i) => circ(x + i * 2, 20 + ((i * 29) % 80), 2.2, C.honey, 0.6)).join('')].join('');
  },
  sushi: () => {
    const wave = (cx, cy) => [26, 16].map((r, i) => circ(cx, cy, r, i === 1 ? C.ok : C.white, i === 1 ? 0.4 : 0.12, ` stroke="${C.ok}" stroke-opacity=".55" stroke-width="1.5"`)).join('');
    const waves = [];
    for (let r = 0; r < 3; r++) for (let c = -1; c < 8; c++) waves.push(wave(c * 56 + (r % 2 ? 28 : 0), 112 - r * 20));
    const nigiri = (x, y, s) => g(`translate(${x} ${y}) scale(${s})`, rect(-38, 0, 76, 28, 14, C.white), rect(-38, 0, 76, 28, 14, C.navy, 0.08), path_('M-46 6C-40 -20 40 -20 46 6C30 14 -30 14 -46 6z', C.sal), line('M-30 -2q10 -8 22 -6M-4 -6q12 -4 22 2', C.white, 2.2, 0.7), line('M-46 6C-40 -20 40 -20 46 6C30 14 -30 14 -46 6z', C.navy, 2, 0.5), rect(-8, -2, 16, 36, 3, C.okS));
    return [base(C.navy, 0.12), circ(78, 38, 24, C.ok, 0.85), circ(70, 31, 8, C.white, 0.35), waves.join(''), nigiri(292, 46, 1.2), nigiri(166, 40, 0.75)].join('');
  },
  barber: () => {
    const stripes = [];
    for (let i = -2; i < 9; i++) stripes.push(path_(`M${i * 22} 123l30 -123h12l-30 123z`, i % 2 ? C.white : C.honey, 0.9));
    const scissors = g('translate(250 62) rotate(-22)', line('M-70 -22L40 14M-70 22L40 -14', C.white, 4, 0.95), circ(-76, -26, 11, 'none', 1, ` stroke="${C.honey}" stroke-width="5"`), circ(-76, 26, 11, 'none', 1, ` stroke="${C.honey}" stroke-width="5"`), circ(-6, 0, 4, C.honey));
    const comb = g('translate(210 84) rotate(-6)', rect(0, 0, 130, 14, 6, C.honeyS), Array.from({ length: 18 }, (_, i) => rect(3 + i * 7, 12, 3.6, 14, 1.8, C.honeyS)).join(''));
    return [clip(), `<g clip-path="url(#strip-barber__pole)">${stripes.join('')}</g>`, rect(8, 6, 118, 111, 14, C.navy, 0.08), scissors, comb, circ(160, 24, 3, C.white, 0.6), circ(352, 100, 3, C.honey, 0.9), circ(190, 106, 2.4, C.white, 0.5)].join('');
    function clip() { return `<clipPath id="strip-barber__pole"><rect x="12" y="10" width="112" height="103" rx="14"/></clipPath>`; }
  },
  nail: () => {
    const bottle = (x, y, s, body, rot) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, rect(-16, -6, 32, 42, 11, body), rect(-16, -6, 32, 42, 11, C.navy, 0.1), rect(-7, -30, 14, 26, 5, C.navy), rect(-9, -8, 18, 5, 2, C.white, 0.5), path_('M-11 4q0 -3 3 -4v26q-3 -1 -3 -4z', C.white, 0.55));
    const drop = (x, y, s, c) => g(`translate(${x} ${y}) scale(${s})`, path_('M0 -16C10 -2 12 4 12 8a12 12 0 0 1 -24 0c0 -4 2 -10 12 -24z', c), ell(-4, 6, 2, 4, C.white, 0, 0.6));
    const spark = (x, y, s) => path_(`M${x} ${y - s}q2 ${s - 2} ${s} ${s}q-${s - 2} 2 -${s} ${s}q-2 -${s - 2} -${s} -${s}q${s - 2} -2 ${s} -${s}z`, C.white, 0.9);
    return [base(C.white, 0.28), bottle(70, 62, 1.15, C.berry, -12), bottle(190, 70, 0.95, C.sal, 10), bottle(312, 60, 1.1, C.berry, -6), drop(130, 90, 1, C.berry), drop(252, 40, 0.9, C.sal), drop(360, 100, 0.7, C.berry), drop(24, 24, 0.8, C.sal), spark(120, 28, 8), spark(250, 100, 7), spark(32, 96, 6), spark(352, 24, 7)].join('');
  },
  pizza: () => {
    const slice = (x, y, s, rot) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, path_('M0 -56L-34 50Q0 62 34 50z', C.honeyS), path_('M-34 50Q0 62 34 50l-1 -8Q0 52 -33 42z', C.honey), circ(-8, 8, 8, C.tom), circ(10, -14, 7, C.tom), circ(12, 26, 7.5, C.tom), circ(-10, -22, 4, C.herb), line('M0 -56L-34 50Q0 62 34 50z', C.navy, 2, 0.4));
    const leaf = (x, y, rot, s) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, path_('M0 0C-10 -8 -10 -24 0 -32C10 -24 10 -8 0 0z', C.herb), line('M0 -2V-28', C.herbS, 1.6, 0.8));
    return [base(C.navy, 0.14), slice(58, 66, 1, -14), slice(168, 70, 0.9, 16), slice(280, 64, 1.05, -6), leaf(112, 40, 40, 1), leaf(228, 98, -50, 0.9), leaf(336, 44, 30, 0.85), leaf(18, 106, -30, 0.8), circ(120, 108, 3, C.honeyS, 0.7), circ(350, 104, 3, C.honeyS, 0.7), circ(220, 22, 2.6, C.honeyS, 0.7)].join('');
  },
  burger: () => {
    const burger = (x, y, s, rot) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`,
      path_('M-46 -4Q-46 -40 0 -40T46 -4z', C.honey), line('M-46 -4Q-46 -40 0 -40T46 -4z', C.navy, 2.4, 0.55), ell(-18, -22, 4, 2.2, C.honeyS, -20), ell(2, -29, 4, 2.2, C.honeyS, 10), ell(20, -20, 4, 2.2, C.honeyS, 30),
      path_('M-50 -2q8 8 16 0t16 0t16 0t16 0t16 0t16 0v6h-96z', C.herb), rect(-48, 4, 96, 12, 6, C.esp), path_('M-48 16h96l-14 12-10 -8-10 8-10 -8-10 8-10 -8-10 8z', C.honeyS), path_('M-46 30h92q0 14 -14 14h-64q-14 0 -14 -14z', C.honey));
    const pickle = (x, y, r) => circ(x, y, r, C.herb, 0.9) + circ(x, y, r - 4, C.herbS, 0.7);
    return [base(C.navy, 0.2), burger(76, 74, 1, -6), burger(196, 62, 0.8, 8), burger(310, 76, 1.05, -4), pickle(138, 26, 10), pickle(256, 100, 9), pickle(24, 26, 8), pickle(360, 26, 8), circ(140, 104, 3, C.honeyS, 0.7), circ(358, 76, 2.6, C.honeyS, 0.7), circ(240, 22, 2.6, C.honeyS, 0.7)].join('');
  },
  boba: () => {
    const cup = (x, y, s, tea, rot) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, line('M10 -50L18 -76H34', C.brand, 5), path_('M-30 -40h60l-7 82q-1 8 -9 8h-28q-8 0 -9 -8z', C.white, 0.9), path_('M-27 -14h54l-4 56q-1 8 -9 8h-28q-8 0 -9 -8z', tea), [[-14, 36], [0, 38], [14, 36], [-7, 28], [8, 28], [0, 20]].map(([a, b]) => circ(a, b, 5, C.navy, 0.85)).join(''), path_('M-34 -44q0 -8 8 -8h52q8 0 8 8z', C.brandMuted), line('M-22 -30l3 34', C.white, 2.6, 0.75));
    return [base(C.white, 0.24), cup(70, 80, 0.9, C.berry, -8), cup(196, 76, 1, C.brandMuted, 6), cup(316, 80, 0.9, C.berry, -4),
      [[24, 30, 7], [140, 20, 5], [130, 100, 6], [262, 26, 6], [260, 104, 5], [354, 28, 7], [16, 100, 5], [364, 104, 4]].map(([a, b, r]) => circ(a, b, r, C.navy, 0.8) + circ(a - r / 3, b - r / 3, r / 4, C.white, 0.7)).join('')].join('');
  },
  gelato: () => {
    const cone = (x, y, s, c1, c2) => g(`translate(${x} ${y}) scale(${s})`,
      path_('M-24 -2L0 70L24 -2z', C.honeyS), line('M-14 14L12 -2M-8 32L19 12M-3 50L22 30M12 14L-14 -2M16 30L-8 12M6 52L-20 34', C.honey, 1.6, 0.7), path_('M-24 -2L0 70L24 -2z', C.navy, 0.06),
      circ(0, -22, 26, c1), path_('M-26 -18q4 10 9 4q3 8 8 0q4 8 9 0q4 8 9 0q4 6 9 -4q4 4 6 2v6h-52z', c2), circ(-10, -34, 5, C.white, 0.6), circ(0, -46, 8, C.berry), line('M0 -54q6 -8 12 -6', C.navy, 2, 0.6));
    const sprinkles = [[30, 60, 20], [120, 24, -40], [150, 100, 60], [240, 30, 15], [256, 98, -20], [345, 30, 70], [340, 100, -50], [14, 20, 30]].map(([a, b, r], i) => `<rect x="${a - 6}" y="${b - 1.6}" width="12" height="3.2" rx="1.6" fill="${[C.berry, C.honey, C.white, C.sal][i % 4]}" transform="rotate(${r} ${a} ${b})"/>`).join('');
    return [base(C.white, 0.3), cone(72, 46, 0.95, C.herb, C.herbS), cone(188, 44, 1, C.berryS, C.berry), cone(302, 46, 0.95, C.white, C.herbS), sprinkles].join('');
  },
  bloom: () => {
    const flower = (x, y, s, petal, core, rot) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, [0, 60, 120, 180, 240, 300].map((a) => ell(0, -17, 10, 18, petal, 0).replace('<ellipse', `<ellipse transform="rotate(${a})"`)).join(''), circ(0, 0, 9, core), circ(-3, -3, 3, C.white, 0.6));
    const stem = (x, y, h) => line(`M${x} ${y}C${x + 8} ${y + h / 3} ${x - 8} ${y + (2 * h) / 3} ${x} ${y + h}`, C.herb, 3) + ell(x + 10, y + h * 0.55, 6, 11, C.herb, 50) + ell(x - 10, y + h * 0.75, 6, 11, C.herb, -50);
    return [base(C.white, 0.26), stem(60, 52, 80), stem(180, 56, 80), stem(300, 50, 80), stem(120, 78, 50), stem(244, 74, 50), stem(350, 80, 50),
      flower(60, 44, 1.05, C.white, C.honey, 10), flower(180, 48, 1.15, C.berryS, C.berry, -8), flower(300, 42, 1.05, C.white, C.sal, 20), flower(120, 74, 0.7, C.berryS, C.honey, 0), flower(244, 70, 0.75, C.white, C.berry, 30), flower(350, 76, 0.65, C.berryS, C.honey, 15), flower(14, 90, 0.5, C.white, C.berry, 0)].join('');
  },
  paws: () => {
    const paw = (x, y, s, rot, c) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, path_('M0 -2C-14 -2 -20 10 -18 18C-16 28 -8 26 0 24C8 26 16 28 18 18C20 10 14 -2 0 -2z', c), ell(-17, -10, 5.5, 8, c, -25), ell(-6, -22, 5.5, 8.5, c, -8), ell(6, -22, 5.5, 8.5, c, 8), ell(17, -10, 5.5, 8, c, 25));
    const bone = (x, y, s, rot) => g(`translate(${x} ${y}) rotate(${rot}) scale(${s})`, rect(-26, -6, 52, 12, 6, C.white, 0.9), circ(-27, -7, 8, C.white, 0.9), circ(-27, 7, 8, C.white, 0.9), circ(27, -7, 8, C.white, 0.9), circ(27, 7, 8, C.white, 0.9));
    return [base(C.navy, 0.14), paw(34, 90, 1, -20, C.white), paw(84, 56, 0.85, 10, C.brandSoft), paw(140, 94, 0.95, -10, C.white), paw(232, 46, 0.9, 16, C.white), paw(290, 88, 1.1, -14, C.brandSoft), paw(344, 40, 0.85, 20, C.white), bone(190, 94, 0.9, -14), bone(70, 20, 0.6, 12), bone(330, 108, 0.6, 20), circ(190, 20, 3, C.white, 0.6), circ(250, 108, 3, C.white, 0.5), circ(112, 28, 2.6, C.white, 0.5)].join('');
  },
};

// ---- marks (64x64 round monograms) --------------------------------------------------------
const mark = (disc, ring, art) => `<circle cx="32" cy="32" r="31" fill="${disc}"/><circle cx="32" cy="32" r="27" fill="none" stroke="${ring}" stroke-opacity=".5" stroke-width="1.5"/>${art}`;
const S = (d, c = C.white, w = 5) => line(d, c, w);
const marks = {
  kebab: () => mark(C.loss, C.white, S('M19 46V20l13 15 13-15v26') + path_('M32 8c3 4 1 6 4 8-4 0-8-2-4-8z', C.honeyS)),
  coffee: () => mark(C.esp, C.espS, S('M23 18v28M23 18h10a7.5 7 0 0 1 0 14H23M23 32h12a7.5 7 0 0 1 0 14H23', C.espS, 4.5)),
  bakehouse: () => mark(C.honey, C.honeyS, S('M24 14v35', C.honeyS, 5) + circ(34, 37, 9.5, 'none', 1, ` stroke="${C.honeyS}" stroke-width="5"`) + circ(44, 18, 3, C.white)),
  sushi: () => mark(C.navy, C.ok, S('M23 17v30M42 17L23 32l19 15', C.ok, 5.5) + circ(46, 18, 3, C.salS)),
  barber: () => mark(C.navy, C.honey, path_('M15 25l9 9 8-14 8 14 9-9v15H15z', C.honey) + rect(15, 44, 34, 5, 2.5, C.honeyS)),
  nail: () => mark(C.berry, C.berryS, S('M21 47V19l22 28V19', C.white, 5) + path_('M44 8c3 4 4 6 0 8-4-2-3-4 0-8z', C.berryS)),
  pizza: () => mark(C.tom, C.tomS, S('M24 48V17h10a9.5 9.5 0 0 1 0 19H24', C.white, 5) + circ(44, 44, 4, C.herbS)),
  burger: () => mark(C.honey, C.navy, S('M20 18v28h13a7 7 0 0 0 0-14H20M20 32h11a6.5 6.5 0 0 0 0-14', C.navy, 5)),
  boba: () => mark(C.brandMuted, C.navy, S('M23 14v35', C.navy, 4.5) + circ(33, 38, 9, 'none', 1, ` stroke="${C.navy}" stroke-width="4.5"`) + circ(46, 44, 4.5, C.navy) + line('M44 12l4-6h6', C.brand, 3)),
  gelato: () => mark(C.berry, C.berryS, S('M44 22a14.5 14.5 0 1 0 2 14H33', C.white, 5.5) + circ(44, 12, 3.5, C.herbS)),
  bloom: () => mark(C.herb, C.herbS, S('M22 15v34M22 15h9a8.5 8 0 0 1 0 16H22M22 31h11a8.5 9 0 0 1 0 18H22', C.herbS, 4.5) + ell(46, 16, 4, 7, C.white, 40)),
  paws: () => mark(C.okS, C.white, S('M24 49V17h10a9.5 9.5 0 0 1 0 19H24', C.white, 5) + circ(44, 44, 3, C.white) + circ(50, 38, 2.4, C.white)),
};

const wrap = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>\n`;
for (const [slug, fn] of Object.entries(strips)) fs.writeFileSync(path.join(root, 'public/illustrations/passes', `strip-${slug}.svg`), wrap('0 0 375 123', fn()));
for (const [slug, fn] of Object.entries(marks)) fs.writeFileSync(path.join(root, 'public/illustrations/brands', `mark-${slug}.svg`), wrap('0 0 64 64', fn()));
console.log(`wrote ${Object.keys(strips).length} strips and ${Object.keys(marks).length} marks`);
