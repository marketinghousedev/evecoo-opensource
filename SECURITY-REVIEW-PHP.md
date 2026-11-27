# Security review: PHP backend (task S1)

Scope: `php/api/**` (all classes and routes), `php/api/.htaccess`, `php/api/_app/.htaccess`, `deploy/htaccess.root`,
`php/router.php`, `scripts/build-bundle.sh` and the produced `dist/evecoo-hostinger.zip`, plus the client token
handling and XSS sinks (`lib/client.ts`, `app/card`, `app/join`, `components/StampCard.tsx`, `I18nProvider`).
Checked against PLAN-PHP.md 1.7 and `main:tests/security.test.ts`.

Result: no open high-severity finding. Four issues fixed (tests in `php/tests/Core/SecurityTest.php` and
`php/tests/Accounts/AccountsTest.php`). PHPUnit green on SQLite (1 MySQL-only test skipped) and MariaDB 10.11 (144/144); accept.py 33/33.

## Findings

| # | Severity | Finding | Status |
|---|---|---|---|
| 1 | Medium | **Login email limit bypass on MySQL.** `users.email` is `utf8mb4_unicode_ci`, which is accent- and width-insensitive: `josé@b.com`, `jösé@b.com` ... all find the row of `jose@b.com`, but each spelling had its own `login_email` bucket, so the per-account limit (10/15 min) could be bypassed by rotating spellings (only `login_ip` was left). Confirmed on MariaDB before the fix. | Fixed: bucket subject is `user:<id>` when the email resolves to an account, else the normalized email. Test `testLoginEmailCollationVariantsShareTheBucketOnMysql` (MySQL) and `testLoginEmailBucketIsPerAccountNotPerSpelling`. |
| 2 | Low | **login_email check-then-hit race.** `check()` before verification and `hit()` only after a failure allowed N concurrent guesses past the limit. | Fixed: one atomic `hit()` on every attempt before verification, `clear()` on success (net effect unchanged: only failures accumulate). Existing limit tests still pass. |
| 3 | Medium (only if `ip_header` is set) | **Forwarded-header spoofing.** With `ip_header = HTTP_X_FORWARDED_FOR` the *first* entry was used, which the client controls; any value (not even an IP) was accepted, giving a fresh rate-limit bucket per request. | Fixed: last (proxy-appended) entry, must pass `FILTER_VALIDATE_IP`, else fall back to `REMOTE_ADDR`. Default stays `null` (`REMOTE_ADDR`). Tests in `SecurityTest`. |
| 4 | Low | **IPv6 rotation.** Per-address buckets: a client with a /64 (the normal allocation) gets 2^64 buckets. | Fixed: IPv6 subjects reduced to `/64`, IPv4-mapped IPv6 to IPv4. `testIpv6IsBucketedPer64`, `testIpv6RotationWithinOne64IsRateLimited`. |
| 5 | Low | **Missing browser hardening headers** (CSP, HSTS). The token lives in `localStorage`, so XSS impact is account takeover; no XSS sink was found, CSP is defense in depth. | Fixed in `deploy/htaccess.root`: CSP (`script-src 'self' 'unsafe-inline'` is required by Next's inline RSC bootstrap; `connect-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `frame-ancestors 'none'`, Google Fonts allowed), `Permissions-Policy`, `Cross-Origin-Opener-Policy`, HSTS only when `HTTPS=on`. Verified with headless Chromium on all 7 pages (no CSP violation; QR, fonts, dashboard, staff, join, card work). Presence test in `SecurityTest`. |
| 6 | Info | No logout endpoint: the client only drops the token, a stolen token stays valid up to 30 days. Same as `main`. | Open (needs a frontend change: `POST /api/auth/logout` deleting the session row). |
| 7 | Info | `customer_business` limit can be exhausted by anyone who knows a `businessId` (public join link): 500 sign-ups/day per business, needs ~9 IPs at 60/h. Lockout by design; `login_email` likewise lets anyone lock an account's password login for 15 min. | Accepted (design of 1.7). |
| 8 | Info | Fixed windows allow up to 2x the limit across a window boundary. | Accepted (design). |
| 9 | Info | Signup reveals whether an email is registered (409). Inherent to the API contract. | Accepted. |
| 10 | Info | `api/_app/schema/*.sql` ship in the zip (needed by `Db::migrate`). No secrets; unreachable (api rewrite + `_app` deny). | Accepted. |

## Verified, no issue

- **SQL**: every statement is a constant string with `?` placeholders; the only interpolation is `Db::insertIgnore()` table/column names from code constants and `TestCase` truncation. `EMULATE_PREPARES=false`.
- **Tenant isolation**: every staff/owner route takes `businessId` from the session, never from the body; stamp/redeem `WHERE c.id = ? AND c.business_id = ?` (404 for another tenant), messages/stats/staff/card bound to `business_id`. Unauthenticated routes (`public/card`, `customers` POST, `pass/*`, `customers/{id}/messages`) are capability-based on 128-bit ids, as on `main`; pass JSON has no birthday.
- **Roles**: owner-only on `PUT /card`, `messages` (GET/POST), `automations/run`, `stats`, `staff` (GET/POST) — identical to `main`; `createStaff` re-checks. 401 before 403 before validation on every route.
- **Ids/tokens**: `random_bytes`, 128/256 bit; only `sha256(token)` stored; expiry checked in SQL; id/token/hash columns `utf8mb4_bin` in `mysql.sql`.
- **Passwords/timing**: argon2id (bcrypt+sha256 prehash fallback); unknown email burns one hash; identical 401 body; same DB/rate-limit work on both paths.
- **Body cap**: declared `CONTENT_LENGTH` > 64 KiB is not even read; streamed body read to 64 KiB + 1 and rejected (checked live with 70 KB). Non-object JSON → 400. Mass assignment: routes copy named, validated fields only.
- **Errors**: `display_errors=0`, all `Throwable` → generic 500 (exception text only in `error_log`); header values stripped of CR/LF; `X-Powered-By` removed.
- **Config**: lookup uses env, server-set `DOCUMENT_ROOT` and a fixed path; nothing request-controlled. Config only `return`s an array. Locale names reach the filesystem only if in the discovered list.
- **Web reachability**: `api/.htaccess` sends every `api/**` request (incl. `_app/**`) to `index.php`; `_app/.htaccess` denies (2.4 and legacy syntax); every `src` file exits without `EVECOO`. Dev router returns 403 for `/api/_app/**` (also `%5Fapp`, `..`).
- **Bundle**: zip contains no `config.php`, `config.local.php`, `vendor`, `tests`, `router.php`, `*.sqlite`, `.env*`, `.map`; `api/_app/var/` is empty; no sourcemaps or localhost URLs in `_next`.
- **CORS/CSRF**: no CORS headers; Bearer header auth, no cookies for auth.
- **XSS**: React text rendering everywhere; the only `dangerouslySetInnerHTML` is the QR SVG from `qrcode` (`toString(id, {type:'svg'})` emits path data only, never the input text); card color is server-validated `#RRGGBB`; route ids are `encodeURIComponent`-ed into API paths; catalog fetch uses a locale from the build-time list.

## Deploy-time requirements (Hostinger)

1. PHP 8.2+ (8.3 recommended) with `pdo_mysql`, `mbstring`, `intl`.
2. Put the config at `<parent of public_html>/evecoo-config.php` (e.g. `/home/uXXX/domains/<domain>/evecoo-config.php`), not in `api/_app/`. Strong generated DB password.
3. Keep `ip_header => null`. Only if a proxy/CDN sits in front and `REMOTE_ADDR` turns out to be the proxy's address (all clients would then share one bucket) set it to that proxy's header (`HTTP_CF_CONNECTING_IP` for Cloudflare), and only if the origin cannot be reached around the proxy.
4. Enable SSL and "Force HTTPS" in hPanel (HSTS is only sent over HTTPS). Confirm after deploy: `curl -sI https://<domain>/` shows `Content-Security-Policy`, and `https://<domain>/api/_app/config.sample.php` is 403/404 JSON, not PHP source.
