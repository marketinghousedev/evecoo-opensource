import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { renderToStaticMarkup } from 'react-dom/server';
import { StampGrid } from '@/components/illustration/StampGrid';
import { STAMP_NAMES } from '@/components/illustration/stamps';

describe('stamp library', () => {
  it('has filled, empty and mono files for every industry', () => {
    for (const n of STAMP_NAMES)
      for (const k of ['filled', 'empty', 'mono'])
        expect(fs.existsSync(path.join(__dirname, '..', 'public', 'illustrations', 'stamps', `stamp-${n}-${k}.svg`)), `${n}-${k}`).toBe(true);
    expect(STAMP_NAMES).toHaveLength(16);
  });

  it('empty and filled slots share one art silhouette', () => {
    const dir = path.join(__dirname, '..', 'public', 'illustrations', 'stamps');
    for (const n of STAMP_NAMES) {
      const art = (k: string) => fs.readFileSync(path.join(dir, `stamp-${n}-${k}.svg`), 'utf8').match(/transform="[^"]+"/)?.[0];
      expect(art('empty')).toBeDefined();
      expect(art('empty')).toBe(art('filled'));
      expect(art('mono')).toBe(art('filled'));
    }
  });
});

describe('StampGrid', () => {
  it('renders N slots with K filled', () => {
    const html = renderToStaticMarkup(<StampGrid name="coffee" n={8} filled={3} />);
    expect(html.match(/class="stamp-slot[ "]/g)).toHaveLength(8);
    expect(html.match(/stamp-slot is-filled/g)).toHaveLength(3);
    expect(html).toContain('aria-hidden="true"');
  });

  it('clamps K and names itself when labelled', () => {
    const html = renderToStaticMarkup(<StampGrid name="star" n={4} filled={9} label="4 of 4 stamps" tone="mono" />);
    expect(html.match(/stamp-slot is-filled/g)).toHaveLength(4);
    expect(html).toContain('role="img"');
    expect(html).toContain('stamp-notch-mono');
  });

  it('does not pop on first render', () => {
    expect(renderToStaticMarkup(<StampGrid name="paw" n={5} filled={5} />)).not.toContain('is-pop');
  });
});
