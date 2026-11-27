# DESIGN.md — make the UI match the original evecoo.de (visual + UX only)

Reference screenshots (full page, desktop 1440 + mobile 390): `reference/home-*.png`, `funktionen-*.png`, `so-*.png`; extracted tokens in `reference/tokens.json`. They are tall: CROP them into slices (Playwright/PIL, e.g. 1440x900 chunks) and view the slices; do not view the whole page at once. Original copy is German: reproduce the structure and tone but write ENGLISH copy in `messages/en.json` (i18n rules still apply: no hardcoded strings). Do NOT copy the original's images/logos/brand names of its customers; draw the phone/wallet mockups in CSS/SVG.

## Tokens (define as CSS vars in app/globals.css)
Font: Hanken Grotesk (Google Fonts via next/font/google), body 16px/400, color #071130, page bg #F8F8FC, surface #fff, muted #3A4160, border #D7DDE7.
Brand blue #044DF2 (hover #0342D6, light #2F6BFF, deep #0338C9, soft #E8EFFE, muted #B9CCFB). Navy #0B1F44 (footer, dark cards, announcement bar). Buttons are fully rounded pills (radius 9999px); primary = brand blue/white text; secondary = white with border. Cards: white, ~20-24px radius, 1px border, soft large shadow. Headings weight 500, tight letter-spacing, H1 78px desktop (~40px mobile); a highlighted last line of the headline is brand blue. Icons: inline SVG glyphs in the Material Symbols outlined style (no icon web font). Section pattern: small blue eyebrow label, big centered H2, grey subline. Easing cubic-bezier(0.16,1,0.3,1), subtle fade/slide-in on scroll (respect prefers-reduced-motion).

## Landing page `/` (top to bottom)
1. Navy announcement bar (one line, centered). 2. Sticky white nav: wordmark "EVECOO" with small logo mark, links Features / Benefits / Dashboard / Service / Pricing / FAQ / Support, "Login" text link, blue pill "Start free". Mobile: hamburger.
3. Hero: rating/social-proof badge, 2-3 line H1 (last line blue), subline, blue pill CTA, small line "100% free trial | no credit card", then a wide visual: one-time guests flowing via a central logo node into regulars (soft gradient + floating chips).
4. Logo strip of customer types (grey wordmark placeholders, text only, no real brands).
5. "Features": 3 equal cards: (a) wallet-card designer with a stylized stamp card, (b) push messages with a phone lock-screen mockup + notification, (c) dashboard stats mini chart.
6. "How it works": 3 numbered step tabs (Save card / Give stamps / Send message) with a large centered phone mockup that changes per step.
7. "All features" bento grid, 6 cards (automations list with toggles, team accounts, Apple/Google Wallet badges, birthday greetings, live stamp feed, nearby reminder with map tile).
8. "The problem": 3 cards with big numbers (60% never return, 65% revenue from regulars, solution flow) + CTA.
9. "We take care of everything": setup/service block with a navy CTA card.
10. Dashboard preview: stat tiles (customers, returning %, ...), area line chart, visits by hour and weekday bars, all drawn with SVG/CSS.
11. Pricing: big navy card "€29 / month, 30-day free trial" next to a white card with the feature checklist.
12. FAQ: two-column accordion (native details/summary, animated chevron).
13. Final CTA band + navy multi-column footer (product, resources, legal).
Use the exact section order and density of the reference; mobile stacks to one column with the same sections.

## App screens (logged in), keep all behavior/API calls intact
- Login/Signup: centered card on #F8F8FC, wordmark, pill inputs/buttons.
- Dashboard: left navy sidebar (#0B1F44) with nav (Overview, Card, Messages, Team, Join link, Logout); main area with stat tiles, visits-by-hour and weekday bar charts (SVG), card designer with live stamp-card preview, messages composer + sent list with automation toggles/run button, team manager. Mobile: sidebar becomes a top bar/drawer.
- Staff screen: mobile-first, big touch targets, customer lookup/scan field, large Stamp / Redeem pill buttons, live recent-stamps feed look.
- Customer card page `/card/[id]` and `/join/[businessId]`: a realistic wallet-card (brand color header, name, reward, stamp dots/circles filled with the business color, QR, "Add to Apple Wallet / Google Wallet" buttons).
## Rules
No backend/API/lib changes. All existing tests must still pass; all strings via i18n catalog (add keys to messages/en.json; keep the key test green); no new heavy deps (CSS modules/global CSS + inline SVG; next/font is fine). Verify with `npx tsc --noEmit`, `npx vitest run`, `npm run build`, then screenshot with Playwright and compare against the reference slices.
