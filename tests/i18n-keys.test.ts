import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(__dirname, '..');
const msgDir = path.join(root, 'messages');
const load = (f: string): Record<string, string> => JSON.parse(fs.readFileSync(path.join(msgDir, f), 'utf8'));
const en = load('en.json');
const enKeys = Object.keys(en);

function walk(dir: string, out: string[] = []): string[] {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else if (/\.(ts|tsx)$/.test(e.name)) out.push(p);
  }
  return out;
}
const files = ['app', 'components', 'lib'].flatMap((d) => walk(path.join(root, d)));
const rel = (f: string) => path.relative(root, f);

// A key exists if exact, or as plural base (key.one/key.other), or (for template keys) matches the pattern.
function exists(key: string): boolean {
  if (key in en) return true;
  if (`${key}.other` in en) return true;
  if (key.includes('${')) {
    const re = new RegExp('^' + key.split(/\$\{[^}]*\}/).map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('[^.]+') + '(\\.other)?$');
    return enKeys.some((k) => re.test(k));
  }
  return false;
}

describe('catalog keys used in code', () => {
  it('every literal key passed to t( / ApiError( exists in en.json', () => {
    const missing: string[] = [];
    for (const f of files) {
      const src = fs.readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\bt\(\s*(['"`])([a-zA-Z][\w.${}\-]*)\1/g)) {
        if (!m[2].includes('.')) continue;
        if (!exists(m[2])) missing.push(`${rel(f)}: ${m[2]}`);
      }
      for (const m of src.matchAll(/ApiError\(\s*\d+\s*,\s*'[^']*'\s*,\s*(['"`])([^'"`]+)\1/g)) {
        if (!exists(m[2])) missing.push(`${rel(f)}: ${m[2]}`);
      }
    }
    expect(missing).toEqual([]);
  });
});

const vars = (s: string) => [...new Set([...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]))].sort();

describe('locale parity', () => {
  const others = fs.readdirSync(msgDir).filter((f) => f.endsWith('.json') && f !== 'en.json');
  it('en.json is flat string map', () => {
    for (const v of Object.values(en)) expect(typeof v).toBe('string');
  });
  it.each(others.length ? others : ['(none)'])('%s has the key set and vars of en.json', (f) => {
    if (f === '(none)') return;
    const c = load(f);
    expect(Object.keys(c).sort()).toEqual([...enKeys].sort());
    for (const k of enKeys) expect(vars(c[k]), k).toEqual(vars(en[k]));
  });
});

describe('no hardcoded user-visible strings', () => {
  it('flags JSX text nodes and placeholder/title/aria-label/alt literals in app/ and components/', () => {
    const hits: string[] = [];
    for (const f of files.filter((x) => /\.tsx$/.test(x) && !rel(x).startsWith('lib'))) {
      const src = fs.readFileSync(f, 'utf8');
      // JSX text: >text< where text has letters and no braces
      for (const m of src.matchAll(/(?<=[\w"'}\/\s])>([^<>{}=;&()\n]*[A-Za-z]{2,}[^<>{}()\n]*)(?=<|\{)/g)) {
        const text = m[1].trim();
        if (!text) continue;
        // skip generics / type syntax / comparisons living in TS code
        if (/^[\w\s,|&\[\]'".:?]*$/.test(text) && /(extends|=>|Promise|Record|Array|Partial)/.test(text)) continue;
        const before = src.slice(0, m.index!);
        if (/<[A-Z]\w*$/.test(before.split('\n').pop() || '') && !/>$/.test(before.split('\n').pop() || '')) continue;
        hits.push(`${rel(f)}: text "${text}"`);
      }
      for (const m of src.matchAll(/\b(placeholder|title|aria-label|alt)\s*=\s*(?:"([^"]*[A-Za-z][^"]*)"|\{\s*['"`]([^'"`]*[A-Za-z][^'"`]*)['"`]\s*\})/g)) {
        hits.push(`${rel(f)}: ${m[1]}="${m[2] ?? m[3]}"`);
      }
    }
    expect(hits).toEqual([]);
  });
});
