// Generates the How-it-works phone-story scenes in public/illustrations/scenes/.
// Run `node scripts/gen-scenes.mjs && npm run svg:optimize`. Palette hexes only (components/illustration/palette.ts).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'public', 'illustrations');
const C = {
  brand: '#6D3BF5', brandLight: '#8B5CF6', brandSoft: '#F1EBFE', brandMuted: '#CDBDFB', navy: '#0B1F44', ink: '#071130', white: '#FFFFFF',
  espresso: '#8A4B2A', espressoSoft: '#F3E6DC', honey: '#B86E00', honeySoft: '#FCEFD6', tomato: '#D4421C', tomatoSoft: '#FCE4DC', berry: '#C2366F',
};
const svg = (vb, body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}">${body}</svg>\n`;
const stop = (o, c, op = 1) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`;
const write = (dir, name, s) => fs.writeFileSync(path.join(root, dir, name + '.svg'), s);

/* ---------- counter scene: what the phone camera sees (268x356) ---------- */
function counter(kind) {
  const n = `counter-scene-${kind}`;
  const hero = `<g class="spit">
         <rect x="35" y="30" width="3.4" height="172" rx="1.7" fill="${C.navy}" fill-opacity=".45"/>
         <rect x="12" y="46" width="48" height="150" rx="15" fill="${C.honey}"/>
         <path d="M14 76h44M13 100h46M13 124h46M14 148h44M16 172h40" stroke="${C.espresso}" stroke-width="7" stroke-linecap="round" stroke-opacity=".75"/>
         <path d="M14 62h44M13 88h46M13 112h46M13 136h46M14 160h44" stroke="${C.tomato}" stroke-width="4" stroke-linecap="round" stroke-opacity=".55"/>
         <rect x="38" y="46" width="22" height="150" rx="11" fill="${C.navy}" fill-opacity=".22"/>
         <rect x="8" y="36" width="56" height="12" rx="5" fill="${C.espressoSoft}"/>
         <rect x="10" y="196" width="52" height="9" rx="3" fill="${C.navy}" fill-opacity=".35"/>
         <rect x="62" y="56" width="26" height="124" rx="6" fill="url(#${n}__heat)"/>
       </g>`;
  const glow = C.tomato;
  const bokeh = [[132, 24, 14, .5], [24, 12, 9, .35], [246, 96, 12, .35], [106, 84, 8, .4], [172, 118, 10, .3], [232, 40, 7, .4]]
    .map(([x, y, r, o]) => `<circle class="bokeh" cx="${x}" cy="${y}" r="${r}" fill="url(#${n}__bokeh)" fill-opacity="${o}"/>`).join('');
  const menu = [0, 1, 2, 3].map((i) => `<path d="M112 ${22 + i * 8}h${i % 2 ? 54 : 72}M192 ${22 + i * 8}h${i % 2 ? 30 : 24}" stroke="${C.honeySoft}" stroke-width="2.6" stroke-linecap="round" stroke-opacity="${i ? .55 : .85}"/>`).join('');
  const grain = [250, 266, 284, 302].map((y, i) => `<path d="M0 ${y}q70 ${i % 2 ? -3 : 3} 134 0t134 0" fill="none" stroke="${C.espresso}" stroke-opacity=".18" stroke-width="1.4"/>`).join('');
  return svg('0 0 268 356', `
<defs>
<linearGradient id="${n}__wall" x1="0" x2="0" y1="0" y2="1">${stop(0, C.honeySoft)}${stop(1, C.espressoSoft)}</linearGradient>
<linearGradient id="${n}__top" x1="0" x2="0" y1="0" y2="1">${stop(0, C.espressoSoft)}${stop(1, C.espresso, .45)}</linearGradient>
<linearGradient id="${n}__edge" x1="0" x2="0" y1="0" y2="1">${stop(0, C.espresso)}${stop(1, C.navy, .8)}</linearGradient>
<linearGradient id="${n}__heat" x1="0" x2="1" y1="0" y2="0">${stop(0, glow, .5)}${stop(1, glow, 0)}</linearGradient>
<linearGradient id="${n}__acrylic" x1="0" x2="1" y1="0" y2="1">${stop(0, C.white, .75)}${stop(.5, C.brandSoft, .35)}${stop(1, C.white, .6)}</linearGradient>
<radialGradient id="${n}__bokeh" cx=".5" cy=".5" r=".5">${stop(0, C.white, .9)}${stop(1, C.white, 0)}</radialGradient>
<radialGradient id="${n}__lamp" cx=".5" cy=".5" r=".5">${stop(0, glow, .55)}${stop(1, glow, 0)}</radialGradient>
<pattern id="${n}__tile" width="26" height="18" patternUnits="userSpaceOnUse"><rect width="26" height="18" fill="${C.white}" fill-opacity=".38"/><path d="M0 .5h26M.5 0v18" stroke="${C.espresso}" stroke-opacity=".16"/></pattern>
</defs>
<g class="dof">
<rect width="268" height="250" fill="url(#${n}__wall)"/>
<rect y="104" width="268" height="140" fill="url(#${n}__tile)"/>
<path d="M0 104h268" stroke="${C.espresso}" stroke-opacity=".25" stroke-width="3"/>
<rect x="104" y="12" width="132" height="48" rx="6" fill="${C.navy}" fill-opacity=".9"/>
<rect x="104" y="12" width="132" height="48" rx="6" fill="none" stroke="${C.espresso}" stroke-width="3"/>${menu}
<circle cx="94" cy="62" r="36" fill="url(#${n}__lamp)"/>
${bokeh}
${hero}
<g class="pos"><rect x="204" y="150" width="62" height="48" rx="5" fill="${C.navy}"/><rect x="209" y="155" width="52" height="34" rx="3" fill="${C.brandLight}"/><rect x="214" y="162" width="28" height="3" rx="1.5" fill="${C.white}" fill-opacity=".75"/><rect x="214" y="169" width="18" height="3" rx="1.5" fill="${C.white}" fill-opacity=".45"/><rect x="238" y="176" width="16" height="7" rx="3" fill="${C.white}" fill-opacity=".85"/><rect x="229" y="198" width="10" height="14" fill="${C.navy}"/></g>
</g>
<rect y="236" width="268" height="84" fill="url(#${n}__top)"/>${grain}
<rect y="236" width="268" height="3" fill="${C.white}" fill-opacity=".55"/>
<rect y="320" width="268" height="36" fill="url(#${n}__edge)"/>
<path d="M0 320h268" stroke="${C.honeySoft}" stroke-opacity=".5" stroke-width="2"/>
<ellipse cx="134" cy="262" rx="92" ry="9" fill="${C.navy}" fill-opacity=".22"/>
<g class="standee">
<rect x="56" y="256" width="156" height="13" rx="4" fill="${C.white}" fill-opacity=".9"/>
<rect x="56" y="256" width="156" height="4" rx="2" fill="${C.white}"/>
<rect x="56" y="265" width="156" height="4" rx="2" fill="${C.navy}" fill-opacity=".12"/>
<rect x="63" y="52" width="142" height="206" rx="9" fill="url(#${n}__acrylic)"/>
<rect x="63" y="52" width="142" height="206" rx="9" fill="none" stroke="${C.white}" stroke-width="2"/>
<rect x="69" y="58" width="130" height="194" rx="4" fill="${C.white}"/>
<path d="M72 62l30-8M66 112l22-30" stroke="${C.white}" stroke-width="3" stroke-opacity=".8" stroke-linecap="round" fill="none"/>
<rect class="standee-qr" id="${n}__standee-qr" x="88" y="126" width="92" height="92" fill="none"/>
<rect class="standee-badges" id="${n}__standee-badges" x="77" y="226" width="114" height="14" fill="none"/>
</g>`);
}
write('scenes', 'counter-scene-kebab', counter('kebab'));

/* ---------- join page header: stamp pattern at 8% on the brand colour (currentColor) ---------- */
const stampArt = (name) => fs.readFileSync(path.join(root, 'stamps', `stamp-${name}-mono.svg`), 'utf8')
  .match(/<g[\s\S]*<\/g>/)[0].replace(/currentColor/g, C.white).replace(/ class="[^"]*"/, '');
function joinHeader(slug, a, b) {
  const n = `join-header-${slug}`;
  return svg('0 0 268 132', `
<defs>
<pattern id="${n}__pat" width="72" height="60" patternUnits="userSpaceOnUse" patternTransform="rotate(-12)">
<g opacity=".08"><g transform="translate(4 4) scale(.8)">${stampArt(a)}</g><g transform="translate(40 32) scale(.8)">${stampArt(b)}</g></g>
</pattern>
<linearGradient id="${n}__shade" x1="0" x2="0" y1="0" y2="1">${stop(0, C.ink, 0)}${stop(1, C.ink, .28)}</linearGradient>
</defs>
<rect width="268" height="132" fill="currentColor"/>
<rect width="268" height="132" fill="url(#${n}__pat)"/>
<rect width="268" height="132" fill="url(#${n}__shade)"/>`);
}
write('scenes', 'join-header-kebab', joinHeader('kebab', 'kebab', 'burger'));

/* ---------- scan success background (268x580) ---------- */
{
  const n = 'scan-success';
  const cx = 134, cy = 246;
  write('scenes', n, svg('0 0 268 580', `
<defs>
<linearGradient id="${n}__bg" x1=".2" x2=".8" y1="0" y2="1">${stop(0, C.brandLight)}${stop(.55, C.brand)}${stop(1, C.navy)}</linearGradient>
<radialGradient id="${n}__light" cx=".5" cy=".5" r=".5">${stop(0, C.white, .42)}${stop(.45, C.brandMuted, .14)}${stop(1, C.white, 0)}</radialGradient>
</defs>
<rect width="268" height="580" fill="url(#${n}__bg)"/>
<circle cx="${cx}" cy="${cy}" r="190" fill="url(#${n}__light)"/>
<g fill="none" stroke="${C.white}">
<circle class="ring ring-1" id="${n}__ring-1" cx="${cx}" cy="${cy}" r="60" stroke-opacity=".3" stroke-width="1.5"/>
<circle class="ring ring-2" id="${n}__ring-2" cx="${cx}" cy="${cy}" r="92" stroke-opacity=".2" stroke-width="1.5"/>
<circle class="ring ring-3" id="${n}__ring-3" cx="${cx}" cy="${cy}" r="128" stroke-opacity=".12" stroke-width="1.5"/>
</g>`));
}

/* ---------- lock screen wallpapers (268x580), reused by the feature cards ---------- */
function wallpaper(variant) {
  const n = `lockscreen-wallpaper-${variant}`;
  const base = [C.brand, C.brandLight, C.brandMuted];
  const hi = C.brandMuted;
  const wave = (y, a, op, col, id) =>
    `<path class="wave wave-${id}" d="M-20 ${y}C40 ${y - a} 90 ${y + a} 150 ${y}S250 ${y - a} 300 ${y - a / 2}V620H-20Z" fill="${col}" fill-opacity="${op}"/>`;
  return svg('0 0 268 580', `
<defs>
<linearGradient id="${n}__bg" x1="0" x2="0" y1="0" y2="1">${stop(0, base[0])}${stop(.5, base[1])}${stop(1, base[2])}</linearGradient>
<radialGradient id="${n}__glow" cx=".5" cy=".5" r=".5">${stop(0, hi, .75)}${stop(1, hi, 0)}</radialGradient>
</defs>
<rect width="268" height="580" fill="url(#${n}__bg)"/>
<ellipse cx="70" cy="560" rx="210" ry="170" fill="url(#${n}__glow)"/>
<ellipse cx="236" cy="150" rx="140" ry="120" fill="url(#${n}__glow)" fill-opacity=".35"/>
${wave(330, 34, 0.1, C.white, 1)}${wave(400, 40, 0.12, C.white, 2)}${wave(470, 36, 0.16, C.brandLight, 3)}${wave(530, 30, 0.22, C.brand, 4)}`);
}
write('scenes', 'lockscreen-wallpaper-blue', wallpaper('blue'));
