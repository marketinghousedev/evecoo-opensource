import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { Illo } from '@/components/illustration/Illo';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { iconsUiStamp } from '@/components/illustration/illo-data';

describe('Illo', () => {
  it('inlines the SVG with its animatable classes, decorative by default', () => {
    const html = renderToStaticMarkup(<Illo name="icons/ui-stamp" className="x" />);
    expect(html).toMatch(/^<svg [^>]*viewBox="0 0 24 24"/);
    expect(html).toContain('aria-hidden="true"');
    expect(html).toContain('class="illo illo-icons-ui-stamp x"');
    expect(html).toContain('stroke-width="1.75"');
    expect(html).toContain('class="stamp-check"');
    expect(html).not.toMatch(/\s(width|height)="/);
  });

  it('a title makes it a named, escaped image', () => {
    const html = renderToStaticMarkup(<IlloSvg data={iconsUiStamp} title="A <stamp>" />);
    expect(html).toContain('role="img"');
    expect(html).toContain('aria-label="A &lt;stamp&gt;"');
    expect(html).toContain('<title>A &lt;stamp&gt;</title>');
    expect(html).not.toContain('aria-hidden');
  });
});
