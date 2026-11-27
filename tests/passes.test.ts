import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PASSES, BENTO_PASSES, type PassSlug } from '@/components/landing/passes';
import { STAMP_NAMES } from '@/components/illustration/stamps';

const root = path.resolve(__dirname, '..');
const en: Record<string, string> = JSON.parse(fs.readFileSync(path.join(root, 'messages', 'en.json'), 'utf8'));

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

describe('wallet pass data', () => {
  it('defines the 12 demo businesses with unique slugs', () => {
    expect(PASSES).toHaveLength(12);
    expect(new Set(PASSES.map((p) => p.slug)).size).toBe(12);
    expect(new Set(PASSES.map((p) => p.name)).size).toBe(12);
  });

  it.each(PASSES.map((p) => [p.slug, p] as const))('%s: field text has >= 4.5:1 contrast on the pass background', (_s, p) => {
    expect(contrast(p.fg, p.bg), `fg ${p.fg} on ${p.bg}`).toBeGreaterThanOrEqual(4.5);
    expect(contrast(p.label, p.bg), `label ${p.label} on ${p.bg}`).toBeGreaterThanOrEqual(4.5);
  });

  it('every pass has a valid stamp icon, sane counts, a reward string and its art files', () => {
    for (const p of PASSES) {
      expect(STAMP_NAMES, p.slug).toContain(p.stamp);
      expect(p.stampsRequired).toBeGreaterThanOrEqual(6);
      expect(p.stampsRequired).toBeLessThanOrEqual(10);
      expect(p.current).toBeGreaterThan(0);
      expect(p.current).toBeLessThan(p.stampsRequired);
      expect(en[`landing.passes.${p.slug}.reward`], p.slug).toBeTruthy();
      for (const f of [`passes/strip-${p.slug}.svg`, `brands/mark-${p.slug}.svg`]) expect(fs.existsSync(path.join(root, 'public', 'illustrations', f)), f).toBe(true);
    }
  });

  it('strips use the 375x123 pass-strip viewBox and marks are square', () => {
    for (const p of PASSES) {
      expect(fs.readFileSync(path.join(root, 'public/illustrations/passes', `strip-${p.slug}.svg`), 'utf8')).toMatch(/viewBox="0 0 375 123"/);
      expect(fs.readFileSync(path.join(root, 'public/illustrations/brands', `mark-${p.slug}.svg`), 'utf8')).toMatch(/viewBox="0 0 64 64"/);
    }
  });

  it('the bento stack shuffles 6 of the 12', () => {
    expect(BENTO_PASSES).toHaveLength(6);
    const all = new Set<PassSlug>(PASSES.map((p) => p.slug));
    for (const p of BENTO_PASSES) expect(all.has(p.slug)).toBe(true);
  });
});
