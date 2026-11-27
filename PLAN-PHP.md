# PLAN-PHP: evecoo on Hostinger Agency (static export + PHP 8 + MySQL)

Target host runs only PHP (php-fpm), MySQL/MariaDB on localhost, and static files. No Node process.
Result: `next build` static export for the UI, all `/api/*` reimplemented in PHP 8.2+ (PDO), one zip to unpack into `public_html`.

Branch: `php-agency`. Reference implementation for every port is the Node code on `main`; read it with
`git show main:<path>` (the frontend task deletes it on this branch). Contract: `SPEC.md`, README "API" table,
`/home/user/bench/accept.py` (must score 33/33 against the PHP server).

Facts verified in this sandbox (do not re-check): PHP 8.3.6 CLI with `pdo_mysql`, `pdo_sqlite`, `mbstring`, `intl`,
`sodium`, `zip`, `PASSWORD_ARGON2ID`; composer, zip, python3, Node 22; docker CLI exists but **no daemon**;
no MySQL installed, but `apt-get update && apt-cache policy mariadb-server` shows candidate 10.11 (install itself not yet tried);
Playwright 1.63.0 with Chromium in `/opt/pw-browsers` (`PLAYWRIGHT_BROWSERS_PATH` is set).
Not verified: Hostinger's web server flavour (Apache vs LiteSpeed), whether a directory above `public_html` is writable,
whether argon2id is compiled in there. The design below works either way.

---

## 1. Fixed decisions

### 1.1 Deployable bundle (zip root = contents of `public_html`)

```
.htaccess                    root rewrites + headers (source: deploy/htaccess.root)
index.html, 404.html, login/index.html, signup/index.html, dashboard/index.html,
staff/index.html, card/index.html, join/index.html, _next/**, i18n/<locale>.json, *.txt (RSC payloads)
api/
  .htaccess                  everything -> index.php, pass Authorization
  index.php                  front controller (3 lines: define EVECOO, require _app/src/bootstrap.php, App::run())
  _app/
    .htaccess                "Require all denied" (+ legacy Deny from all in IfModule)
    src/*.php, src/routes/*.php
    messages/<locale>.json   copied from repo messages/ at bundle time
    schema/mysql.sql, schema/sqlite.sql
    config.sample.php
    var/                     writable; migration marker only (.htaccess deny inherited)
```

Protection of `_app` is layered, so it does not depend on `.htaccess` deny being honoured:
every file in `src/` starts with `defined('EVECOO') || exit;`, `config.php` only `return`s an array (empty output if
requested), and SQL/JSON files there contain no secrets.

Repo layout (new): `php/api/**` mirrors `api/**` above, `php/router.php` (dev only), `php/tests/**`, `php/composer.json`,
`php/phpunit.xml`, `php/config.local.php` (sqlite, committed, no secrets), `deploy/htaccess.root`,
`scripts/build-bundle.sh`, `scripts/copy-messages.mjs`, `e2e/**`.
`.gitignore` adds: `out/`, `dist/`, `php/vendor/`, `php/api/_app/config.php`, `php/api/_app/var/*`, `php/api/_app/messages/`, `public/i18n/`, `*.sqlite`.

### 1.2 Configuration and secrets

`config.php` is never in git and never in the zip. The orchestrator writes it at deploy time from `config.sample.php`.
Lookup order in `Config::load()` (first readable wins):
1. env `EVECOO_CONFIG` (dev, tests, `php -S`)
2. `dirname($_SERVER['DOCUMENT_ROOT']) . '/evecoo-config.php'` (outside web root; preferred on Hostinger)
3. `api/_app/config.php` (fallback inside the protected dir)

Missing config => generic 500. Shape:

```php
<?php return [
  'db' => ['dsn' => 'mysql:host=localhost;dbname=uXXX_evecoo;charset=utf8mb4', 'user' => '...', 'pass' => '...'],
  'ip_header' => null,          // e.g. 'HTTP_CF_CONNECTING_IP' only if a trusted proxy sits in front; default REMOTE_ADDR
  'rate_limit' => [             // [limit, windowSeconds]; these are the production defaults when a key is absent
    'enabled' => true,
    'login_ip' => [20, 900], 'login_email' => [10, 900],
    'signup_ip' => [10, 3600],
    'customer_ip' => [60, 3600], 'customer_business' => [500, 86400],
  ],
];
```
`php/config.local.php`: `dsn => 'sqlite:' . sys_get_temp_dir() . '/evecoo-dev.sqlite'`, all limits `[100000, 60]`.

### 1.3 URL handling

Root `.htaccess` (only `mod_rewrite` is required; headers/expires blocks are wrapped in `<IfModule>`):
```
Options -Indexes
ErrorDocument 404 /404.html
RewriteEngine On
RewriteRule ^api/ - [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^card/[^/]+/?$ card/index.html [L]
RewriteCond %{REQUEST_FILENAME} !-f
RewriteRule ^join/[^/]+/?$ join/index.html [L]
RewriteCond %{DOCUMENT_ROOT}/$1/index.html -f
RewriteRule ^(.+[^/])$ $1/index.html [L]
# IfModule mod_headers: X-Content-Type-Options nosniff, Referrer-Policy same-origin, X-Frame-Options DENY;
#   Cache-Control "public, max-age=31536000, immutable" for ^_next/static/, "no-cache" for *.html
```
`api/.htaccess`:
```
RewriteEngine On
RewriteRule .* - [E=HTTP_AUTHORIZATION:%{HTTP:Authorization}]
RewriteRule ^ index.php [L]
```
PHP reads the token from `HTTP_AUTHORIZATION`, then `REDIRECT_HTTP_AUTHORIZATION`, then `getallheaders()` (php-fpm often strips the header; all three must be tried).
The request path is taken from `REQUEST_URI` (query string stripped, `rawurldecode` per segment), never from `PATH_INFO`.

`php/router.php` reproduces exactly these rules for `php -S` (api -> `api/index.php`; existing file -> `return false`;
`/x` -> `x/index.html`; `/card/<id>`, `/join/<id>` -> shell page; else `404.html` with status 404; never serves `api/_app/**`).

### 1.4 Frontend static export

- `next.config.ts`: `output: 'export'` and `trailingSlash: true` when `NODE_ENV === 'production'`; in dev only, `rewrites()`:
  `/api/:path*` -> `http://127.0.0.1:8080/api/:path*`, `/card/:id` -> `/card`, `/join/:id` -> `/join`. Build output: `out/`.
- Delete on this branch: `app/api/**`, `instrumentation.ts`, `lib/{db,auth,accounts,card,loyalty,messages,automations,stats,pass,http,validate,i18n-server}.ts`,
  `tests/{accounts,auth,engage,loyalty,security}.test.ts`, `tests/helpers.ts`, `Dockerfile`, `.dockerignore`, `fly.toml`, `render.yaml`. Keep `lib/types.ts`, `lib/client.ts`, `lib/i18n.ts`.
- Dynamic routes become shell pages. `app/card/[id]/` -> `app/card/` and `app/join/[businessId]/` -> `app/join/` (CSS modules move with them), both `'use client'`.
  The id comes from new `lib/route-id.ts`: `useRouteId(prefix: 'card' | 'join'): string | null` = after mount, the first path segment after `/<prefix>/`
  from `window.location.pathname` (URI-decoded), else `?id=`; `null` before mount. Public URLs stay `/card/<id>` and `/join/<id>` (API `passUrl` unchanged).
  Navigation to these two uses `window.location.assign(url)`, not `router.push` (no RSC payload exists for the id path).
  If Playwright shows a hydration/router error on the rewritten URL, the fixed fallback is: change the two rewrite rules to
  `[R=302,L]` redirects onto `/card/?id=<id>` and `/join/?id=<id>`; nothing else changes.
- Card page data (was server-side): `GET /api/pass/<id>/google` gives `customerName, businessName, cardName, reward, stamps, stampsRequired, color, redeemable`;
  `GET /api/customers/<id>/messages` for messages (failure => empty list); QR via `qrcode` in the browser (`QRCode.toString(id, {type:'svg', margin:1})`).
  States: loading (`common.loading`), 404 (`errors.notFound`), network (`errors.network`). No new catalog keys.
- i18n moves to the client, markup unchanged:
  - `lib/i18n.ts` becomes pure (no `fs`): `translate`, `resolveLocale(available, {cookie, acceptLanguage})`, `cookieValue`, formatters.
    New `lib/i18n-build.ts` (build-time only, uses `fs`): `availableLocales()`, `getMessages(locale)`.
  - `app/layout.tsx` (sync server component, runs at build): static `metadata` from the `en` catalog, `<html lang="en">`,
    passes `locales` and the inlined `en` catalog to `I18nProvider`.
  - `I18nProvider`: first render always `en` (matches prerender, no hydration mismatch). In `useEffect` it resolves
    cookie `locale` -> `navigator.languages` -> `en`; if not `en`, fetches `/i18n/<locale>.json`, merges over `en`, then sets
    `document.documentElement.lang` and `document.title`. A brief English flash for other locales is accepted.
  - `scripts/copy-messages.mjs` (npm `prebuild` and `predev`) copies `messages/*.json` to `public/i18n/`.
  - All landing server components that call `getServerI18n()` (`app/page.tsx`, `components/landing/{Chrome,Hero,Features,HowItWorks,Bento,Service,DashPreview,PricingFaq}.tsx`)
    become client components: add `'use client'`, drop `async`, replace `await getServerI18n()` with `useT()`. No JSX, class or CSS changes.
  - `LocaleSwitcher` keeps writing the `locale` cookie and reloading; the same cookie reaches PHP for error messages.
  Adding a language is still "drop `messages/<locale>.json`, rebuild".
- `next/font/google` and the Material Symbols `<link>` stay as they are.

### 1.5 MySQL schema (`schema/mysql.sql`; MySQL 8 / MariaDB 10.6+)

All tables `ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`, all statements `CREATE TABLE IF NOT EXISTS`.
`ID` below means `VARCHAR(22) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin` (ids are case-sensitive capabilities; a `_ci` collation would be a security bug).
`TS` means `CHAR(24) COLLATE utf8mb4_bin` holding `YYYY-MM-DDTHH:MM:SS.mmmZ` UTC, exactly as today (string order = time order; no MySQL time zone involved).

| Table | Columns | Keys |
|---|---|---|
| `businesses` | `id ID`, `name VARCHAR(100)`, `locale VARCHAR(35) DEFAULT 'en'`, `card_name VARCHAR(60)`, `card_reward VARCHAR(100)`, `stamps_required TINYINT UNSIGNED DEFAULT 10`, `card_color CHAR(7) DEFAULT '#1F6F5B'`, `created_at TS` | PK `id` |
| `users` | `id ID`, `business_id ID`, `email VARCHAR(254)`, `password_hash VARCHAR(255)`, `role ENUM('owner','staff')`, `created_at TS` | PK `id`; UNIQUE `email` (case-insensitive via `_ci`); KEY `(business_id, role)`; FK business |
| `sessions` | `token_hash CHAR(64) COLLATE utf8mb4_bin`, `user_id ID`, `created_at TS`, `expires_at TS` | PK `token_hash`; KEY `expires_at`; FK user |
| `customers` | `id ID`, `business_id ID`, `name VARCHAR(80)`, `birthday CHAR(10) NULL`, `stamps INT UNSIGNED DEFAULT 0`, `created_at TS` | PK `id`; KEY `business_id`; FK business |
| `stamp_events` | `id BIGINT UNSIGNED AUTO_INCREMENT`, `customer_id ID`, `business_id ID`, `kind ENUM('stamp','redeem')`, `created_at TS` | PK `id`; KEY `(business_id, kind)`; KEY `(customer_id, kind, created_at)`; FK customer |
| `messages` | `id ID`, `seq BIGINT UNSIGNED AUTO_INCREMENT`, `business_id ID`, `title VARCHAR(200)`, `body VARCHAR(1000)`, `kind ENUM('broadcast','winback','birthday','welcome')`, `created_at TS` | PK `id`; UNIQUE `seq`; KEY `(business_id, created_at)`; FK business |
| `message_recipients` | `message_id ID`, `customer_id ID` | PK `(message_id, customer_id)`; KEY `customer_id`; FK both |
| `automation_log` | `customer_id ID`, `kind VARCHAR(16) COLLATE utf8mb4_bin`, `day CHAR(10)` | PK `(customer_id, kind, day)`; FK customer |
| `rate_limits` | `bucket CHAR(64) COLLATE utf8mb4_bin`, `window_start INT UNSIGNED`, `hits INT UNSIGNED` | PK `bucket`; KEY `window_start` |

All columns `NOT NULL` except `customers.birthday`. `messages.title/body` are wider than the broadcast limits because automation texts interpolate names.
`ORDER BY m.created_at DESC, m.rowid DESC` becomes `ORDER BY m.created_at DESC, m.seq DESC`.
`schema/sqlite.sql` is the same model in SQLite types (`CHECK` instead of `ENUM`; `messages(seq INTEGER PRIMARY KEY AUTOINCREMENT, id TEXT NOT NULL UNIQUE, ...)`; `users.email COLLATE NOCASE`).

Migration: `Db::migrate()` runs the dialect's schema file (split on `;\n`) when marker `_app/var/schema-1.ok` is absent, then writes it.
If `var/` is not writable it runs each request (idempotent, still correct). No install script is exposed over HTTP.

### 1.6 PHP conventions

- PHP 8.2+, `declare(strict_types=1)`, namespace `Evecoo`, **zero runtime dependencies** (no composer autoload in the bundle);
  `bootstrap.php` registers a 5-line autoloader `Evecoo\X` -> `src/X.php` and loads every `src/routes/*.php` via `glob`.
- `bootstrap.php`: `ini_set('display_errors','0')`, `date_default_timezone_set('UTC')`, `set_error_handler` -> `ErrorException`.
- PDO: `ERRMODE_EXCEPTION`, `EMULATE_PREPARES=false`, `STRINGIFY_FETCHES=false`, `FETCH_ASSOC`; MySQL init
  `SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci, time_zone='+00:00', sql_mode='STRICT_ALL_TABLES'`; SQLite `PRAGMA foreign_keys=ON; PRAGMA busy_timeout=5000`.
  Only prepared statements with bound parameters; every tenant query binds `business_id`. Row mappers cast ints with `(int)`.
- Dialect layer is exactly these `Db` members (driver from the DSN prefix); all other SQL is written once and must run on both:
  `insertIgnore()`, `forUpdate()` (`' FOR UPDATE'` on mysql, `''` on sqlite), `upsertHit()` (rate limit), `tx()` (`BEGIN IMMEDIATE` on sqlite; on mysql retry up to 3x on SQLSTATE 40001), `isUniqueViolation()` (SQLSTATE 23000).
- php-fpm is multi-process (the Node app was single-process): `Loyalty::addStamp/redeem` must read the customer row with `Db::forUpdate()` inside `Db::tx()`.
- Responses: `json_encode(..., JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES)`, headers `content-type: application/json; charset=utf-8`,
  `cache-control: no-store`, `x-content-type-options: nosniff`. Errors: `{"error":code,"message":localized}`.
- Check order per route stays 401, 403, 400, 404, 409; rate limit (429) is checked first on the three limited routes.
- Unknown `/api` path: 404 `not_found`. Known path, wrong method: 405 `method_not_allowed` with `Allow` header.
- Any uncaught `Throwable`: `error_log('evecoo: ' . get_class($e) . ': ' . $e->getMessage())`, response 500 `{"error":"internal","message":t('errors.internal')}`. Never echo exception text.
- Body: 400 `validation_error` / `errors.invalidJson` if `CONTENT_LENGTH > 65536` or more than 65536 bytes are read from `php://input` (read at most 65537).
  Empty/whitespace body => `[]`. Decode with `json_decode($s, false)`; top level must be `stdClass` (then cast to array), anything else => 400.
- Validation parity with `main:lib/validate.ts` and `lib/accounts.ts`:
  `Validate::len()` counts UTF-16 code units (`strlen(mb_convert_encoding($s,'UTF-16LE','UTF-8'))/2`);
  `Validate::trim()` strips Unicode whitespace (`/^[\p{Z}\s\x{FEFF}]+|[\p{Z}\s\x{FEFF}]+$/u`);
  `int` accepts PHP `int`, or `float` that is finite and integral (JSON `3.0`), never strings or bools;
  email is trimmed, lowercased, max 254, regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`; color `^#[0-9a-fA-F]{6}$`; date regex + `checkdate`;
  passwords are not trimmed (signup/staff 8..200, login any string).
- Time: `Time::nowIso()` = UTC with milliseconds and `Z`. `Time::parseNow(mixed $v): int` (epoch ms): must be a string matching
  `^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2}(\.\d{1,9})?)?)?(Z|[+-]\d{2}:?\d{2})?$`, real calendar date, missing offset = UTC, fraction truncated to ms,
  UTC year 1970..9999; otherwise 400 `errors.validation.now` `{field:'now'}`. Absent `now` => current time.
  Automations port `main:lib/automations.ts` literally: `day` = UTC `YYYY-MM-DD` of `now`; birthday = UTC month-day with the 02-29 -> 02-28 rule;
  win-back when `ms(lastStamp) < now - 30d` and no `winback` log row with `day > substr(lastStamp,0,10)`; welcome once ever; messages get `created_at = now`.
- Stats buckets: `(new DateTimeImmutable($iso))->setTimezone(new DateTimeZone('Europe/Berlin'))`, hour `format('G')`, weekday index `format('N') - 1` (Mon=0).
  `returningPercent = (int) floor($returning / $customers * 100 + 0.5)`, 0 when no customers.
- i18n: `I18n` reads `_app/messages/*.json` (locale list = file names matching `^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*\.json$`), `en` is default and per-key fallback,
  `{var}` interpolation identical to `lib/i18n.ts`, unknown key returns the key. Request locale: cookie `locale`, then `Accept-Language` (q-sorted, exact then base tag), then `en`.
  Signup stores the request locale in `businesses.locale`; automation texts and default card name/reward use that locale. The locale string never reaches the filesystem unless it is in the discovered list.
  `messages/en.json` gains exactly two keys: `errors.rateLimited` ("Too many attempts. Please wait a moment and try again.") and `errors.methodNotAllowed` ("This action is not supported.").

### 1.7 Security properties (must hold; S1 verifies)

- Passwords: `password_hash` with `PASSWORD_ARGON2ID` when defined, else `PASSWORD_BCRYPT` (cost 12) over `base64_encode(hash('sha256', $pw, true))`
  (avoids bcrypt's 72-byte truncation). `verifyPassword` picks the pre-hash path from the stored prefix (`$2y$`). `password_needs_rehash` is not used.
- Login for an unknown email runs one `password_hash()` of the supplied password and discards it (equal work), then 401 `invalid_credentials`. Same response for wrong password.
- Tokens: `Ids::token()` = base64url of 32 random bytes (`random_bytes`); only `hash('sha256', $token)` is stored; 30-day expiry checked in SQL
  (`expires_at > nowIso`); expired rows purged on each login. Header regex `^Bearer\s+(\S+)$` (case-insensitive).
- Ids: base64url of 16 random bytes; customer ids are capabilities. A customer of another business is always 404.
- Roles: `Auth::requireUser($req, 'owner')` => 403 for staff; `Accounts::createStaff` re-checks the role.
- Rate limiting (fixed window, MySQL-backed, atomic single-statement upsert, then read `hits`):
  bucket = `hash('sha256', "$name|$subject")`, `window_start = intdiv(time(), $window) * $window`;
  upsert sets `hits = hits + 1` when `window_start` matches, else resets to 1 with the new `window_start`
  (MySQL `ON DUPLICATE KEY UPDATE hits = IF(window_start = VALUES(window_start), hits + 1, 1), window_start = VALUES(window_start)` in that order; SQLite `ON CONFLICT(bucket) DO UPDATE` with `CASE`).
  `hits > limit` => `ApiError(429, 'rate_limited', 'errors.rateLimited')` with `Retry-After: <seconds to window end>`.
  Applied: login `login_ip` (every attempt, before reading the body) and `login_email` (subject = lowercased email, counted on **failed** attempts only, checked before password verification, cleared on success);
  signup `signup_ip`; `POST /api/customers` `customer_ip` then `customer_business` (subject = businessId, after validation, before insert).
  Subject IP = `REMOTE_ADDR` unless `ip_header` is configured. One request in 100 deletes rows with `window_start < time() - 86400`. `enabled=false` turns it off (tests only).
- No CORS headers (same origin). Bearer token in a header, so no CSRF surface. No endpoint reveals config, schema or stack traces.

### 1.8 PHP modules and signatures (`php/api/_app/src/`)

All classes are `final` with static methods unless noted. `array` user = `['id','email','role','businessId','businessName']`.

```php
// Core (task B0)
final class Request  { public function __construct(public string $method, public string $path, public array $headers /* lowercase names */, public string $body, public string $ip, public int $declaredLength = 0) {} public function header(string $name): ?string; }
final class Response { public function __construct(public int $status, public mixed $data, public array $headers = []) {} }
final class ApiError extends \Exception { public function __construct(public int $status, public string $errorCode, public string $messageKey, public array $vars = [], public array $headers = []) }
App::run(): void                                   // globals -> Request -> handle() -> emit
App::handle(Request $r): Response                  // routing, error mapping; pure, used by tests
App::route(string $method, string $pattern, callable $handler): array   // helper used by routes/*.php; pattern like '/api/pass/{customerId}/apple'
// routes/*.php: return [ App::route('POST', '/api/x', fn(Request $r, array $params): Response => ...), ... ];
Config::load(): array;  Config::get(string $dotPath, mixed $default = null): mixed;  Config::reset(): void
Db::pdo(): \PDO;  Db::driver(): string;  Db::migrate(): void;  Db::reset(): void
Db::run(string $sql, array $params = []): \PDOStatement;  Db::one(string $sql, array $params = []): ?array;  Db::all(string $sql, array $params = []): array
Db::tx(callable $fn): mixed;  Db::insertIgnore(string $table, array $row): int;  Db::forUpdate(): string;  Db::isUniqueViolation(\Throwable $e): bool
Http::readJson(Request $r): array;  Http::json(mixed $data, int $status = 200): Response
I18n::locales(): array;  I18n::resolve(?string $cookie, ?string $acceptLanguage): string;  I18n::fromRequest(Request $r): string;  I18n::t(string $locale, string $key, array $vars = []): string
Validate::str(array $o, string $key, int $min = 1, int $max = 200): string;  Validate::int(array $o, string $key, int $min, int $max): int
Validate::email(array $o, string $key): string;  Validate::hexColor(array $o, string $key): string;  Validate::isoDate(array $o, string $key): ?string
Validate::newPassword(array $o, string $key = 'password'): string;  Validate::anyPassword(array $o, string $key = 'password'): string;  Validate::len(string $s): int;  Validate::trim(string $s): string
Time::nowIso(): string;  Time::nowMs(): int;  Time::toIso(int $ms): string;  Time::isoToMs(string $iso): ?int;  Time::parseNow(mixed $v): int
Ids::new(): string;  Ids::token(): string
Auth::hashPassword(string $pw): string;  Auth::verifyPassword(string $pw, string $stored): bool;  Auth::burn(string $pw): void
Auth::createSession(string $userId): string;  Auth::getUser(Request $r): ?array;  Auth::requireUser(Request $r, ?string $role = null): array
RateLimit::hit(string $name, string $subject): void   // limits from Config 'rate_limit.<name>'; throws ApiError 429
RateLimit::check(string $name, string $subject): void // throws if already over, does not count;  RateLimit::clear(string $name, string $subject): void

// Accounts (task B1) + routes/auth.php: POST /api/auth/signup, POST /api/auth/login, GET /api/auth/me, POST|GET /api/staff, GET /api/health
Accounts::signup(array $i /* email,password,businessName */, string $locale): array   // ['token','businessId']
Accounts::login(array $i /* email,password */): array                                 // ['token','role']
Accounts::createStaff(array $owner, array $i): array                                  // ['id']
Accounts::listStaff(string $businessId): array                                        // [['id','email'],...]

// Loyalty (task B2) + routes/loyalty.php: GET|PUT /api/card, GET /api/public/card/{businessId}, POST /api/customers, POST /api/stamps, POST /api/redeem, GET /api/pass/{customerId}/apple|google
Card::getPublic(string $businessId): array;  Card::get(string $businessId): array;  Card::update(string $businessId, array $card): array
Loyalty::createCustomer(array $i /* businessId,name,birthday? */): array   // ['customerId','passUrl' => '/card/<id>']
Loyalty::addStamp(string $businessId, string $customerId): array           // ['stamps','redeemable']
Loyalty::redeem(string $businessId, string $customerId): array             // ['stamps' => 0]
Loyalty::customerView(string $customerId): ?array
Pass::build(string $customerId, string $platform): array                   // same 11 fields as main:lib/pass.ts, no birthday

// Engage (task B3) + routes/engage.php: POST|GET /api/messages, GET /api/customers/{id}/messages, POST /api/automations/run, GET /api/stats
Messages::deliver(string $businessId, string $kind, string $title, string $body, array $customerIds, string $createdAt): string
Messages::sendBroadcast(string $businessId, array $i): array;  Messages::listForBusiness(string $businessId): array;  Messages::listForCustomer(string $customerId): array
Automations::run(string $businessId, int $nowMs): array                    // ['sent' => n]
Stats::get(string $businessId): array
```
Field names, status codes and limits of every route are those of the route files on `main` (`git show main:app/api/<...>/route.ts`).

### 1.9 Local development and tests

- **Database for local work: SQLite through the dialect layer** (`pdo_sqlite`), because docker has no daemon here. This is the default for PHPUnit and `php -S`.
- **MariaDB check (integration task only):** `apt-get install -y mariadb-server`, start `mariadbd-safe` bound to 127.0.0.1, create db/user, then rerun PHPUnit and accept.py with a MySQL config.
  If the package cannot be installed or started in the sandbox, I1 records that, and the orchestrator's post-deploy `accept.py https://<domain>` is the MySQL gate.
- PHP tests: PHPUnit 11 as dev dependency in `php/` (`composer install` there; `vendor/` never bundled). Tests call `App::handle(new Request(...))` in-process
  against a fresh SQLite file per test class; `EVECOO_TEST_DSN`/`_USER`/`_PASS` switch the same suite to MariaDB (tables truncated per test).
  `php/tests/Support/TestCase.php` provides `req(method, path, ?array body, ?string token, array headers = []): Response`,
  `seedBusiness()`, `seedCustomer()`, `seedStamp($businessId, $customerId, $iso)` (ports of `main:tests/helpers.ts`), and `setLimits(array)`.
  Each backend task ports the matching vitest cases from `main:tests/*.test.ts`.
- Frontend: `npm run typecheck`, `npm test` (remaining vitest i18n tests), `npm run build`.
- Full stack locally (also how accept.py runs):
  ```
  npm ci && npm run build                      # -> out/
  scripts/build-bundle.sh                      # -> dist/public_html/ and dist/evecoo-hostinger.zip
  EVECOO_CONFIG=$PWD/php/config.local.php php -S 127.0.0.1:8080 -t dist/public_html php/router.php &
  python3 /home/user/bench/accept.py http://127.0.0.1:8080      # expect {"score": 33, "total": 33, "failed": []}
  ```
- Playwright (`e2e/`, `@playwright/test` pinned to 1.63.0, uses the preinstalled Chromium; never run `playwright install`): base URL `http://127.0.0.1:8080`.

### 1.10 Build artifact

`scripts/build-bundle.sh` (bash, `set -euo pipefail`; assumes `out/` exists, fails with a clear message otherwise):
clean `dist/`; copy `out/` to `dist/public_html/`; copy `deploy/htaccess.root` to `.htaccess`; copy `php/api/` to `dist/public_html/api/`
excluding `config.php` and `var/*`; copy `messages/*.json` to `api/_app/messages/`; `php -l` every PHP file;
fail if the tree contains `config.php`, `config.local.php`, `vendor`, `tests`, `router.php`, `*.sqlite`, `.env*`, or `.map` files; then `cd dist/public_html && zip -qr ../evecoo-hostinger.zip .`.
npm script `bundle` = `next build && scripts/build-bundle.sh`.

Artifact handed to the orchestrator: `dist/evecoo-hostinger.zip`. Deploy steps (orchestrator, not a task): create MySQL db + user; select PHP 8.2+;
unzip into `public_html`; write `config.php` (section 1.2) with a generated password; request `/api/health`; run `accept.py https://<domain>`.

---

## 2. Tasks

Parallel groups: **wave 1** = B0, F1, T1 (start together). **wave 2** = B1, B2, B3 (after B0, together). Then I1, then S1.
Every task works on branch `php-agency` (or a worktree of it), touches only its owned files, and ends with its acceptance commands passing.
All briefs assume the implementer has read sections 1.1 to 1.10.

| id | model | depends | owned files | budget |
|---|---|---|---|---|
| B0 | opus | - | `php/api/index.php`, `php/api/.htaccess`, `php/api/_app/.htaccess`, `php/api/_app/config.sample.php`, `php/api/_app/schema/*`, `php/api/_app/src/{bootstrap,App,Request,Response,ApiError,Config,Db,Http,I18n,Validate,Time,Ids,Auth,RateLimit}.php`, `php/config.local.php`, `php/composer.json`, `php/phpunit.xml`, `php/tests/Support/**`, `php/tests/Core/**`, `messages/en.json`, `.gitignore` | 160k |
| F1 | sonnet | - | `next.config.ts`, `package.json`, `package-lock.json`, `app/**`, `components/**`, `lib/**`, `instrumentation.ts`, `tests/**`, `vitest.config.ts`, `scripts/copy-messages.mjs`, `Dockerfile`, `.dockerignore`, `fly.toml`, `render.yaml` | 150k |
| T1 | sonnet | - | `scripts/build-bundle.sh`, `deploy/htaccess.root`, `php/router.php` | 50k |
| B1 | opus | B0 | `php/api/_app/src/Accounts.php`, `php/api/_app/src/routes/auth.php`, `php/tests/Accounts/**` | 90k |
| B2 | sonnet | B0 | `php/api/_app/src/{Card,Loyalty,Pass}.php`, `php/api/_app/src/routes/loyalty.php`, `php/tests/Loyalty/**` | 90k |
| B3 | sonnet | B0 | `php/api/_app/src/{Messages,Automations,Stats}.php`, `php/api/_app/src/routes/engage.php`, `php/tests/Engage/**` | 100k |
| I1 | sonnet | all above | `e2e/**`, `playwright.config.ts`, `README.md`, `.env.example`; may make minimal fixes in any file, each listed in its report | 160k |
| S1 | opus | I1 | `SECURITY-REVIEW-PHP.md`; minimal fixes in `php/**`, `deploy/**` with a test for each | 80k |

### B0: PHP core, schema, auth and rate-limit primitives (opus)
Build everything under "Core (task B0)" in 1.8 with the rules of 1.2, 1.5, 1.6, 1.7, plus both schema files, `Db::migrate()`, the three server files of 1.1/1.3 under `php/api/`,
`config.sample.php`, `config.local.php`, PHPUnit setup and `tests/Support/TestCase.php` (1.9), the two new keys in `messages/en.json`, and the `.gitignore` lines of 1.1.
`I18n` reads `_app/messages/` if present, else the repo's `messages/` (so tests run without a bundle). `App` discovers routes by `glob('routes/*.php')`; with no route files it must still answer 404 JSON.
References: `main:lib/{db,http,auth,validate,i18n}.ts`, `main:tests/{auth,security,i18n}.test.ts`.
Acceptance: `cd php && composer install && vendor/bin/phpunit` green, covering at least: password hash/verify (both algorithms, >72-byte passwords differ under bcrypt path),
session create/lookup/expiry, token stored only hashed, Bearer parsing from all three header sources, body cap (declared and actual), non-object JSON => 400,
every validator incl. UTF-16 length and float-integral ints, `Time::parseNow` accept/reject table (accept.py's microsecond form, `2027-06-15T09:00:00Z`, bad year, non-string),
locale resolution, unknown path 404, wrong method 405, thrown `RuntimeException('secret')` => 500 body without `secret`,
rate limit: limit N allows N then 429 with `Retry-After`, window rollover resets, `clear()` works, disabled config bypasses; migrate is idempotent; a test asserting every `errors.*` key used in `php/` exists in `en.json`.
`php -l` clean on all files. Report any deviation from the signatures in 1.8 (B1 to B3 code against them).

### F1: static export conversion (sonnet)
Implement 1.4 exactly; visual output, class names, CSS and animations must not change. Do not edit `messages/en.json` (B0 owns it).
Update `tests/i18n.test.ts` and `tests/i18n-keys.test.ts` for the split `lib/i18n.ts` / `lib/i18n-build.ts` and the removed server code; keep key-existence, locale-parity and hard-coded-string checks.
Scripts: `prebuild`/`predev` run `copy-messages.mjs`; add `bundle` (1.10); drop `start`. Delete only the files listed in 1.4.
Acceptance: `npm run typecheck`, `npm test`, `npm run build` all pass; `out/` contains `index.html` (containing `29`), `404.html`, `login/index.html`, `signup/index.html`,
`dashboard/index.html`, `staff/index.html`, `card/index.html`, `join/index.html`, `i18n/en.json`; `grep -r "next/headers\|force-dynamic\|node:sqlite" app components lib` is empty;
before/after screenshots of `/` at 1440 and 390 px width (serve `out/` with any static server) show no visual difference, stated in the report.

### T1: bundle script, root .htaccess, dev router (sonnet)
Write `deploy/htaccess.root` (1.3), `php/router.php` (1.3) and `scripts/build-bundle.sh` (1.10). The router must set correct `Content-Type` for `.html`, `.txt`, `.json`, `.js`, `.css`, fonts and images when it serves a rewritten path itself.
Acceptance: with a hand-made fixture tree (fake `out/` with the pages of F1 and a stub `php/api/index.php` echoing JSON), the script produces the zip, the zip listing matches 1.1 and contains none of the forbidden files,
and under `php -S ... php/router.php`: `/`, `/login`, `/login/`, `/card/abc`, `/join/abc` return 200, `/nope` returns 404 with the 404 page, `/api/x` reaches `api/index.php`, `/api/_app/config.sample.php` is not served. `bash -n` and `shellcheck` (if present) clean.

### B1: accounts and auth routes (opus)
Port `main:lib/accounts.ts` and the `auth/*`, `staff`, `health` routes to `Accounts.php` + `routes/auth.php` using B0's primitives, with the rate-limit rules of 1.7 for login and signup.
Signup: duplicate email => 409 `email_taken` both by pre-check and by catching the unique violation; business + owner inserted in one `Db::tx`.
Acceptance (`vendor/bin/phpunit --testsuite Accounts`, port of `main:tests/accounts.test.ts` plus): signup 201 shape, duplicate 409 (also different case), login owner/staff, wrong password and unknown email both 401 with identical body,
short wrong password is 401 not 400, missing fields 400, `me` 401/200, staff create 201 / staff caller 403 / duplicate 409, staff list scoped to the owner's business,
login 429 after `login_ip` limit and after `login_email` failures, successful login clears the email counter, signup 429 after `signup_ip`, default card texts come from the request locale.

### B2: card, customers, stamps, redeem, pass (sonnet)
Port `main:lib/{card,loyalty,pass}.ts` and their routes to the files owned, with `FOR UPDATE` locking (1.6) and the customer rate limits (1.7).
Acceptance (`--testsuite Loyalty`, port of `main:tests/loyalty.test.ts` and the tenant/pass cases of `security.test.ts`): card GET any role, PUT owner only (staff 403), invalid `stampsRequired`/color 400, auth is checked before validation;
public card 404 for unknown business; customer create 201 with `passUrl`, bad birthday 400, unknown business 404, 429 on both customer limits; stamps increment, cap at `stampsRequired`, `redeemable` flag;
redeem resets to 0 and second redeem is 409; other tenant's customer is 404 for stamp and redeem (owner and staff); pass JSON has exactly the 11 fields and no birthday; unknown customer pass 404; integers are JSON numbers.

### B3: messages, automations, stats (sonnet)
Port `main:lib/{messages,automations,stats}.ts` and their routes. Seed customers and stamps through `TestCase` helpers (do not depend on B2's classes).
Acceptance (`--testsuite Engage`, port of `main:tests/engage.test.ts`): broadcast returns recipient count and only reaches the caller's customers; list is owner-only and newest first with stable order for equal timestamps;
customer messages 404 for unknown customer; automations: welcome once ever, win-back only after >30 days and not repeated until a newer stamp, birthday on UTC month-day incl. the 02-29 rule, second run same `now` returns `sent: 0`,
bad `now` 400 after the 401/403 checks, the exact accept.py sequence (3 stamps, redeem, run at now+40d => >=1, rerun => 0, run at `2027-06-15T09:00:00Z` with birthday `1990-06-15` => >=1);
stats: Europe/Berlin hour and weekday buckets for a winter and a summer timestamp and one that crosses midnight, `returning` counts customers with >=2 stamp events, percent rounding, arrays of length 24 and 7.

### I1: integration (sonnet)
Merge all task branches. Run, in order, and fix what fails (smallest possible change, listed in the report):
1. `cd php && composer install && vendor/bin/phpunit` (SQLite).
2. `npm ci && npm run typecheck && npm test && npm run bundle`.
3. Start `php -S` as in 1.9; `python3 /home/user/bench/accept.py http://127.0.0.1:8080` => 33/33, twice in a row.
4. MariaDB pass per 1.9 (PHPUnit with `EVECOO_TEST_DSN`, then accept.py with a MySQL config, including a cold start so `Db::migrate()` runs `schema/mysql.sql`). If MariaDB cannot run here, say so explicitly.
5. Playwright smoke in `e2e/` against the PHP server: landing renders and hero/reveal animations run (no console errors); signup -> dashboard shows stats, card editor saves, message sends, staff member is created;
   join link -> `/join/<businessId>` -> submit -> lands on `/card/<id>` with QR and stamp dots; staff login -> `/staff` -> stamp and redeem that customer -> card page reflects it; logout; unknown `/card/x` shows the not-found state; direct load and reload of `/card/<id>` and `/join/<id>` work (apply the 1.4 fallback if not).
6. Rewrite `README.md` (run, test, bundle, deploy steps of 1.10, config, rate limits; remove Docker/Fly/Render and the "no rate limiting" limit) and `.env.example`.
Acceptance: all six green (or item 4 explicitly reported as not runnable), `dist/evecoo-hostinger.zip` exists, `git status` clean after commit.

### S1: security review (opus, small)
Review the PHP bundle against 1.7 and the old `main:tests/security.test.ts`: SQL built only from constants + bound params; every tenant query bound to `business_id`; id/token columns binary-collated in `mysql.sql`;
auth-before-validation order on every route; rate-limit atomicity and bypasses (header spoofing, email case, window edges); timing equality on login; no secret or stack trace in any response or in the zip;
`_app` unreachable through both `.htaccess` and `router.php`; body cap; `Authorization` extraction; config lookup cannot be influenced by the request; locale cannot traverse paths; XSS check of the two new client pages (QR SVG injection, message rendering).
Deliver `SECURITY-REVIEW-PHP.md` (findings with severity, fixed/open) and fixes with tests. Acceptance: PHPUnit and accept.py still green; no open high-severity finding.
