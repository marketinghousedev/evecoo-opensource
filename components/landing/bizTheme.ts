'use client';

// Business theme store: the visitor picks a business (Logos variant B) and the hero pass and the feature
// card carousel follow it. State lives in a tiny external store, the URL (?biz=<slug>) and localStorage.
import { useEffect, useSyncExternalStore } from 'react';
import { PASS_BY_SLUG, type PassDef, type PassSlug } from './passes';

export type BizId =
  | 'cafe' | 'bakery' | 'kebab' | 'pizza' | 'barber' | 'nails'
  | 'sushi' | 'bubble-tea' | 'gelato' | 'flowers' | 'pets' | 'burgers';

export type BizDef = { id: BizId; pass: PassSlug; msg: string };

export const BIZ: readonly BizDef[] = [
  { id: 'cafe', pass: 'coffee', msg: 'landing.biz.cafe' },
  { id: 'bakery', pass: 'bakehouse', msg: 'landing.biz.bakery' },
  { id: 'kebab', pass: 'kebab', msg: 'landing.biz.kebab' },
  { id: 'pizza', pass: 'pizza', msg: 'landing.biz.pizza' },
  { id: 'barber', pass: 'barber', msg: 'landing.biz.barber' },
  { id: 'nails', pass: 'nail', msg: 'landing.biz.nails' },
  { id: 'sushi', pass: 'sushi', msg: 'landing.biz.sushi' },
  { id: 'bubble-tea', pass: 'boba', msg: 'landing.biz.boba' },
  { id: 'gelato', pass: 'gelato', msg: 'landing.biz.gelato' },
  { id: 'flowers', pass: 'bloom', msg: 'landing.biz.flowers' },
  { id: 'pets', pass: 'paws', msg: 'landing.biz.pets' },
  { id: 'burgers', pass: 'burger', msg: 'landing.biz.burgers' },
];
export const BIZ_BY_ID = Object.fromEntries(BIZ.map((b) => [b.id, b])) as Record<BizId, BizDef>;
const isBiz = (v: string | null): v is BizId => !!v && v in BIZ_BY_ID;
const KEY = 'biome.biz';

/** Accent for a pass: its body colour, or the label colour when the body is too light to read on white. */
export function accentOf(p: PassDef): string {
  const n = parseInt(p.bg.slice(1), 16);
  const lum = (0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255;
  return lum > 0.6 ? p.label : p.bg;
}

let current: BizId | null = null;
let synced = false;
const subs = new Set<() => void>();
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };

function apply() {
  const root = document.documentElement;
  if (current) root.style.setProperty('--biz-accent', accentOf(PASS_BY_SLUG[BIZ_BY_ID[current].pass]));
  else root.style.removeProperty('--biz-accent');
  if (current) root.setAttribute('data-biz', current); else root.removeAttribute('data-biz');
}
function sync() {
  if (synced) return;
  synced = true;
  let next: BizId | null = null;
  const q = new URLSearchParams(window.location.search).get('biz');
  if (isBiz(q)) next = q;
  else {
    try { const s = window.localStorage.getItem(KEY); if (isBiz(s)) next = s; } catch { /* storage blocked */ }
  }
  if (next !== current) { current = next; apply(); subs.forEach((f) => f()); }
}

/** Picks a business (or clears with null); updates the URL, localStorage and --biz-accent. */
export function setBiz(id: BizId | null) {
  synced = true;
  current = id;
  apply();
  try {
    const u = new URL(window.location.href);
    if (id) u.searchParams.set('biz', id); else u.searchParams.delete('biz');
    window.history.replaceState(null, '', u);
  } catch { /* ignore */ }
  try { if (id) window.localStorage.setItem(KEY, id); else window.localStorage.removeItem(KEY); } catch { /* ignore */ }
  subs.forEach((f) => f());
}

/** The chosen business, or null (server and first render are always null). */
export function useBiz(): BizDef | null {
  const id = useSyncExternalStore(subscribe, () => current, () => null);
  useEffect(sync, []);
  return id ? BIZ_BY_ID[id] : null;
}
