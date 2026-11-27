import type { SVGProps } from 'react';
import type { IlloData } from './types';

export type IlloSvgProps = Omit<SVGProps<SVGSVGElement>, 'children' | 'dangerouslySetInnerHTML' | 'title'> & {
  data: IlloData;
  /** Accessible name. Without it the illustration is decorative (aria-hidden). */
  title?: string;
};

const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Inlines one illustration from its data object. Use this in client components with a named
 * import (`import { iconsUiStamp } from '@/components/illustration/illo-data'`) so the bundler
 * ships only the assets that component uses.
 */
export function IlloSvg({ data, title, className, ...rest }: IlloSvgProps) {
  const a11y = title ? { role: 'img', 'aria-label': title } : { 'aria-hidden': true as const, focusable: 'false' as const };
  const cls = ['illo', data.attrs.className, className].filter(Boolean).join(' ');
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={data.viewBox}
      {...data.attrs}
      {...a11y}
      {...rest}
      className={cls}
      dangerouslySetInnerHTML={{ __html: title ? `<title>${esc(title)}</title>${data.body}` : data.body }}
    />
  );
}
