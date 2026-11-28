# Biome

Digital stamp cards for small shops: customers keep a card on their phone, staff add stamps by QR/customer id, owners see statistics and send messages.

_Product name: Biome. Code identifiers, folders, env vars (`EVECOO_*`) and config keys keep the original `evecoo` name on purpose._

Frontend: Next.js static export. Backend: PHP 8.2+ with MySQL/MariaDB (SQLite for local work). Built for Hostinger Agency hosting.

## Run locally

Needs Node >= 22.13, PHP 8.2+ (with `pdo_sqlite`) and `zip`. No Docker, no database server.

```
npm ci
npm run build                 # static export -> out/
scripts/build-bundle.sh       # -> dist/public_html/ and dist/evecoo-hostinger.zip
EVECOO_CONFIG=$PWD/php/config.local.php php -S 127.0.0.1:8080 -t dist/public_html php/router.php
python3 /home/user/bench/accept.py http://127.0.0.1:8080   # optional end-to-end acceptance check
```

`npm run bundle` does build + bundle in one step. `php/router.php` is a dev-only stand-in for `deploy/htaccess.root`; `php/config.local.php` uses a SQLite file in the system temp dir and effectively disables rate limits.

## Tests

```
npm run typecheck && npm test                 # frontend (vitest: i18n)
cd php && composer install && vendor/bin/phpunit   # API, SQLite
EVECOO_TEST_DSN='mysql:host=127.0.0.1;dbname=evecoo;charset=utf8mb4' EVECOO_TEST_USER=u EVECOO_TEST_PASS=p vendor/bin/phpunit   # same suite on MariaDB/MySQL
```

Pages: `/` landing, `/login`, `/signup`, `/dashboard` (owner), `/staff` (stamp desk), `/join/<businessId>` (customer sign-up), `/card/<customerId>` (stamp card + QR).

## API


Errors: `{"error":"<code>","message":"<localized>"}`. Auth is `Authorization: Bearer <token>`. Check order: 401, 403, 400, 404, 409. Bodies over 64 KiB are rejected with 400.

| Route | Auth | Request | Success |
|---|---|---|---|
| POST `/api/auth/signup` | none | `{email,password(8-200),businessName}` | 201 `{token,businessId}` |
| POST `/api/auth/login` | none | `{email,password}` | 200 `{token,role}` |
| GET `/api/auth/me` | any | | `{email,role,businessId,businessName}` |
| GET / PUT `/api/card` | any / owner | `{name,reward,stampsRequired(2-20),color(#rrggbb)}` | `Card` |
| GET `/api/public/card/:businessId` | none | | `PublicCard` |
| POST / GET `/api/staff` | owner | `{email,password}` | 201 `{id}` / `[{id,email}]` |
| POST `/api/customers` | none | `{businessId,name,birthday?}` | 201 `{customerId,passUrl}` |
| GET `/api/pass/:customerId/apple` and `/google` | none | | pass JSON (mock) |
| POST `/api/stamps` | any | `{customerId}` | `{stamps,redeemable}` |
| POST `/api/redeem` | any | `{customerId}` | `{stamps:0}` (409 if not redeemable) |
| POST / GET `/api/messages` | owner | `{title,body}` | `{recipients}` / list |
| GET `/api/customers/:id/messages` | none | | message array |
| POST `/api/automations/run` | owner | optional `{now}` | `{sent}` (welcome, 30-day win-back, birthday) |
| GET `/api/stats` | owner | | `{customers,returning,returningPercent,visitsByHour[24],visitsByWeekday[7]}` |

Customer ids are unguessable (128-bit) and act as capabilities; a customer of another business is always 404.

## Architecture

- Frontend: Next.js 15 App Router, React 19, TypeScript, `output: 'export'`. No ORM, no i18n library, no CSS framework. Pages are static; `/card/<id>` and `/join/<id>` are served by the one prerendered `card/` and `join/` pages via a rewrite in the root `.htaccess`, and read the id from the URL in the browser.
- Backend: `php/api/` (PHP 8.2+, no Composer dependencies at runtime). `api/index.php` is the front controller; code lives in `api/_app/` (denied from the web, every file also exits unless `EVECOO` is defined). All SQL uses prepared statements and every tenant query is bound to `business_id`. One SQL dialect layer (`Db`) covers MySQL/MariaDB and SQLite.
- Passwords: Argon2id (or bcrypt over a SHA-256 pre-hash). Session tokens: 32 random bytes, only the SHA-256 is stored, 30-day expiry.
- Auth is client-side for pages (`/dashboard`, `/staff` redirect in the browser); the API enforces everything.
- i18n: flat catalog `messages/<locale>.json`, copied to `public/i18n/` at build (served to the browser) and into `api/_app/messages/` in the bundle (for API errors and automation texts). `en` is default and per-key fallback.

## Configuration

`config.php` is never committed or bundled. The API looks for, first readable wins: env `EVECOO_CONFIG`; `<parent of public_html>/evecoo-config.php` (preferred on Hostinger); `api/_app/config.php`. Copy `php/api/_app/config.sample.php` and set the database credentials.

### Rate limits

MySQL-backed fixed windows, `[limit, windowSeconds]`, overridable under `rate_limit` in the config (`enabled => false` only for tests). Exceeding a limit returns 429 `rate_limited` with `Retry-After`.

| Key | Default | Applies to |
|---|---|---|
| `login_ip` | 20 / 15 min | every login attempt per IP |
| `login_email` | 10 / 15 min | failed logins per email (cleared on success) |
| `signup_ip` | 10 / 1 h | signups per IP |
| `customer_ip` | 60 / 1 h | `POST /api/customers` per IP |
| `customer_business` | 500 / 24 h | `POST /api/customers` per business |

The client IP is `REMOTE_ADDR`; set `ip_header` (for example `HTTP_CF_CONNECTING_IP`) only behind a trusted proxy.

## Deploy to Hostinger Agency

1. Build the bundle: `npm ci && npm run bundle` (produces `dist/evecoo-hostinger.zip`; its root is the content of `public_html`).
2. In hPanel create a MySQL database and user (the app connects to `localhost`) and select PHP 8.2 or newer for the site.
3. Upload and extract the zip into the site's `public_html` (File Manager or `hostinger up dist/public_html --domain <domain>`).
4. Create `evecoo-config.php` in the directory above `public_html` from `config.sample.php` with the database name, user and a generated password. The schema is created automatically on the first request (marker `api/_app/var/schema-1.ok`; make `api/_app/var` writable).
5. Check `https://<domain>/api/health`, then run `python3 /home/user/bench/accept.py https://<domain>` against the live site (it creates test businesses).

Requirements: Apache or LiteSpeed with `mod_rewrite` and `.htaccess` enabled, PHP extensions `pdo_mysql` and `mbstring`.

## Adding a language


Drop `messages/<locale>.json` with exactly the keys and `{variables}` of `messages/en.json` (plural keys `.one`/`.other`). Nothing else changes: locales are discovered at runtime, the switcher appears, resolution is cookie `locale`, then `Accept-Language`, then `en`. `npm test` enforces key parity.

## Known limits

- No logout or session revocation on the server (logout only clears the browser token), no password reset, and staff accounts cannot be removed.
- Tokens live 30 days in `localStorage` (readable by any XSS), not in httpOnly cookies.
- Wallet pass issuance is a mock: the pass routes return plain JSON. Real Apple Wallet needs an Apple Developer Pass Type ID certificate and signed `.pkpass` files; Google Wallet needs an issuer account and a service account.
- Messages are only shown on the customer's card page; no email/push. Automations run only when triggered (`/api/automations/run`), there is no scheduler.
- Rate limiting is per IP and per email/business; there is no account lockout.
- This is an independent rebuild from a spec; the original Next/Vercel product's code is not copied.

## Hostinger Agency: verified deploy notes (first live deploy)
Found on the live Agency (h5g) site and handled in code:
- `.htaccess` is **not applied** (Hostinger CDN/web server in front). Unknown paths fall back to `index.html`, so:
  - the frontend calls the API as `/api/index.php/<route>` (the PHP router maps it to `/api/<route>`; plain `/api/...` still works locally and in tests);
  - card and join links use the query form `/card/?id=<id>` and `/join/?id=<id>`.
  - Security headers from `deploy/htaccess.root` (CSP, HSTS, X-Frame-Options) are therefore **not sent** on HTML; PHP JSON responses still carry their own headers.
- The writable file area is `public_html/` only, so the config lives at `public_html/api/_app/config.php`. PHP files there print nothing over HTTP; `.sql`, `.htaccess` and directory listings return 403.
- The real MySQL database **and** user name are `u<account>_<siteUid>_<name>` (e.g. `u966322207_bjE7Ylw3N_evecoo`), even though the API lists them as `<name>`. Host `localhost`.
- Upload with the file-browser TUS endpoint (`agency-hosting_files_generate-upload-url`), one file per path under `public_html/`, then clear the website cache. Errors go to `.h5g/php_error.log`.
