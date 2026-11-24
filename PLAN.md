# evecoo rebuild — PLAN

Language: **English first**, i18n-ready; German arrives later as `messages/de.json` only (T9).

Source of truth: `SPEC.md` + `/home/user/bench/accept.py` (43 lines, read it if in doubt). This plan fixes every decision; implementers do not re-decide, do not add deps, do not touch files outside their task. Read §1–§3 plus your own task only.

## 1. Tech decisions (fixed)

- Next.js **15** App Router, React 19, TypeScript strict, `@/*` alias to repo root. No `src/` dir. No Tailwind, no ESLint (`eslint.ignoreDuringBuilds: true`), no `next/font` (no network at build), no zod, no ORM.
- Deps only: `next react react-dom qrcode`; dev: `typescript @types/node@22 @types/react @types/react-dom @types/qrcode vitest`.
- SQLite: built-in **`node:sqlite`** (Node 22.23, no native build). Load ONLY via `process.getBuiltinModule('node:sqlite')` inside `lib/db.ts` (a static `import 'node:sqlite'` breaks webpack); `import type` is fine. Sync API. `DB_PATH` env, default `./data.db`, parent dir created; opened lazily in `getDb()` and eagerly from `instrumentation.ts` (boot). Never at module top level (build must not open the DB).
- Scripts: `dev: next dev`, `build: next build`, `start: next start` (honours `$PORT`), `test: vitest run`, `typecheck: tsc --noEmit`.
- IDs: `newId()` = `randomBytes(16).toString('base64url')` (customer id is an unguessable public capability). Timestamps: ISO-8601 UTC strings.
- Passwords: `scryptSync` (N=16384, 16-byte salt, 64-byte key), stored `scrypt$<saltB64>$<hashB64>`, compare with `timingSafeEqual`; unknown email still runs one dummy verify.
- Tokens: 32 random bytes base64url, returned once; DB stores only `sha256(token)` hex; 30-day expiry. Sent as `Authorization: Bearer <token>`. Browser keeps it in `localStorage['evecoo_token']`. No cookies, no middleware, **no server-side redirects**: `/dashboard` and `/staff` must return 200 unauthenticated (auth check is client-side).
- **i18n (English first)**: no i18n dependency, no locale in URLs. One flat catalog per locale, `messages/<locale>.json` = `{"ns.key":"Text with {var}"}`; `en` is the default and the fallback per key. Locales are discovered from the files in `messages/` at runtime (`fs`, cached), so adding `messages/de.json` is the only step needed for German. Locale resolution: cookie `locale` -> `Accept-Language` -> `en`. **No user-visible string literal anywhere in `app/`, `components/` or `lib/`** (UI text, API error messages, automation message texts, card defaults, `<title>`): always `t('ns.key',vars)`. Numbers, prices, dates and weekday names come from `Intl` with the active locale, never from the catalog. Server components and routes use `lib/i18n*.ts`; client components use `useT()` (root layout passes the resolved catalog to `I18nProvider`). Text persisted in the DB (card defaults at signup, automation messages) is rendered in `businesses.locale`, which is set at signup from the request locale.
- Tests: vitest, node env, `DB_PATH=':memory:'`, call lib functions directly (no HTTP). HTTP layer is covered by `accept.py`.
- Route handlers are thin: parse -> auth -> one lib call -> `json()`. All business logic and all SQL live in `lib/`. Every SQL statement touching tenant data takes `business_id` as a bound parameter. Only prepared statements with `?` params.

### Repo layout (owner task in brackets)

```
package.json tsconfig.json next.config.ts vitest.config.ts next-env.d.ts .gitignore instrumentation.ts   [T1]
lib/db.ts lib/http.ts lib/validate.ts lib/auth.ts lib/types.ts lib/client.ts                         [T1]
lib/i18n.ts lib/i18n-server.ts  messages/en.json  components/{I18nProvider,LocaleSwitcher}.tsx       [T1]
components/StampCard.tsx  app/layout.tsx  app/globals.css  app/api/health/route.ts  tests/helpers.ts  [T1]
lib/accounts.ts lib/card.ts  tests/accounts.test.ts                                                    [T2]
app/api/auth/{signup,login,me}/route.ts  app/api/card/route.ts
app/api/public/card/[businessId]/route.ts  app/api/staff/route.ts                                      [T2]
lib/loyalty.ts lib/pass.ts  tests/loyalty.test.ts                                                      [T3]
app/api/customers/route.ts  app/api/pass/[customerId]/{apple,google}/route.ts
app/api/stamps/route.ts  app/api/redeem/route.ts                                                       [T3]
lib/messages.ts lib/automations.ts lib/stats.ts  tests/engage.test.ts                                  [T4]
app/api/messages/route.ts  app/api/customers/[id]/messages/route.ts
app/api/automations/run/route.ts  app/api/stats/route.ts                                               [T4]
app/page.tsx  app/login/page.tsx  app/signup/page.tsx  app/card/[id]/page.tsx
app/join/[businessId]/page.tsx  components/AuthForm.tsx  messages/en.parts/public.json               [T5]
app/dashboard/page.tsx  app/staff/page.tsx  components/dashboard/*.tsx  messages/en.parts/app.json    [T6]
README.md  tests/i18n-keys.test.ts  (merges messages/en.parts/* into messages/en.json)                 [T8]
messages/de.json                                                                                       [T9, optional]
```

### DB schema (exact; `SCHEMA` constant in `lib/db.ts`, all `CREATE TABLE IF NOT EXISTS`; pragmas `journal_mode=WAL`, `foreign_keys=ON`)

```sql
businesses(id TEXT PRIMARY KEY, name TEXT NOT NULL, locale TEXT NOT NULL DEFAULT 'en',
  card_name TEXT NOT NULL, card_reward TEXT NOT NULL,   -- signup fills from t('defaults.cardName'|'defaults.reward')
  stamps_required INTEGER NOT NULL DEFAULT 10, card_color TEXT NOT NULL DEFAULT '#1F6F5B', created_at TEXT NOT NULL);
users(id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id),
  email TEXT NOT NULL UNIQUE COLLATE NOCASE, password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN('owner','staff')), created_at TEXT NOT NULL);
sessions(token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), created_at TEXT NOT NULL, expires_at TEXT NOT NULL);
customers(id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), name TEXT NOT NULL,
  birthday TEXT, stamps INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL);
stamp_events(id INTEGER PRIMARY KEY AUTOINCREMENT, customer_id TEXT NOT NULL REFERENCES customers(id),
  business_id TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN('stamp','redeem')), created_at TEXT NOT NULL);
messages(id TEXT PRIMARY KEY, business_id TEXT NOT NULL REFERENCES businesses(id), title TEXT NOT NULL, body TEXT NOT NULL,
  kind TEXT NOT NULL CHECK(kind IN('broadcast','winback','birthday','welcome')), created_at TEXT NOT NULL);
message_recipients(message_id TEXT NOT NULL REFERENCES messages(id), customer_id TEXT NOT NULL REFERENCES customers(id),
  PRIMARY KEY(message_id, customer_id));
automation_log(customer_id TEXT NOT NULL, kind TEXT NOT NULL, day TEXT NOT NULL, PRIMARY KEY(customer_id, kind, day));
-- indexes: customers(business_id), stamp_events(business_id), stamp_events(customer_id), message_recipients(customer_id)
```

### Lib signatures (exact exports)

```ts
// lib/types.ts
type Role='owner'|'staff';
type SessionUser={id:string;email:string;role:Role;businessId:string;businessName:string};
type Card={name:string;reward:string;stampsRequired:number;color:string};
type PublicCard=Card&{businessId:string;businessName:string};
type StampResult={stamps:number;redeemable:boolean};
type CustomerView={customerId:string;name:string;stamps:number;stampsRequired:number;redeemable:boolean;
  reward:string;businessName:string;cardName:string;color:string};
type PassJson={platform:'apple'|'google';serialNumber:string;stamps:number;stampsRequired:number;reward:string;
  businessName:string;customerName:string;cardName:string;color:string;redeemable:boolean;barcode:{format:'QR';message:string}};
type MessageKind='broadcast'|'winback'|'birthday'|'welcome';
type MessageSummary={id:string;title:string;body:string;kind:MessageKind;recipients:number;createdAt:string};
type CustomerMessage={id:string;title:string;body:string;kind:MessageKind;createdAt:string};
type Stats={customers:number;returning:number;returningPercent:number;visitsByHour:number[];visitsByWeekday:number[]};

// lib/db.ts
getDb():DatabaseSync            // singleton on globalThis; opens + runs SCHEMA
resetDb():void                  // close + drop singleton (tests)
tx<T>(fn:()=>T):T               // BEGIN IMMEDIATE / COMMIT / ROLLBACK
newId():string; nowIso():string

// lib/http.ts
class ApiError extends Error{constructor(status:number,code:string,messageKey:string,vars?:Vars)}  // key, never text
json(data:unknown,status=200):Response
readJson(req:Request):Promise<Record<string,unknown>>   // empty body -> {}; bad JSON or non-object -> 400
route<P=object>(fn:(req:Request,params:P)=>Response|Promise<Response>)
  :(req:Request,ctx:{params:Promise<P>})=>Promise<Response>  // awaits params; ApiError -> error JSON with message=t(messageKey,vars) in localeFromRequest(req); else 500 (log, no leak)

// lib/validate.ts  (each throws ApiError(400,'validation_error','errors.validation.<string|int|email|color|date>',{field:key,min,max}))
str(o,key,{min=1,max=200}):string   // trims; must be string
optStr(o,key,opts):string|undefined
int(o,key,{min,max}):number         // must be a JS integer number (no numeric strings)
email(o,key):string                 // lowercased, /^[^\s@]+@[^\s@]+\.[^\s@]+$/, max 254
hexColor(o,key):string              // /^#[0-9a-fA-F]{6}$/
isoDate(o,key):string|undefined     // YYYY-MM-DD and a real calendar date; undefined if absent/null

// lib/i18n.ts  (server/test side, no next imports)
type Vars=Record<string,string|number>; type T=(key:string,vars?:Vars)=>string
DEFAULT_LOCALE='en'
availableLocales():string[]                          // basenames of messages/*.json
getMessages(locale:string):Record<string,string>     // en merged under the locale's keys
translate(messages:Record<string,string>,locale:string,key:string,vars?:Vars):string
  // {var} interpolation; if vars.count is set and `key` is absent, uses `key.<Intl.PluralRules category>` then `key.other`; missing key -> returns key
getT(locale:string):T
resolveLocale(i:{cookie?:string|null;acceptLanguage?:string|null}):string   // only returns an available locale
localeFromRequest(req:Request):string
formatPrice(locale:string,amount:number,currency='EUR'):string   // no fraction digits: en "€29", de "29 €"
formatDate(locale:string,iso:string):string; weekdayShort(locale:string,mondayIndex:number):string
// lib/i18n-server.ts  (uses next/headers)
getServerI18n():Promise<{locale:string;t:T;messages:Record<string,string>}>
// components/I18nProvider.tsx ('use client')
I18nProvider(p:{locale:string;messages:Record<string,string>;children:ReactNode}); useT():{t:T;locale:string}
// components/LocaleSwitcher.tsx ('use client'): renders nothing if locales.length<2; sets cookie `locale`, reloads

// lib/auth.ts
hashPassword(pw:string):string; verifyPassword(pw:string,stored:string):boolean
createSession(userId:string):string                 // returns raw token
getUser(req:Request):SessionUser|null
requireUser(req:Request,role?:'owner'):SessionUser  // 401 if none/expired; 403 if role='owner' and user is staff

// lib/accounts.ts [T2]
signup(i:{email:string;password:string;businessName:string},locale:string):{token:string;businessId:string}  // 409 email_taken; stores locale + localized card defaults
login(i:{email:string;password:string}):{token:string;role:Role}                               // 401 invalid_credentials
createStaff(owner:SessionUser,i:{email:string;password:string}):{id:string}                    // 409 email_taken
listStaff(businessId:string):{id:string;email:string}[]
// lib/card.ts [T2]
getPublicCard(businessId:string):PublicCard          // 404
updateCard(businessId:string,c:Card):Card

// lib/loyalty.ts [T3]
createCustomer(i:{businessId:string;name:string;birthday?:string}):{customerId:string;passUrl:string} // 404 unknown business
addStamp(businessId:string,customerId:string):StampResult    // 404 if customer not in business
redeem(businessId:string,customerId:string):{stamps:0}       // 404 / 409 not_redeemable
getCustomerView(customerId:string):CustomerView|null
// lib/pass.ts [T3]
buildPass(customerId:string,platform:'apple'|'google'):PassJson   // 404

// lib/messages.ts [T4]
deliver(businessId:string,kind:MessageKind,title:string,body:string,customerIds:string[],createdAt:string):string // msg id; caller owns tx
sendBroadcast(businessId:string,i:{title:string;body:string}):{recipients:number}
listMessages(businessId:string):MessageSummary[]             // newest first
listCustomerMessages(customerId:string):CustomerMessage[]    // 404 unknown customer; newest first
// lib/automations.ts [T4]
runAutomations(businessId:string,now:Date):{sent:number}      // texts via getT(businesses.locale)
// lib/stats.ts [T4]
getStats(businessId:string):Stats

// lib/client.ts ('use client' safe, browser only)
getToken():string|null; setToken(t:string):void; clearToken():void
class ApiClientError extends Error{status:number;code:string}
api<T>(path:string,opts?:{method?:string;body?:unknown}):Promise<T>   // adds Bearer, JSON; throws ApiClientError
useSession(require?:'owner'|'any'):{user:SessionUser|null;loading:boolean}
  // GET /api/auth/me; on 401 -> clearToken + router.replace('/login'); require='owner' and role staff -> replace('/staff')

// tests/helpers.ts  (sets process.env.DB_PATH=':memory:'; call freshDb() in beforeEach)
freshDb():void
seedBusiness(over?:Partial<{name:string;stampsRequired:number}>):{businessId:string;owner:SessionUser}
seedCustomer(businessId:string,over?:Partial<{name:string;birthday:string;stamps:number}>):string
seedStamp(businessId:string,customerId:string,createdAtIso:string):void   // inserts a 'stamp' event only

// components/StampCard.tsx (server-safe, no hooks)
StampCard(p:{businessName:string;cardName:string;reward:string;stampsRequired:number;stamps:number;color:string;
  rewardLabel:string;progressLabel:string})   // labels are passed in already translated
```

## 2. Shared contracts

Error body (all non-2xx): `{"error":"<code>","message":"<localized sentence, English by default>"}`. Codes: 400 `validation_error`, 401 `unauthorized` / `invalid_credentials`, 403 `forbidden`, 404 `not_found`, 409 `email_taken` / `not_redeemable`, 500 `internal`. Check order: auth (401) -> role (403) -> validation (400) -> existence (404) -> state (409). Every route file: `export const dynamic='force-dynamic'`.

| Route | Auth | Request | Success |
|---|---|---|---|
| POST `/api/auth/signup` | – | `{email,password(8–200),businessName(1–100)}` | 201 `{token,businessId}`; creates business (default card) + owner |
| POST `/api/auth/login` | – | `{email,password}` both strings else 400; **no length check** (wrong pw `"no"` must be 401) | 200 `{token,role}` |
| GET `/api/auth/me` | any | – | 200 `{email,role,businessId,businessName}` |
| GET `/api/card` | any | – | 200 `Card` |
| PUT `/api/card` | owner | `{name(1–60),reward(1–100),stampsRequired(int 2–20),color}` | 200 `Card` |
| GET `/api/public/card/:businessId` | – | – | 200 `PublicCard` |
| POST `/api/staff` | owner | `{email,password(8–200)}` | 201 `{id}` |
| GET `/api/staff` (extension) | owner | – | 200 `[{id,email}]` |
| POST `/api/customers` | – | `{businessId,name(1–80),birthday?}` | 201 `{customerId,passUrl:"/card/<id>"}` |
| GET `/api/pass/:customerId/apple` `/google` | – | – | 200 `PassJson` (`serialNumber`=customerId) |
| POST `/api/stamps` | any | `{customerId}` | 200 `StampResult` |
| POST `/api/redeem` | any | `{customerId}` | 200 `{stamps:0}` |
| POST `/api/messages` | owner | `{title(1–80),body(1–500)}` | 200 `{recipients}` |
| GET `/api/messages` | owner | – | 200 `MessageSummary[]` |
| GET `/api/customers/:id/messages` | – | – | 200 `CustomerMessage[]` (bare array) |
| POST `/api/automations/run` | owner | optional `{now}`; body may be empty; `now` present but not a string / `Date.parse` NaN -> 400 | 200 `{sent}` |
| GET `/api/stats` | owner | – | 200 `Stats` |

Semantics (binding):
- **Stamps**: `effective=min(customers.stamps,stampsRequired)`; `redeemable=effective>=stampsRequired`. `addStamp` at cap: no change, **no event**, returns `{stamps:cap,redeemable:true}`. Otherwise +1 and insert `stamp` event, in one `tx`. `redeem`: 409 unless redeemable; sets stamps 0, inserts `redeem` event. Customer of another business -> 404 (never 403).
- **Stats**: `customers`=count; `returning`=customers with >=2 lifetime `stamp` **events** (NOT current stamps: accept.py checks `returning==1` after a redeem); `returningPercent`=`Math.round(returning/customers*100)`, 0 if none. `visitsByHour[0..23]` and `visitsByWeekday[0..6]` (0=Monday) count `stamp` events in `Europe/Berlin` (use `Intl.DateTimeFormat`, compute in JS).
- **Broadcast**: one `messages` row + a recipient row for every customer of the business; `recipients`=that count (0 allowed).
- **Automations** (`day`=`now.toISOString().slice(0,10)`, UTC; all in one `tx`; `sent`=number of messages delivered; one `messages` row per customer per automation via `deliver`, `created_at`=now):
  - welcome: customer has >=1 `stamp` event and no `automation_log` row kind `welcome` (any day). Once ever.
  - winback: latest `stamp` event `< now-30d` and no `winback` log with `day >` the date of that latest stamp (once per lapse).
  - birthday: `birthday` not null and its `MM-DD` equals `day`'s `MM-DD`; guarded by PK `(customer,'birthday',day)`.
  - Always `INSERT OR IGNORE` into `automation_log` and deliver only if a row was inserted. Expected with accept.py: run(+40d) -> 2, same again -> 0, run(2027-06-15) -> 1.
  - Texts come from catalog keys `automations.<welcome|winback|birthday>.<title|body>` with vars `{name}`, `{reward}`, `{business}`, rendered in the business locale, e.g. "Welcome, {name}!", "We miss you, {name}", "Happy birthday, {name}!".

Catalog keys owned by T1 in `messages/en.json` (T2–T4 add none): `common.*` (appName, tagline, save, cancel, loading, logout, retry), `locale.*`, `errors.{unauthorized,invalidCredentials,forbidden,notFound,emailTaken,notRedeemable,internal,invalidJson}`, `errors.validation.{string,int,email,color,date,now}`, `defaults.{cardName,reward}`, `card.{rewardLabel,progress,redeemable}`, `automations.*`. T5 owns namespaces `landing. auth. cardPage. join.` in `messages/en.parts/public.json`; T6 owns `dashboard. staff.` in `messages/en.parts/app.json` (same flat format). T8 merges the parts into `messages/en.json` and deletes `messages/en.parts/`.

### UI tokens (`app/globals.css`, plain CSS, light only, mobile-first, max content width 1080px)

```
--bg:#FAF7F2 --surface:#FFFFFF --ink:#1C1B19 --muted:#6B665E --line:#E6E0D6
--brand:#1F6F5B --brand-ink:#FFFFFF --accent:#F2B544 --danger:#B3261E --ok:#1F6F5B
--radius:14px --radius-sm:8px --shadow:0 1px 2px rgba(28,27,25,.06),0 8px 24px rgba(28,27,25,.06)
--font:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif   (h1–h3: 700, letter-spacing -0.02em; body 16px/1.5)
```
Global classes provided by T1 (UI tasks reuse, add page-specific CSS only via CSS modules next to their own files): `.container .card .btn .btn-secondary .btn-danger .field .label .input .grid .muted .error .success .badge .tile`. `<html lang={locale}>`, title from `common.appName` + `common.tagline` ("evecoo – Digital stamp cards").
Copy: **English first**, written for small-shop owners: plain, friendly, second person ("you"), sentence case, short sentences, concrete benefits, no jargon, no exclamation-mark hype. Price stays in EUR: `formatPrice(locale,29)` + `landing.price.perMonth` -> "€29 / month". Errors: show the API `message` (already localized). Every string lives in the catalog, written so a translator can work key by key: full sentences per key, variables as `{name}`, no string concatenation, no text baked into CSS or images.

## 3. Tasks

Order: **T1 -> (T2 ∥ T3 ∥ T4 ∥ T5 ∥ T6) -> T7 -> T8 -> T9 (optional)**. Rules for all: touch only your files; if a contract here is wrong or missing, do not improvise across boundaries — note it in your final report. Parallel tasks must NOT run `npm run build` or `npm install` (shared `.next`/lockfile); verify with `npx vitest run <own test file>` and `npm run typecheck` (ignore errors in files you do not own). Final report <= 10 lines.

**T1 Foundation** — sonnet — deps: none — ~75k tokens — reviewed in T7 (`auth.ts`, `http.ts`, `db.ts` only)
Create all `[T1]` files exactly per §1–§2: configs, `npm install` (commit lockfile), `lib/{db,http,validate,auth,types,client,i18n,i18n-server}.ts`, `messages/en.json` with every T1-owned key from §2, `components/{I18nProvider,LocaleSwitcher}.tsx`, `instrumentation.ts` (`register()`: if `process.env.NEXT_RUNTIME==='nodejs'` dynamic-import `@/lib/db` and call `getDb()`), `app/layout.tsx` (async: `getServerI18n()`, sets `lang`, wraps children in `I18nProvider`, renders `LocaleSwitcher` with `availableLocales()`), `app/globals.css` with the tokens and global classes, `components/StampCard.tsx` (card in `color` with readable text colour chosen by luminance, business name, card name, `stampsRequired` dots in a wrapping grid with the first `stamps` filled, reward line and progress line using the `rewardLabel` / `progressLabel` props), `app/api/health/route.ts` -> `{ok:true}`, `tests/helpers.ts`, `vitest.config.ts` (alias `@`, node env). `.gitignore`: `node_modules .next *.db *.db-wal *.db-shm`.
Accept: `npm run build` and `npm run typecheck` pass; `PORT=3999 npm start` serves `/api/health` and creates the DB file; a throwaway vitest check proves hash/verify round-trip and `requireUser` 401/403 (keep as `tests/auth.test.ts`, also T1-owned); `tests/i18n.test.ts` (T1-owned) proves interpolation, plural fallback, per-key fallback to `en`, `resolveLocale` ignoring unavailable locales, and that an `ApiError` is rendered through the catalog.

**T2 Accounts + card API** — sonnet — deps: T1 — ~45k — reviewed in T7
Implement `lib/accounts.ts`, `lib/card.ts` and the six `[T2]` route files per the §2 table. Routes pass `localeFromRequest(req)` to `signup`. Throw `ApiError` with catalog keys only. Signup: validate, 409 on existing email (case-insensitive, also catch the UNIQUE race), insert business + owner in one `tx`, return session token. Login works for owner and staff, identical 401 for unknown email and wrong password. Staff is created in the owner's business; staff email shares the global unique email space.
Accept: `tests/accounts.test.ts` covers signup, duplicate 409, login ok/401 for both roles, password stored hashed (not equal to plaintext, starts `scrypt$`), card update + validation rejects `stampsRequired:99` / `color:'bad'`, staff creation; typecheck clean for own files.

**T3 Customers, pass, stamps API** — sonnet — deps: T1 — ~45k — reviewed in T7
Implement `lib/loyalty.ts`, `lib/pass.ts` and the five `[T3]` route files per §2 "Stamps" semantics. Both pass routes call `buildPass` with their platform. `getCustomerView` joins customer + business for the `/card/[id]` page.
Accept: `tests/loyalty.test.ts` covers create customer (bad birthday `2024-02-30` -> 400, unknown business -> 404), stamp 1..cap, cap is stable and adds no event, redeem resets to 0, second redeem 409, other-business stamp and redeem -> 404, pass JSON fields for both platforms.

**T4 Messages, automations, stats API** — sonnet — deps: T1 (uses only the schema + `tests/helpers.ts`, not T3 code) — ~65k — reviewed in T7
Implement `lib/messages.ts`, `lib/automations.ts`, `lib/stats.ts` and the four `[T4]` route files per §2 "Broadcast", "Automations", "Stats". The automations route passes `now ? new Date(now) : new Date()` (note accept.py sends 6 fractional digits, e.g. `2027-01-03T10:00:00.123456Z`; `Date.parse` accepts it).
Accept: `tests/engage.test.ts` covers broadcast recipients only within own business, customer message list, the exact accept sequence (welcome+winback = 2, rerun 0, birthday 1), winback not sent at 29 days, winback re-armed after a newer stamp lapses again, birthday not re-sent same day, automation texts come from the catalog in the business locale (no literals in `lib/`), stats incl. `returning` from events after a redeem and array lengths 24/7 with Monday index 0.

**T5 Public pages** — sonnet — deps: T1 (API shapes from §2 only) — ~65k — no review beyond T8
All copy goes into `messages/en.parts/public.json` (your namespaces, §2 tone) and is read via `getServerI18n()` in server components and `useT()` in client components; no string literals in JSX. Build `/` (server component: hero headline, 3–4 feature blocks for wallet card, messages, automations, statistics, a pricing card showing `formatPrice(locale,29)` + per-month label, CTA buttons to `/signup` and `/login`), `/login` and `/signup` (client, shared `components/AuthForm.tsx`; on success `setToken`, owner -> `/dashboard`, staff -> `/staff`), `/card/[id]` (server component, `force-dynamic`, `getCustomerView` or `notFound()`; shows `StampCard`, a "reward ready" badge (`card.redeemable`) when redeemable, QR SVG of the customer id via `QRCode.toString(id,{type:'svg'})`, "Add to Apple Wallet" / "Add to Google Wallet" links to the pass routes, and the customer's messages via `listCustomerMessages`), `/join/[businessId]` (client: public card preview via `/api/public/card/:id`, form name + optional birthday -> POST `/api/customers` -> redirect to `passUrl`). `/card/[id]` imports `@/lib/loyalty` and `@/lib/messages` by the §1 signatures (written in parallel; do not stub them).
Accept: typecheck clean for own files; pages follow §2 tokens/copy; all 200 without auth; `/` HTML contains `29`; no user-visible literal in your files; every key you use exists in your parts file or the T1 key list.

**T6 Dashboard + staff pages** — sonnet — deps: T1 — ~80k — no review beyond T8
All copy goes into `messages/en.parts/app.json` (your namespaces) and is read via `useT()`; weekday labels via `Intl`, not the catalog. `/dashboard` (client, `useSession('owner')`, renders a shell immediately so the unauthenticated GET is 200): sections as components in `components/dashboard/` — Stats (tiles customers / returning customers / return rate, two pure-CSS bar charts with labels 0–23 and Mon–Sun), CardEditor (form + live `StampCard` preview, PUT `/api/card`), Messages (compose form, result "Sent to {count} customers" (plural keys `.one`/`.other`), list from GET `/api/messages`, button "Run automations now"), Staff (create form + list from GET `/api/staff`), Join link (`/join/<businessId>` with copy button), logout. `/staff` (client, `useSession('any')`): customer-id input, optional camera scan using `BarcodeDetector` only if `'BarcodeDetector' in window` (hide the button otherwise), preview via GET `/api/pass/<id>/google`, buttons "Add stamp" and "Redeem reward" (enabled only when redeemable), clear result and error states.
Accept: typecheck clean for own files; no server redirects; each section handles loading/error/empty; no user-visible literal in your files.

**T7 Security review + fixes** — opus — deps: T2, T3, T4 — ~35k — this IS the review of T1–T4
Read only `lib/{db,http,auth,accounts,card,loyalty,pass,messages,automations,stats}.ts` and `app/api/**/route.ts`. Check and fix directly (minimal diffs): every authed route calls `requireUser` with the right role before anything else; every tenant query is bound to the caller's `business_id`; cross-tenant access is 404; no plaintext password or raw token persisted or logged; token compare via hash lookup; password verify constant-time incl. unknown-user path; all SQL parameterised; 500s leak nothing; public routes expose only §2 fields (no birthday, no email); input limits enforced; locale cookie / `Accept-Language` values can only select an existing catalog file (no path traversal into `fs`). Do not refactor or restyle. Report: findings fixed, findings deferred.
Accept: `npm test` and `npm run typecheck` pass after fixes.

**T8 Integration + README** — sonnet — deps: T5, T6, T7 — ~55k
First merge `messages/en.parts/*.json` into `messages/en.json` (fail on duplicate keys) and delete the parts dir. Add `tests/i18n-keys.test.ts`: (a) every key literal passed to `t(`/`ApiError(` in `app/ components/ lib/` exists in `en.json`; (b) every `messages/*.json` has exactly the key set of `en.json` and the same `{vars}` per key; (c) a heuristic scan flags JSX text nodes and `placeholder|title|aria-label|alt` string literals containing letters in `app/` and `components/` — move any hit into the catalog. Then run `npm run typecheck`, `npm test`, `npm run build`; fix whatever breaks (any file, minimal diffs). Start `DB_PATH=<fresh temp file> PORT=3999 npm start` in the background, run `python3 /home/user/bench/accept.py http://localhost:3999`, iterate until `score == total` and `failed == []`, then stop the server. Check the run contract from a clean state: `rm -rf node_modules .next && npm install && npm run build`. Write `README.md` in English (product one-liner, requirements Node 22, run steps, env `PORT` / `DB_PATH`, test command, API table copied from §2, an "Adding a language" section (drop `messages/<locale>.json` with the same keys; nothing else), note that Wallet passes are mocked JSON, known limits: no rate limiting, no token revocation UI). Report the final accept JSON verbatim plus any contract deviations.
Accept: accept.py full score; build and tests green; README present; `messages/en.parts/` gone; i18n key test green.

**T9 Add German locale (optional)** — sonnet — deps: T8 — ~20k — no review (guarded by `tests/i18n-keys.test.ts`)
Create `messages/de.json` and nothing else: same keys and `{vars}` as `messages/en.json`, natural German for small-shop owners, informal **du**, real umlauts, no needless anglicisms, plural keys `.one`/`.other`. If any other file needs a change for German to work, that is an i18n-layer bug: report it instead of patching around it.
Accept: `npm test` green (key parity); after `npm run build` + start, `curl -H 'Accept-Language: de' /` returns German copy with `29 €`, `curl /` still returns English, the language switcher appears, and accept.py still scores full.

Budget total ~470k tokens (opus ~35k), plus ~20k for optional T9. Known accept.py traps, already encoded above: login must not length-validate; `returning` counts events; pages need 200 without a token; automation `now` has microseconds; ids must be URL-safe; accept.py sends no `Accept-Language`, so the default locale must be `en` and `/` must still contain `29`.
