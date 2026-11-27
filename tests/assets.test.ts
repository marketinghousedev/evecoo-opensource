// Enforces the asset rules in docs/ILLUSTRATION-SYSTEM.md and public/illustrations/README.md.
import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { loadConfig, optimize } from 'svgo';
import { allowedHex } from '@/components/illustration/palette';

const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'public', 'illustrations');

/** Top-level asset folders. File names inside are `<group>-<name>[-<variant>].svg`, kebab-case. */
export const FOLDERS = ['avatars', 'stamps', 'passes', 'scenes', 'backgrounds', 'brands', 'icons'];
const KB = 1024;
const budget = (folder: string) => (folder === 'scenes' ? 24 * KB : 8 * KB);
/** Official Apple/Google wallet badges (brands/badge-*): stored unmodified, exempt from content rules. */
const isOfficialBadge = (rel: string) => /^brands\/badge-[a-z0-9-]+\.(svg|png)$/.test(rel);
const KEBAB = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const expandHex = (h: string) => {
  const x = h.slice(1).toUpperCase();
  return '#' + (x.length === 3 ? x.replace(/./g, (c) => c + c) : x);
};

/** Returns rule violations for one SVG source. Pure so it can be unit-tested on fixtures. */
export function checkSvg(folder: string, file: string, src: string): string[] {
  const errs: string[] = [];
  const name = file.replace(/\.svg$/, '');
  if (!FOLDERS.includes(folder)) errs.push(`unknown folder "${folder}"`);
  if (!file.endsWith('.svg')) return [...errs, 'not an .svg file (see public/illustrations/README.md)'];
  if (!KEBAB.test(name)) errs.push('name is not kebab-case');
  const size = Buffer.byteLength(src);
  if (size > budget(folder)) errs.push(`${(size / KB).toFixed(1)} KB exceeds ${budget(folder) / KB} KB budget`);

  const rootTag = src.match(/<svg\b[^>]*>/)?.[0];
  if (!rootTag) return [...errs, 'no root <svg>'];
  if (!/\sviewBox="[^"]+"/.test(rootTag)) errs.push('root <svg> has no viewBox');
  if (/\s(width|height)="/.test(rootTag)) errs.push('root <svg> has width/height (size it with CSS)');

  for (const el of ['image', 'text', 'tspan', 'textPath', 'foreignObject', 'script', 'style', 'filter'])
    if (new RegExp(`<${el}[\\s>/]`).test(src)) errs.push(`<${el}> is not allowed`);
  if (/data:/i.test(src)) errs.push('embedded data: URI');
  if (/href="(?!#)/.test(src)) errs.push('external href (only #fragment references)');
  if (/\sfont-(family|size|weight)=/.test(src)) errs.push('font attributes');
  for (const [, style] of src.matchAll(/\sstyle="([^"]*)"/g))
    if (/font(-family|-size|-weight)?\s*:/i.test(style)) errs.push(`style attribute with a hardcoded font: "${style}"`);

  for (const [, id] of src.matchAll(/\sid="([^"]+)"/g))
    if (!id.startsWith(name + '__')) errs.push(`id "${id}" must be namespaced "${name}__…"`);
  for (const [hex] of src.matchAll(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/g))
    if (!allowedHex.has(expandHex(hex))) errs.push(`colour ${hex} is not in the palette`);
  for (const [, c] of src.matchAll(/\s(?:fill|stroke|stop-color|color)="([a-zA-Z]+)"/g))
    if (!['none', 'currentColor', 'transparent'].includes(c)) errs.push(`named colour "${c}" (use a palette hex)`);
  return errs;
}

type Asset = { folder: string; file: string; rel: string; abs: string };
const walk = (d: string): string[] =>
  fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const assets: Asset[] = (fs.existsSync(dir) ? walk(dir) : [])
  .map((abs) => {
    const rel = path.relative(dir, abs).split(path.sep).join('/');
    return { folder: rel.includes('/') ? rel.split('/')[0] : '', file: path.basename(abs), rel, abs };
  })
  // README.md files and .gitkeep placeholders are documentation, not assets.
  .filter((a) => a.file !== 'README.md' && a.file !== '.gitkeep');
const svgs = assets.filter((a) => !isOfficialBadge(a.rel));

describe('illustration rule checker', () => {
  const ok = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M1 1h2" class="x"/></svg>';
  it('accepts a clean asset', () => expect(checkSvg('icons', 'icon-ok.svg', ok)).toEqual([]));
  it.each([
    ['missing viewBox', 'icon-a.svg', '<svg xmlns="http://www.w3.org/2000/svg"><path d="M0 0"/></svg>', /viewBox/],
    ['width/height', 'icon-a.svg', '<svg viewBox="0 0 2 2" width="2" height="2"/>', /width\/height/],
    ['<image>', 'icon-a.svg', '<svg viewBox="0 0 2 2"><image href="#a"/></svg>', /<image>/],
    ['raster data URI', 'icon-a.svg', '<svg viewBox="0 0 2 2"><use href="data:image/png;base64,AA"/></svg>', /data:/],
    ['<text>', 'icon-a.svg', '<svg viewBox="0 0 2 2"><text>Hi</text></svg>', /<text>/],
    ['font style', 'icon-a.svg', '<svg viewBox="0 0 2 2"><g style="font-family:Arial"/></svg>', /hardcoded font/],
    ['budget', 'icon-a.svg', `<svg viewBox="0 0 2 2"><path d="${'M0 0'.repeat(2200)}"/></svg>`, /budget/],
    ['off-palette colour', 'icon-a.svg', '<svg viewBox="0 0 2 2"><path fill="#123456" d="M0 0"/></svg>', /palette/],
    ['named colour', 'icon-a.svg', '<svg viewBox="0 0 2 2"><path fill="red" d="M0 0"/></svg>', /named colour/],
    ['un-namespaced id', 'icon-a.svg', '<svg viewBox="0 0 2 2"><path id="beam" d="M0 0"/></svg>', /namespaced/],
    ['non-SVG file', 'icon-a.png', ok, /not an \.svg/],
    ['not kebab-case', 'icon_A.svg', ok, /kebab/],
  ])('rejects %s', (_label, file, src, re) => {
    expect(checkSvg('icons', file, src).join('\n')).toMatch(re);
  });
  it('rejects files outside the known folders', () => expect(checkSvg('misc', 'icon-a.svg', ok).join()).toMatch(/unknown folder/));
  it('allows the larger scene budget', () => {
    const big = `<svg viewBox="0 0 2 2"><path d="${'M0 0'.repeat(4000)}"/></svg>`;
    expect(checkSvg('scenes', 'scene-a.svg', big)).toEqual([]);
  });
});

describe('public/illustrations', () => {
  it('has every group folder with a README at the root', () => {
    for (const f of FOLDERS) expect(fs.existsSync(path.join(dir, f)), f).toBe(true);
    expect(fs.existsSync(path.join(dir, 'README.md'))).toBe(true);
  });

  it.each(svgs.map((a) => [a.rel, a] as const))('%s follows the asset rules', (_rel, a) => {
    expect(checkSvg(a.folder, a.file, fs.readFileSync(a.abs, 'utf8'))).toEqual([]);
  });

  it('every asset is already svgo-optimized (run npm run svg:optimize)', async () => {
    const config = await loadConfig(path.join(root, 'svgo.config.mjs'));
    for (const a of svgs.filter((s) => s.file.endsWith('.svg'))) {
      const src = fs.readFileSync(a.abs, 'utf8');
      const out = optimize(src, { ...config, path: a.abs }).data;
      const saved = Buffer.byteLength(src) - Buffer.byteLength(out);
      expect(saved, `${a.rel} shrinks by ${saved} bytes under svgo`).toBeLessThanOrEqual(Math.max(32, Buffer.byteLength(src) * 0.01));
    }
  });

  it('ids are unique across the library', () => {
    const seen = new Map<string, string>();
    for (const a of svgs) {
      for (const [, id] of fs.readFileSync(a.abs, 'utf8').matchAll(/\sid="([^"]+)"/g)) {
        expect(seen.get(id), `id "${id}" in ${a.rel}`).toBeUndefined();
        seen.set(id, a.rel);
      }
    }
  });

  it('the Illo index is up to date (run node scripts/gen-illo-index.mjs)', () => {
    expect(() => execFileSync(process.execPath, [path.join(root, 'scripts', 'gen-illo-index.mjs'), '--check'], { stdio: 'pipe' })).not.toThrow();
  });
});
