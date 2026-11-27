import { IlloSvg, type IlloSvgProps } from './IlloSvg';
import { illos, type IlloName } from './illo-index';

export type { IlloName };

/**
 * Inlines an illustration from public/illustrations by name, e.g. <Illo name="icons/ui-stamp" />,
 * so CSS can style and animate its internals (ids and classes are kept by svgo.config.mjs).
 * Decorative by default (aria-hidden); pass `title` for a meaningful image.
 *
 * This imports the whole index. Prefer it in server components (zero client JS); in
 * 'use client' components use <IlloSvg data={...}> with a named import from ./illo-data.
 */
export function Illo({ name, ...rest }: Omit<IlloSvgProps, 'data'> & { name: IlloName }) {
  return <IlloSvg data={illos[name]} {...rest} className={['illo-' + name.replace(/\//g, '-'), rest.className].filter(Boolean).join(' ')} />;
}
