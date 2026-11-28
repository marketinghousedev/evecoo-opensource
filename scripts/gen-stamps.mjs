// Generates public/illustrations/stamps/stamp-<name>-{filled,empty,mono}.svg from ONE shape
// definition per industry, so the three states share an identical silhouette and align
// pixel-perfect in a grid. Run `node scripts/gen-stamps.mjs && npm run svg:optimize`.
// Rules: docs/ILLUSTRATION-SYSTEM.md. Art is drawn in a 5..35 box and placed with
// translate(2.4 2.4) scale(.88) (centred, room for the check notch); stroke 3.3 * .88 = 2.9 units
// = 1.73 px when the 40-unit icon renders at 24 px.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'illustrations', 'stamps');

const C = {
  navy: '#0B1F44', ink: '#071130', white: '#FFFFFF', border: '#D7DDE7', success: '#12B76A',
  brandSoft: '#F1EBFE', brandMuted: '#CDBDFB',
  espresso: '#8A4B2A', espressoSoft: '#F3E6DC', honey: '#B86E00', honeySoft: '#FCEFD6',
  tomato: '#D4421C', tomatoSoft: '#FCE4DC', salmon: '#E5674A', salmonSoft: '#FDE8E2',
  berry: '#C2366F', berrySoft: '#FAE3EC', herb: '#5E7A1F', herbSoft: '#EAF0DA',
};

const ell = (cx, cy, rx, ry) => `M${cx - rx} ${cy}a${rx} ${ry} 0 1 0 ${2 * rx} 0a${rx} ${ry} 0 1 0 ${-2 * rx} 0Z`;
const rect = (x, y, w, h, r) => `M${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${y + h - r}Q${x + w} ${y + h} ${x + w - r} ${y + h}H${x + r}Q${x} ${y + h} ${x} ${y + h - r}V${y + r}Q${x} ${y} ${x + r} ${y}Z`;

// shape: [d, fill colour key | 'none', optional flag]. 'hl' = decorative highlight (filled only).
const ICONS = {
  // Doener spit: the skewer runs through (top knob and bottom tip) and the meat cone has bumpy
  // edges and slice ridges, so it never reads as a cup at 20 px.
  kebab: { tint: 'honeySoft', shapes: [
    ['M20 3V8M20 31V37', 'none'],
    ['M9 8.5H31Q33.5 11 30.5 13.5Q32.5 16.5 29 19Q30.5 22 27.5 24.5Q28.5 27.5 25 30.5H15Q11.5 27.5 12.5 24.5Q9.5 22 11 19Q7.5 16.5 9.5 13.5Q6.5 11 9 8.5Z', 'honey'],
    ['M11.5 14.5Q20 17 28.5 14.5M13 21.5Q20 24 27 21.5', 'none'],
    ['M12.5 11.5Q13.5 10.5 15 10.5', 'white', 'hl'],
  ] },
  coffee: { tint: 'espressoSoft', shapes: [
    ['M14 4.5Q12.2 7 14 9.5M20 4.5Q18.2 7 20 9.5', 'none'],
    ['M27 18H29.5Q33 18 33 22Q33 26 29.5 26H26', 'none'],
    ['M8.5 14H27.5V21Q27.5 31 18 31Q8.5 31 8.5 21Z', 'espresso'],
    ['M6 34.5H30', 'none'],
    ['M12.5 18.5V22', 'white', 'hl'],
  ] },
  croissant: { tint: 'honeySoft', shapes: [
    ['M5 26Q7 13 20 11Q33 13 35 26Q32 29 29 26Q26 29 22.5 26Q20 28.5 17.5 26Q14 29 11 26Q8 29 5 26Z', 'honey'],
    ['M16 14.5L16.5 23M24 14.5L23.5 23', 'none'],
    ['M10 18Q11.5 16 13 15', 'white', 'hl'],
  ] },
  bread: { tint: 'honeySoft', shapes: [
    ['M5.5 22Q4 11 20 11Q36 11 34.5 22Q34.5 29 31 30.5H9Q5.5 29 5.5 22Z', 'honey'],
    ['M15.5 15.5L17 23M23 15.5L24.5 23', 'none'],
    ['M9 18Q10 15.5 12.5 14', 'white', 'hl'],
  ] },
  pizza: { tint: 'tomatoSoft', shapes: [
    ['M6.5 12.5Q20 6.5 33.5 12.5L20 36Z', 'honeySoft'],
    ['M5 9Q20 1.5 35 9Q36 12 33.5 12.5Q20 6.5 6.5 12.5Q4 12 5 9Z', 'honey'],
    [ell(15, 17, 2.8, 2.8), 'tomato'],
    [ell(25, 17, 2.8, 2.8), 'tomato'],
    [ell(20, 25.5, 2.5, 2.5), 'tomato'],
  ] },
  burger: { tint: 'honeySoft', shapes: [
    ['M7 18Q7 8 20 8Q33 8 33 18Z', 'honey'],
    ['M6 21.5Q9 18.5 12 21.5Q15 18.5 18 21.5Q21 18.5 24 21.5Q27 18.5 30 21.5Q32 19.5 34 21.5V22H6Z', 'herb'],
    [rect(6, 22, 28, 5, 2.5), 'espresso'],
    ['M7 28.5H33Q33 33.5 28 33.5H12Q7 33.5 7 28.5Z', 'honey'],
  ] },
  sushi: { tint: 'salmonSoft', shapes: [
    [rect(6, 21, 28, 11, 5.5), 'white'],
    ['M5 21Q5 11 20 11Q35 11 35 21Q20 24.5 5 21Z', 'salmon'],
    ['M15 14.5L14 20.5M25 14.5L26 20.5', 'none'],
    ['M9.5 17Q11 14.5 14 13.5', 'white', 'hl'],
  ] },
  boba: { tint: 'espressoSoft', shapes: [
    ['M21.5 11L24.5 4H28', 'none'],
    ['M9.5 14H30.5L28.5 33.5Q28.3 35 27 35H13Q11.7 35 11.5 33.5Z', 'honeySoft'],
    ['M8.5 14Q8.5 10 20 10Q31.5 10 31.5 14Z', 'white'],
    [ell(16.5, 30, 2.4, 2.4), 'espresso'],
    [ell(23.5, 30, 2.4, 2.4), 'espresso'],
    [ell(20, 25, 2.4, 2.4), 'espresso'],
  ] },
  icecream: { tint: 'berrySoft', shapes: [
    ['M12.5 21L20 36L27.5 21Z', 'honey'],
    ['M16.5 26L22 30.5', 'none'],
    ['M11 21Q9 9 20 8Q31 9 29 21Q25 24 20 22.5Q15 24 11 21Z', 'berry'],
    ['M14.5 15Q15.5 12 18 11', 'white', 'hl'],
  ] },
  // Open scissors: hollow finger rings (visible in every state), pointed blades, pivot dot.
  scissors: { tint: 'espressoSoft', shapes: [
    ['M15 24.5L28.5 4.5Q30.5 5.5 30 8L19 26.5Z', 'border'],
    ['M25 24.5L11.5 4.5Q9.5 5.5 10 8L21 26.5Z', 'border'],
    [ell(12, 30.5, 4.8, 4.8), 'none'],
    [ell(28, 30.5, 4.8, 4.8), 'none'],
    [ell(20, 17.5, 1, 1), 'navy'],
  ] },
  nail: { tint: 'berrySoft', shapes: [
    [rect(10.5, 17, 19, 17, 4.5), 'berry'],
    [rect(16.5, 12, 7, 5.5, 1), 'navy'],
    [rect(14.5, 3.5, 11, 9.5, 2.5), 'navy'],
    ['M15 22V29', 'white', 'hl'],
  ] },
  lipstick: { tint: 'berrySoft', shapes: [
    ['M15.5 16V9.5Q15.5 6.5 20.5 5L25 7.5V16Z', 'berry'],
    [rect(13, 16, 14, 6, 1.5), 'border'],
    [rect(12, 22, 16, 12.5, 2.5), 'navy'],
    ['M16.5 26V31', 'white', 'hl'],
  ] },
  // Five-petal bloom on a stem with one leaf (reads as a flower, not a pot, at 20 px).
  flower: { tint: 'berrySoft', shapes: [
    ['M20 22V36', 'none'],
    ['M20 31Q26.5 31.5 29 24.5Q22.5 24 20 31Z', 'herb'],
    ['M15.72 7.11A4.3 4.3 0 1 1 24.28 7.11A4.3 4.3 0 1 1 26.93 15.25A4.3 4.3 0 1 1 20 20.28A4.3 4.3 0 1 1 13.07 15.25A4.3 4.3 0 1 1 15.72 7.11Z', 'berry'],
    [ell(20, 13, 2.4, 2.4), 'honeySoft'],
  ] },
  carwash: { tint: 'brandSoft', shapes: [
    ['M20 5Q31.5 17 31.5 24.5A11.5 11.5 0 0 1 8.5 24.5Q8.5 17 20 5Z', 'brandMuted'],
    [ell(31.5, 9.5, 2.4, 2.4), 'white'],
    [ell(8.5, 11.5, 2, 2), 'white'],
    ['M14 25.5Q14 21.5 17 18.5', 'white', 'hl'],
  ] },
  paw: { tint: 'espressoSoft', shapes: [
    ['M20 19C26 19 31 26 31 30C31 33.5 27.5 34 24 33Q20 31.8 16 33C12.5 34 9 33.5 9 30C9 26 14 19 20 19Z', 'espresso'],
    [ell(9.5, 18, 3.4, 4), 'espresso'],
    [ell(15.5, 11.5, 3.4, 4.2), 'espresso'],
    [ell(24.5, 11.5, 3.4, 4.2), 'espresso'],
    [ell(30.5, 18, 3.4, 4), 'espresso'],
  ] },
  star: { tint: 'honeySoft', shapes: [
    ['M20 5L24.2 14.2L34.3 15.3L26.8 22.1L28.9 32L20 27L11.1 32L13.2 22.1L5.7 15.3L15.8 14.2Z', 'honey'],
    ['M12.5 13.8Q15 11 18 10', 'white', 'hl'],
  ] },
};

const ART = 'transform="translate(2.4 2.4) scale(.88)"';
const SW = 'stroke-width="3.3" stroke-linecap="round" stroke-linejoin="round"';
const svg = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40">${body}</svg>\n`;

function filled(name, ic) {
  const art = ic.shapes
    .map(([d, f, flag]) => {
      if (flag === 'hl') return `<path d="${d}" fill="none" stroke="${C.white}" stroke-opacity=".75" stroke-width="2.4" stroke-linecap="round"/>`;
      return `<path d="${d}" fill="${f === 'none' ? 'none' : C[f]}"/>`;
    })
    .join('');
  return svg(
    `<circle cx="20" cy="20" r="19" fill="${C[ic.tint]}" class="stamp-disc"/>` +
      `<path d="M5.4 13.6A15.5 15.5 0 0 1 13.6 5.4" fill="none" stroke="${C.white}" stroke-opacity=".85" stroke-width="2" stroke-linecap="round" class="stamp-light"/>` +
      `<g ${ART} fill="none" stroke="${C.navy}" ${SW} class="stamp-art">${art}</g>` +
      `<g class="stamp-notch"><circle cx="31.5" cy="31.5" r="5.6" fill="${C.success}" stroke="${C.white}" stroke-width="1.6"/>` +
      `<path d="M28.9 31.7L30.8 33.6L34.2 29.8" fill="none" stroke="${C.white}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></g>`,
  );
}

function empty(name, ic) {
  const art = ic.shapes.filter(([, , flag]) => flag !== 'hl').map(([d]) => `<path d="${d}"/>`).join('');
  return svg(
    `<g opacity=".25" fill="none" stroke="${C.ink}" stroke-linecap="round" stroke-linejoin="round">` +
      `<circle cx="20" cy="20" r="18.2" stroke-width="1.6" class="stamp-disc"/>` +
      `<g ${ART} ${SW} class="stamp-art">${art}</g></g>`,
  );
}

function mono(name, ic) {
  const art = ic.shapes
    .filter(([, , flag]) => flag !== 'hl')
    .map(([d, f]) => `<path d="${d}"${f === 'none' ? ' fill="none"' : ''}/>`)
    .join('');
  return svg(`<g ${ART} fill="currentColor" fill-opacity=".22" stroke="currentColor" ${SW} class="stamp-art">${art}</g>`);
}

fs.mkdirSync(out, { recursive: true });
for (const [name, ic] of Object.entries(ICONS)) {
  fs.writeFileSync(path.join(out, `stamp-${name}-filled.svg`), filled(name, ic));
  fs.writeFileSync(path.join(out, `stamp-${name}-empty.svg`), empty(name, ic));
  fs.writeFileSync(path.join(out, `stamp-${name}-mono.svg`), mono(name, ic));
}
console.log(`stamps: ${Object.keys(ICONS).length} icons x 3 states`);
