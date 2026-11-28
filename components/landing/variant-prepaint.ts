// Server-side helpers for app/layout.tsx: a pre-paint script and CSS so `?<section>=<variant>` and `?all=<variant>`
// never flash the default variant. Generated from the registry in ./variants.ts. See docs/VARIANTS.md.
import { SECTIONS } from './variants';

const ids = () => Object.fromEntries(Object.entries(SECTIONS).map(([s, d]) => [s, Object.keys(d.variants)]));

/** Sets data-<section>="<variant>" on <html> before first paint. Specific params beat `all`. */
export function variantScript(): string {
  return (
    `try{var S=${JSON.stringify(ids())},q=new URLSearchParams(location.search),a=q.get('all'),d=document.documentElement;` +
    `for(var s in S){var v=q.get(s);if(S[s].indexOf(v)<0)v=S[s].indexOf(a)>=0?a:null;if(v)d.setAttribute('data-'+s,v)}}catch(e){}`
  );
}

/** Hides every server-rendered (default) slot whose variant differs from the requested one. */
export function variantCss(): string {
  const out: string[] = [];
  for (const [s, v] of Object.entries(ids())) for (const id of v) out.push(`html[data-${s}="${id}"] [data-vslot="${s}"]:not([data-v="${id}"]){display:none}`);
  return out.join('');
}
