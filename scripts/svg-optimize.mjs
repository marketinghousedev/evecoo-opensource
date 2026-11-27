// npm run svg:optimize — runs SVGO (svgo.config.mjs) over public/illustrations in place,
// then regenerates the Illo index. Official store badges (brands/badge-*) stay untouched.
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { optimize } from 'svgo';
import config from '../svgo.config.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dir = path.join(root, 'public', 'illustrations');
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));

let before = 0, after = 0, n = 0;
for (const f of walk(dir)) {
  if (!f.endsWith('.svg') || path.relative(dir, f).split(path.sep).join('/').startsWith('brands/badge-')) continue;
  const src = fs.readFileSync(f, 'utf8');
  const out = optimize(src, { ...config, path: f }).data + '\n';
  before += Buffer.byteLength(src);
  after += Buffer.byteLength(out);
  n++;
  if (out !== src) fs.writeFileSync(f, out);
}
console.log(`svgo: ${n} files, ${(before / 1024).toFixed(1)} KB -> ${(after / 1024).toFixed(1)} KB`);
execFileSync(process.execPath, [path.join(root, 'scripts', 'gen-illo-index.mjs')], { stdio: 'inherit' });
