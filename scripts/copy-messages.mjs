// Copies messages/*.json to public/i18n/ so the static export can serve catalogs to the browser.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const src = path.join(root, 'messages');
const dest = path.join(root, 'public', 'i18n');
fs.rmSync(dest, { recursive: true, force: true });
fs.mkdirSync(dest, { recursive: true });
for (const f of fs.readdirSync(src)) {
  if (/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$/.test(f)) fs.copyFileSync(path.join(src, f), path.join(dest, f));
}
