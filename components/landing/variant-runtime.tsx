'use client';

import { Fragment, useEffect, useSyncExternalStore, type ReactNode } from 'react';
import { useT } from '@/components/I18nProvider';
import { SECTIONS } from './variants';
import './variants.css';

/* ---- state: one shared store, defaults on the server and for the first client render ---- */
type State = Record<string, string>;
const defaults = (): State => Object.fromEntries(Object.entries(SECTIONS).map(([s, d]) => [s, d.default]));
const SERVER: State = defaults();
let state: State = SERVER;
let synced = false;
const subs = new Set<() => void>();
const emit = () => subs.forEach((f) => f());
const subscribe = (f: () => void) => { subs.add(f); return () => { subs.delete(f); }; };
const has = (section: string, v: string | null): v is string => !!v && !!SECTIONS[section] && v in SECTIONS[section].variants;

/** Resolves ?all and ?<section>; a specific param beats `all`. */
function fromUrl(): State {
  const q = new URLSearchParams(window.location.search);
  const all = q.get('all');
  const next = defaults();
  for (const s of Object.keys(SECTIONS)) {
    const own = q.get(s);
    if (has(s, own)) next[s] = own;
    else if (has(s, all)) next[s] = all;
  }
  return next;
}
function sync() {
  if (synced) return;
  synced = true;
  state = fromUrl();
  emit();
}

/** Switches a section (or, with section "all", every section that has that variant) and updates the URL without reloading. */
export function setVariant(section: string | 'all', v: string) {
  const u = new URL(window.location.href);
  const next = { ...state };
  if (section === 'all') {
    for (const [s, d] of Object.entries(SECTIONS)) {
      u.searchParams.delete(s);
      if (v in d.variants) next[s] = v; else next[s] = d.default;
    }
    u.searchParams.set('all', v);
  } else if (has(section, v)) {
    next[section] = v;
    u.searchParams.set(section, v);
    document.documentElement.setAttribute(`data-${section}`, v);
  } else return;
  if (section === 'all') for (const [s, d] of Object.entries(SECTIONS)) if (v in d.variants) document.documentElement.setAttribute(`data-${s}`, v);
  state = next;
  window.history.replaceState(null, '', u);
  emit();
  if (section === 'hero') window.scrollTo(0, 0);
}

/** The active variant of a section. First render (server and hydration) is the registry default. */
export function useVariant(section: string, variants?: readonly string[]): string {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER);
  useEffect(sync, []);
  const v = snap[section] ?? SECTIONS[section]?.default ?? 'a';
  return variants && !variants.includes(v) ? (SECTIONS[section]?.default ?? variants[0]) : v;
}

/** Renders its children only while `section` is on variant `v`. */
export function Variant({ section, v, children }: { section: string; v: string; children: ReactNode }) {
  return useVariant(section) === v ? <>{children}</> : null;
}

/** Renders the active registered variant of a section. `data-vslot` / `data-v` let the pre-paint CSS hide the default. */
export function VariantSlot({ section }: { section: string }) {
  const def = SECTIONS[section];
  const v = useVariant(section);
  const C = def.variants[v] ?? def.variants[def.default];
  return <div data-vslot={section} data-v={v} style={{ display: 'contents' }}><C key={v} /></div>;
}

/** Joined active variants: use as a React key to re-run effects that scan the DOM after a switch. */
export function useVariantKey(): string {
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER);
  useEffect(sync, []);
  return Object.values(snap).join('');
}

/** Compact floating "Compare" panel: every section with more than one variant, segmented A/B buttons. */
export function ComparePanel() {
  const { t } = useT();
  const snap = useSyncExternalStore(subscribe, () => state, () => SERVER);
  useEffect(sync, []);
  const multi = Object.entries(SECTIONS).filter(([, d]) => Object.keys(d.variants).length > 1);
  if (!multi.length) return null;
  const letters = [...new Set(multi.flatMap(([, d]) => Object.keys(d.variants)))];
  return (
    <details className="cmp" data-testid="compare-panel">
      <summary aria-label={t('variants.compareLabel')}>
        <span>{t('variants.compare')}</span>
        <b aria-hidden="true">{multi.length}</b>
      </summary>
      <div className="cmp-body" role="group" aria-label={t('variants.compareLabel')}>
        {multi.map(([s, d]) => (
          <div className="cmp-row" key={s} role="group" aria-label={d.label}>
            <span>{d.label}</span>
            <span className="cmp-seg">
              {Object.keys(d.variants).map((v) => (
                <button key={v} type="button" aria-pressed={snap[s] === v} onClick={() => setVariant(s, v)}>{v.toUpperCase()}</button>
              ))}
            </span>
          </div>
        ))}
        {multi.length > 1 && (
          <div className="cmp-row cmp-all" role="group" aria-label={t('variants.all')}>
            <span>{t('variants.all')}</span>
            <span className="cmp-seg">
              {letters.map((v) => (
                <Fragment key={v}><button type="button" aria-pressed={multi.every(([s, d]) => (v in d.variants ? snap[s] === v : true))} onClick={() => setVariant('all', v)}>{v.toUpperCase()}</button></Fragment>
              ))}
            </span>
          </div>
        )}
      </div>
    </details>
  );
}
