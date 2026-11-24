# evecoo clone spec (digital stamp card SaaS)
LANGUAGE: UI and all copy are ENGLISH first. Use an i18n layer (message catalogs, e.g. messages/en.json; routes/components never hardcode strings) so German (de) can be added later by only adding messages/de.json. Original product is German-market; keep EUR pricing (29€/month).
Stack: Next.js (App Router) + TypeScript + SQLite (better-sqlite3 or node:sqlite). No external services; Apple/Google Wallet pass issuance is MOCKED (JSON).
Run contract: `npm install && npm run build && PORT=<n> npm start` must serve on $PORT. DB file path from env DB_PATH (default ./data.db), created on boot.
Auth: `Authorization: Bearer <token>` (any scheme, e.g. signed/random token stored in DB). Roles: owner, staff. All JSON.

## API (exact)
- POST /api/auth/signup {email,password,businessName} -> 201 {token,businessId}; duplicate email -> 409
- POST /api/auth/login {email,password} -> 200 {token,role} (works for owner and staff); bad creds -> 401
- GET  /api/auth/me -> {email,role,businessId,businessName}; no/invalid token -> 401
- PUT/GET /api/card (owner for PUT; any role GET) {name,reward,stampsRequired(int 2-20),color(#hex)}
- GET  /api/public/card/:businessId -> card fields (no auth)
- POST /api/staff (owner) {email,password} -> 201 {id}; staff gets 403 on owner-only routes
- POST /api/customers (public) {businessId,name,birthday?(YYYY-MM-DD)} -> 201 {customerId,passUrl:"/card/<id>"}
- GET  /api/pass/:customerId/apple and /google (public) -> 200 JSON {serialNumber,stamps,stampsRequired,reward,businessName}
- POST /api/stamps (owner|staff) {customerId} -> {stamps,redeemable:boolean}; stamps cap at stampsRequired; other business's customer -> 404
- POST /api/redeem (owner|staff) {customerId} -> {stamps:0}; 409 if not redeemable
- POST /api/messages (owner) {title,body} -> {recipients:n}; GET /api/messages (owner) list
- GET  /api/customers/:id/messages (public) -> array of messages that customer received
- POST /api/automations/run (owner) -> {sent:n}: win-back message to customers with last stamp >30 days ago (accept optional {now:ISO} body to simulate time), birthday message on their birthday (month-day of `now`), welcome message on first stamp (idempotent: never send same automation twice to same customer on same day)
- GET  /api/stats (owner) -> {customers,returning,returningPercent,visitsByHour:[24],visitsByWeekday:[7]}  (returning = customers with >=2 stamps)
## Pages (English, i18n-ready)
/ landing (headline, features, price 29€/Monat, CTA), /login, /signup, /dashboard (stats, card editor, messages, staff), /staff (enter customerId or scan QR -> stamp/redeem), /card/[id] (visual stamp card with dots, reward, QR).
## Quality
Hash passwords (no plaintext), validate input (400), tenant isolation, README with run steps, at least some tests.
