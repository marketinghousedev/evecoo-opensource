#!/usr/bin/env bash
# Build dist/public_html and dist/evecoo-hostinger.zip from out/ and php/api/.
# EVECOO_ROOT overrides the repo root (used for fixture tests).
set -euo pipefail

ROOT="${EVECOO_ROOT:-$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)}"
cd "$ROOT"

[ -d out ] || { echo "error: out/ not found; run 'next build' first" >&2; exit 1; }
[ -f out/index.html ] || { echo "error: out/index.html missing; incomplete export" >&2; exit 1; }
[ -f deploy/htaccess.root ] || { echo "error: deploy/htaccess.root missing" >&2; exit 1; }
[ -d php/api ] || { echo "error: php/api missing" >&2; exit 1; }
command -v zip >/dev/null || { echo "error: zip not installed" >&2; exit 1; }
command -v php >/dev/null || { echo "error: php not installed" >&2; exit 1; }

DIST="$ROOT/dist"
PUB="$DIST/public_html"
rm -rf "$DIST"
mkdir -p "$PUB"

cp -R out/. "$PUB/"
cp deploy/htaccess.root "$PUB/.htaccess"

# Hostinger Agency ignores .htaccess and its CDN sends `max-age=31536000` on HTML, so browsers would keep a page for a
# year. Serve every exported page through a tiny index.php (the server prefers it over index.html) that marks the HTML
# as revalidate-always. Hashed assets under _next/ keep their long cache.
while IFS= read -r -d '' html; do
  dir=$(dirname "$html")
  cat > "$dir/index.php" <<'PHP'
<?php
header('Content-Type: text/html; charset=utf-8');
header('Cache-Control: no-cache, must-revalidate');
header('X-Content-Type-Options: nosniff');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Frame-Options: SAMEORIGIN');
readfile(__DIR__ . '/page.html');
PHP
  mv "$html" "$dir/page.html"
done < <(find "$PUB" -name index.html -not -path "$PUB/api/*" -print0)

mkdir -p "$PUB/api"
cp -R php/api/. "$PUB/api/"
rm -f "$PUB/api/_app/config.php"
rm -rf "$PUB/api/_app/var"
mkdir -p "$PUB/api/_app/var"

rm -rf "$PUB/api/_app/messages"
mkdir -p "$PUB/api/_app/messages"
if [ -d messages ]; then
  cp messages/*.json "$PUB/api/_app/messages/"
fi

# Lint every PHP file
lint_fail=0
while IFS= read -r -d '' f; do
  php -l "$f" >/dev/null || { echo "error: php -l failed: $f" >&2; lint_fail=1; }
done < <(find "$PUB" -name '*.php' -print0)
[ "$lint_fail" -eq 0 ] || exit 1

# Forbidden content
bad=$(find "$PUB" \( -name 'config.php' -o -name 'config.local.php' -o -name vendor -o -name tests \
  -o -name 'router.php' -o -name '*.sqlite' -o -name '.env*' -o -name '*.map' \) -print)
if [ -n "$bad" ]; then
  echo "error: forbidden files in bundle:" >&2
  echo "$bad" >&2
  exit 1
fi

(cd "$PUB" && zip -qr ../evecoo-hostinger.zip .)
echo "bundle: $DIST/evecoo-hostinger.zip"
