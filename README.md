# evecoo

Digital stamp cards for small shops: customers keep a card on their phone, staff add stamps by QR/customer id, owners see statistics and send messages.

Requirements: Node 22 (uses built-in `node:sqlite`, no native build).

## Run

```
npm install
npm run build
PORT=3000 DB_PATH=./data.db npm start     # or: npm run dev
npm test                                   # vitest
npm run typecheck
```

| Env | Default | Meaning |
|---|---|---|
| `PORT` | 3000 | HTTP port (`next start`) |
| `DB_PATH` | `./data.db` | SQLite file (parent dir is created; `:memory:` for tests) |

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

- Next.js 15 App Router, React 19, TypeScript strict. No ORM, no i18n library, no CSS framework.
- `lib/` holds all logic and SQL (prepared statements, every tenant query bound to `business_id`); `app/api/**/route.ts` are thin handlers (parse, auth, one lib call). Tests call `lib/` directly with an in-memory DB.
- SQLite via `node:sqlite`, opened lazily and at boot from `instrumentation.ts`. Passwords: scrypt. Session tokens: 32 random bytes, only the SHA-256 is stored, 30-day expiry.
- Auth is client-side for pages (`/dashboard`, `/staff` return 200 and redirect in the browser); the API enforces everything.
- i18n: flat catalog `messages/<locale>.json`; `en` is default and per-key fallback. No user-visible literal in `app/`, `components/`, `lib/`; `tests/i18n-keys.test.ts` checks key existence, locale parity and scans for hard-coded strings.

## Adding a language

Drop `messages/<locale>.json` with exactly the keys and `{variables}` of `messages/en.json` (plural keys `.one`/`.other`). Nothing else changes: locales are discovered at runtime, the switcher appears, resolution is cookie `locale`, then `Accept-Language`, then `en`. `npm test` enforces key parity.

## Known limits

- No rate limiting or account lockout on login/signup.
- No logout or session revocation on the server (logout only clears the browser token), no password reset, and staff accounts cannot be removed.
- Tokens live 30 days in `localStorage` (readable by any XSS), not in httpOnly cookies.
- Wallet pass issuance is a mock: `lib/pass.ts` returns plain JSON. Real Apple Wallet needs an Apple Developer Pass Type ID certificate and signed `.pkpass` files (plus a web service for updates); Google Wallet needs an issuer account and a service account to create/sign pass objects.
- Messages are only shown on the customer's card page; no email/push. Automations run only when triggered (`/api/automations/run`), there is no scheduler.
- Single SQLite file, single process.
- This is an independent rebuild from a spec; the original Next/Vercel product's code is not copied.

## Deploy
Needs Node >= 22.13 and a **persistent disk** (SQLite file at `DB_PATH`). Serverless hosts (Vercel) will lose data; use a container host with a volume (Fly.io, Railway, Render with disk, a VPS) or the included `Dockerfile`:
```bash
docker build -t evecoo . && docker run -p 3000:3000 -v evecoo-data:/data evecoo
```
Health check: `GET /api/health`. Before real traffic add rate limiting (see Known Limits).
