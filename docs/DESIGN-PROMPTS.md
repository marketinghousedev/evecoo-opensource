# Design asset prompts for Claude Code

Paste one prompt per Claude Code session, in the order below. Every prompt is self-contained: a fresh session knows nothing about earlier conversations.

**Repo and branch.** `marketinghousedev/evecoo-opensource`, branch `php-agency`. This is the Next.js static export with the PHP API.

**Run P0 first.** It sets the illustration system that every later prompt follows. After P0, prompts P1 to P9 can run in any order, or in parallel worktrees. P10 integrates and checks everything.

**Bar to clear.** The result must beat the live evecoo.de, not just match it. Each prompt carries a "better than the original" checklist. Reject output that fails it.

**What the prompts mean by "the original".** These files sit locally in the rebuild folder. The `reference/` folder is git-ignored, so it is not in the GitHub repo.
- **Screenshots:** `reference/*.png`.
- **Recording frames:** `reference/anim/<section>/f###.jpg`.

If the frames are missing, the session should ask you for them. It must not guess.

---

## P0: Illustration system and asset pipeline (run first)

```text
You are working in the evecoo repo (branch php-agency): a Next.js static export (app/, components/landing/*, app/landing.css, app/globals.css) for a digital stamp card SaaS for small local businesses (cafés, bakeries, kebab shops, barbers, nail studios, sushi, pizza). The UI is English-first with i18n catalogs in messages/en.json.

Goal: define ONE coherent illustration system and asset pipeline that every later asset will follow, so the landing page looks clearly more polished and consistent than the current live competitor reference (evecoo.de), which mixes photos, stock-ish avatars and flat shapes.

Deliver:
1. docs/ILLUSTRATION-SYSTEM.md, at most 2 pages:
   - Palette, derived from the existing CSS tokens in app/globals.css:
     - brand #044DF2, brand-light #2F6BFF, brand-soft #E8EFFE, navy #0B1F44, ink #071130, muted #3A4160, border #D7DDE7, bg #F8F8FC
     - success #12B76A, loss #D6244B
     - plus 6 warm accent hues for food and industries (choose them; each must keep 3:1 contrast against white where it carries meaning)
   - Line weights and rules: e.g. 1.75px stroke at 24px grid, round caps and joins.
   - Corner radii, light direction (top-left), shadow recipe (soft, two layers, tinted navy, never pure black).
   - Skin-tone and hair range for people.
   - Texture rule: none, or a single subtle grain, decided once.
   - Do/don't examples.
2. public/illustrations/ folder structure:
   - avatars/, stamps/, passes/, scenes/, backgrounds/, brands/, icons/
   - a README listing naming rules: kebab-case, `<group>-<name>[-<variant>].svg`.
3. Asset rules, enforced by a test:
   - SVG only, unless the folder README says otherwise.
   - Optimized with svgo (add svgo as a devDependency and an `npm run svg:optimize` script).
   - Per-file budget 8 KB (scenes 24 KB). No embedded raster. No text baked into images (copy stays in i18n). viewBox set. No width/height attrs. currentColor where recoloring is intended.
   - Every animatable part gets a stable id or class (e.g. #beam, .stamp-slot) so CSS can animate it.
   - Add tests/assets.test.ts (vitest) that walks public/illustrations and fails on budget, missing viewBox, <image>/<text> elements, or `style` attributes with hardcoded fonts.
4. components/illustration/Illo.tsx: a tiny component that inlines an SVG by name (build-time import via an index file you generate with scripts/gen-illo-index.mjs). This lets us style and animate internals with CSS, with aria-hidden by default and an optional `title` prop for meaningful images.

Constraints:
- No new runtime dependencies.
- Do not copy, trace or imitate evecoo.de artwork, or any real company's logo.
- Apple Wallet and Google Wallet badges must NOT be redrawn. Note in the README that the official badge files must be downloaded from Apple's and Google's guideline pages and placed in public/illustrations/brands/ unmodified.

Verify: npm run typecheck, npm test, npm run build all pass. Commit on php-agency with a clear message.
```

---

## P1: People and avatars

```text
Repo evecoo, branch php-agency. Read docs/ILLUSTRATION-SYSTEM.md and public/illustrations/README.md first and follow them exactly.

Create a diverse illustrated avatar set in public/illustrations/avatars/ for a stamp-card product used in German, French and Benelux neighbourhoods.

- 16 head-and-shoulders avatars, 64x64 viewBox, circular crop built in:
  - mixed ages (young adult to senior)
  - skin tones spanning the system's range
  - hairstyles including hijab, curls, bald, beard, braids, glasses
  - casual clothing in palette accents
- Expressions friendly and natural. No caricature.
- 2 "anonymous guest" glyphs, outline person on white, in grey and in brand-soft, matching the avatar silhouette size exactly so a guest can morph into an avatar.
- Badges as separate SVGs, positioned via CSS, not baked in: badge-check (success green), badge-person (brand blue), badge-stamp (brand), each 18x18 with a 2px white ring.
- Name every avatar with a neutral id (avatar-01 … avatar-16). Write a manifest JSON with a short description of each, used for alt text where needed.

Better than the original checklist:
- Consistent stroke and shading across all 16, i.e. one artist's hand. The original mixes 3D renders and flat avatars.
- Real diversity with no repeated face shapes.
- They read at 32px.

Then replace the current inline/simplified avatars:
- components/landing/hero/avatars.tsx (hero flow)
- the bento "live feed" and "team" cards (components/landing/bento/*)
- the problem section guest/regular nodes in components/landing/Bento.tsx

Use <Illo>. Keep the existing animations working: the hero guest-to-avatar morph must swap the guest glyph for an avatar at the beam.

Verify typecheck/test/build. Take Playwright screenshots of the hero, bento and problem sections at 1440 and 390 width into screenshots/p1-*.png. Commit.
```

---

## P2: Stamp icon library (industries)

```text
Repo evecoo, branch php-agency. Follow docs/ILLUSTRATION-SYSTEM.md.

Create a stamp icon library in public/illustrations/stamps/. These are the icons that fill a digital stamp card.

- 16 industries:
  - kebab/döner
  - coffee cup
  - croissant
  - bread loaf
  - pizza slice
  - burger
  - sushi (nigiri)
  - bubble tea
  - ice cream
  - scissors/barber
  - nail polish
  - lipstick/beauty
  - flower bouquet
  - car wash drop
  - paw (pet shop)
  - generic star
- Each in 3 states as separate files:
  - `stamp-<name>-filled`: full colour, the illustration on a soft tinted disc
  - `stamp-<name>-empty`: same silhouette as a faded outline at 25% opacity of ink, so filled and empty slots align pixel-perfect
  - `stamp-<name>-mono`: single-colour currentColor, for dark pass backgrounds
- 40x40 viewBox, centered optical weight, consistent 1.75px stroke at 24px scale.

Better than the original checklist:
- The original uses photo-cutouts that blur at small sizes. Ours must be crisp at 20px and at 64px.
- Each icon is recognizable in silhouette alone (test: view the -mono at 20px).
- Filled vs empty difference is obvious for colour-blind users too: filled adds an inner highlight and a tiny check notch; don't rely on colour only.

Add components/illustration/StampGrid.tsx: renders N slots with K filled for a given stamp name.
- A stamped slot pops with a 260ms scale/rotate animation when K increases.
- prefers-reduced-motion: no animation.

Wire StampGrid into every place stamp dots/icons are drawn now:
- the feature card carousel
- the how-it-works Wallet pass
- the bento pass stack
- the customer card page /card
- the dashboard card preview

The business's card setting should be able to pick the stamp icon later. For now map a few demo businesses to icons in the landing data only. Do NOT change the PHP API.

Verify typecheck/test/build. Screenshots to screenshots/p2-*.png. Commit.
```

---

## P3: Wallet pass designs (12 demo businesses)

```text
Repo evecoo, branch php-agency. Follow docs/ILLUSTRATION-SYSTEM.md. Requires P2 (StampGrid).

The landing page shows wallet stamp-card passes in 3 places:
- the "Your card, your design" carousel (components/landing/features/*)
- the bento "Apple Wallet and Google Wallet" shuffling stack (components/landing/bento/*)
- the How-it-works phone story (components/landing/howitworks/*)

The original competitor shows ~12 designs; we currently show 5 with flat colours.

Create 12 pass designs as data plus art:
1. Momo's Kebab: deep red, kebab stamps
2. Brew Coffee: espresso brown, cups
3. Bakehouse: warm wheat, croissants
4. Sushi Kaito: charcoal with jade accent, nigiri
5. Barber Kings: black with brass, scissors
6. Nail Lounge: rose pink, polish
7. Pizza House: tomato and basil, slices
8. Burgers: mustard and charcoal, burgers
9. Bubble Bar: lilac, bubble tea
10. Gelato: pistachio and cream, ice cream
11. Bloom: sage, flowers
12. Paws: teal, paw

For each:
- A "strip" header illustration, public/illustrations/passes/strip-<slug>.svg, 375x123 (Apple pass strip ratio). Abstract-but-specific art: e.g. coffee beans and steam curves for Brew Coffee, a scissor and comb pattern for barbers. Built from the system palette and the industry accent. No photos, no text.
- A round business mark, public/illustrations/brands/mark-<slug>.svg: an original monogram, fictional, not resembling any real brand.
- A data entry in components/landing/passes.ts: name, holder, accent colours (bg, fg, label), stamp icon, stampsRequired, current stamps, reward key (add the reward strings to messages/en.json under landing.passes.<slug>.reward).

Build one <WalletPass> component used by all three places, so passes look identical everywhere. Layout:
- header: mark, business name, holder name
- strip art
- StampGrid
- 3 label/value fields: reward, powered by, progress
- QR area (keep the existing client QR renderer)
- correct pass corner radius
- subtle top highlight and a 2-layer shadow

Better than the original checklist:
- The original uses photo strips that look muddy when scaled. Ours are crisp vector at every size.
- Typographic hierarchy is clearer (field labels in small caps tracking 0.08em).
- Contrast: field text ≥ 4.5:1 on every pass background (add a vitest that computes it from the data).
- The carousel shows all 12 with dots.
- The bento stack shuffles through 6 of them.

Verify typecheck/test/build. Screenshots of all 12 passes in a grid to screenshots/p3-passes.png, plus the three sections at 1440/390. Commit.
```

---

## P4: Hero flow scene and background

```text
Repo evecoo, branch php-agency. Follow docs/ILLUSTRATION-SYSTEM.md. Uses P1 avatars if present.

The hero has an animated "guest flow" (components/landing/hero/*):
- grey one-time guests drift from the left toward a glowing vertical brand beam with the round logo node in the centre
- they turn into coloured regular customers with badges and drift right
- chips like "Comes back", "+1 stamp" and "New regular" float near the beam

Recording frames of the competitor's version are in reference/anim/hero/ (local only).

Upgrade the scene art:
1. public/illustrations/backgrounds/hero-field.svg: the funnel/landscape behind the flow.
   - Two soft curved bands converging at the centre, very light lavender-to-ice-blue.
   - A fine perspective line field converging to the beam.
   - Must tile/scale to 1440–2560 wide without visible seams (use preserveAspectRatio="xMidYMid slice" and keep detail in the middle 70%).
2. public/illustrations/scenes/beam.svg: the beam with a layered glow (3 gradient layers), animatable ids #beam-core, #beam-glow, #node-ring.
3. A subtle animated "pulse ring" when a guest crosses: CSS only, on #node-ring.

Better than the original checklist:
- The original background is flat with hard band edges. Ours has depth (soft gradient falloff, faint grain if the system allows).
- No chip ever overlaps an avatar. Implement simple lane-based collision avoidance in the existing rAF loop.
- On 390px mobile the scene keeps the beam centred, shows 3 actors, and the left chips are allowed. Currently they are hidden, so make them fit by scaling the stage.
- 60fps: animate only transform/opacity. Verify with a Playwright performance trace that no long tasks over 50ms occur during 5s of animation.

Verify typecheck/test/build. Record a 10s Playwright video of the hero at 1440 and 390 into screenshots/p4-hero-*.webm. Commit.
```

---

## P5: How it works phone story scenes

```text
Repo evecoo, branch php-agency. Follow docs/ILLUSTRATION-SYSTEM.md. Requires P3 (WalletPass) and P2.

The "How it works" section (components/landing/howitworks/*) is a ~20s auto-playing 3-step phone story:
1. Save card:
   - camera viewfinder on a shop counter with a QR standee
   - then a join web page where name and birthday type in
   - then the pass lands in Wallet
2. Give stamps:
   - scan confirmation "Stamp added 1/10"
   - stamps fill to 10/10
   - "reward ready" banner
3. Send message: lock-screen notifications stack in.

Reference frames are in reference/anim/howitworks/ (local only).

Create scene art in public/illustrations/scenes/:
- counter-scene.svg: what the phone camera sees. A warm shop counter (wood top, tiled back wall, a menu board with abstract lines, not text), a coffee machine or kebab spit silhouette depending on the demo business (make 2 variants: kebab, coffee). Centrally an acrylic QR standee:
  - leave an empty rect with id #standee-qr where the live QR is drawn
  - include an empty badge area #standee-badges where the official Wallet badges are placed as separate images
  - shallow depth-of-field feel via blurred background shapes (feGaussianBlur on background group only)
- join-header-<slug>.svg: patterned brand header for the join page (repeating food-icon pattern from the stamp library at 8% opacity on the brand colour).
- scan-success.svg: the full-screen scan confirmation background (brand gradient with radial light and subtle concentric rings, #ring-1..3 animatable).
- lockscreen-wallpaper.svg: an original abstract wallpaper (soft blue waves) for step 3. Make 2 colour variants.

Better than the original checklist:
- The original camera scene is a photo that looks pasted in. Ours is a cohesive illustrated scene in the same style as the rest of the page.
- The QR in the scene is a real scannable QR (existing renderer), not a picture.
- Step transitions use a shared-element feel: the pass slides from the join page into Wallet.
- Keep the stepper, click-to-jump, pause-offscreen and reduced-motion behaviour exactly as now.

Verify typecheck/test/build. Capture 1 screenshot per scene state (about 10 frames) at 1440 to screenshots/p5-*.png. Commit.
```

---

## P6: Feature cards (designer, push, dashboard)

```text
Repo evecoo, branch php-agency. Follow docs/ILLUSTRATION-SYSTEM.md. Uses P3 WalletPass and P5 lockscreen wallpaper.

The three feature cards (components/landing/features/*) are:
- A "Your card, your design": pass carousel
- B "Push messages to every guest": phone lock screen where notifications slide in and stack
- C "Everything at a glance": mini dashboard with returning % ring, customer count, visits-by-hour bars and visits-by-weekday bars

Upgrade:
- A: Already handled by P3; add a soft studio backdrop (public/illustrations/backgrounds/card-studio.svg: light radial spotlight and a faint shadow ellipse under the pass) so the pass looks like a product shot.
- B:
  - Use the P5 lockscreen wallpaper.
  - Notification app icons: use the fictional brand marks from P3 (mark-<slug>.svg) inside an iOS-style rounded-square icon frame.
  - Add a subtle glass blur look to notifications (backdrop-filter with a solid fallback).
- C: Create public/illustrations/icons/ for 8 dashboard glyphs (customers, returning, clock, calendar, stamp, gift, message, trend). They should be consistent with Material Symbols weight 400 outlined so they mix with existing icons. Use them in the tiles.

Better than the original checklist:
- Each card visual sits on the same baseline and has the same visual weight. The original's three visuals have mismatched heights.
- Numbers use tabular-nums.
- The ring and bars animate in on reveal and then breathe slowly; they don't jump.
- All three work at 390px without clipping.

Verify typecheck/test/build. Screenshots to screenshots/p6-*.png. Commit.
```

---

## P7: Bento feature grid

```text
Repo evecoo, branch php-agency. Follow docs/ILLUSTRATION-SYSTEM.md. Uses P1, P3.

The bento grid (components/landing/bento/*) has six animated cards. Reference frames: reference/anim/bento/ (local).
1. Automations: rows with toggles that expand to show the sent message.
2. Apple/Google Wallet: shuffling pass stack.
3. Live feed: new stamp rows slide in.
4. Team access: staff rows with permission chips.
5. Birthday greetings: phone with a notification and confetti.
6. Nearby reminder: map with a pulsing pin.

Create:
- public/illustrations/scenes/map-tile.svg: an original light street-map tile.
  - Blocks, two main roads, a park, a river curve, all in palette neutrals.
  - Must tile seamlessly 2x2.
  - Pin anchor point marked by #pin-anchor.
- public/illustrations/scenes/confetti.svg: 18 confetti pieces (ribbons, dots, stars) with classes .c1–.c18 for CSS physics-like falling.
- public/illustrations/icons/automation-*.svg for the three automation rows (win back, welcome, birthday): small duotone icons on tinted rounded squares.
- Use P1 avatars in live feed and team rows; P3 passes in the stack.

Better than the original checklist:
- Equal column bottoms and no empty bands in any card at 1440 (measure in Playwright, tolerance 8px).
- The confetti never covers the notification text.
- The map pin pulse is smooth and a reduced-motion user sees a static pin with one ring.
- Each card has a tiny shared "live" detail language: the same green dot plus "Live" label component everywhere it is used.

Verify typecheck/test/build. Screenshots to screenshots/p7-*.png (1440 + 390). Commit.
```

---

## P8: Problem, service, dashboard preview, pricing and logo strip

```text
Repo evecoo, branch php-agency. Follow docs/ILLUSTRATION-SYSTEM.md.

Upgrade the remaining landing sections (components/landing/Bento.tsx `Problem`, Service.tsx, DashPreview.tsx, PricingFaq.tsx, and the logo strip in Features.tsx):

- Problem (3 cards: 60% loss bar, 65% revenue ring, guest→evecoo→regular flow with travelling dots). Add small spot illustrations at most 32px high in each card's corner: a leaving footstep trail, a coin stack, a returning arrow loop, in the system style. Keep the existing animations.
- Service ("We take care of everything"):
  - Create scenes/counter-stand.svg: the printed counter stand ("Aufsteller") the company mails to customers, an acrylic A6 stand on a café counter with a QR placeholder #stand-qr.
  - Create scenes/parcel.svg for "we send it to you".
  - The chat card: build a messenger-style bubble UI in HTML/CSS (no WhatsApp logo or trademark styling); generic green check ticks.
- Dashboard preview: generate an original area-chart background gradient and a "glass" tile treatment; keep the data driven by the existing component.
- Pricing:
  - A subtle pattern of the stamp library at 4% on the navy card (backgrounds/pricing-pattern.svg, tileable).
  - Check icons from P6.
- Logo strip "Trusted by …": 10 original fictional wordmarks in public/illustrations/brands/wordmark-<slug>.svg (single colour, currentColor, varied typographic personalities using shapes, not fonts). No real company names or marks. Make the strip an infinite marquee (CSS, pauses on hover and for reduced motion).

Better than the original checklist:
- The original's logo strip and counter-stand photo look generic and slightly blurry. Ours are crisp, cohesive and clearly custom.
- All sections at 390px have no horizontal scroll.

Verify typecheck/test/build. Screenshots to screenshots/p8-*.png. Commit.
```

---

## P9: Optional photographic strips (only if you want photos)

Run this only if you prefer photos over vector strips for the passes. Do the generation with an image model, for example Higgsfield via its connector, then let Claude Code integrate the results.

```text
Repo evecoo, branch php-agency.

Generate 12 photographic pass strips, one per demo business in components/landing/passes.ts. Specs for each:
- 1125x369 px (3x Apple strip)
- shallow depth of field
- warm natural light, top-left
- clean negative space on the left third for text
- no people's faces, no text, no logos
- consistent colour grade across all 12 (slightly warm, low contrast, lifted blacks)

Prompts, one per business:
- "close-up of a freshly made döner kebab wrap on a wooden board, warm café light, shallow depth of field, editorial food photography, negative space left"
- similar for espresso cup with latte art; croissants on linen; nigiri sushi on slate; barber scissors and comb on leather; nail polish bottles in soft pink light; pizza slice with basil; gourmet burger; bubble tea cups; pistachio gelato cones; flower bouquet on a market stall; dog toy and treats on teal background

Save them as WebP (quality 78, ≤ 60 KB each) in public/illustrations/passes/photo/strip-<slug>.webp.

Add a `strip: 'vector' | 'photo'` option to the pass data and to WalletPass:
- the photo uses <img loading="lazy" decoding="async"> with explicit width/height
- the vector stays the default

Verify typecheck/test/build and the asset test (update it to allow the WebP files in photo/ only, ≤ 60 KB). Commit.
```

---

## P10: Integration, consistency and "better than evecoo" audit (run last)

```text
Repo evecoo, branch php-agency. All asset prompts (P0–P8, optionally P9) have been run. Read docs/ILLUSTRATION-SYSTEM.md.

1. Consistency pass:
   - Open every SVG in public/illustrations and every landing section.
   - Unify any drift in stroke width, radius, shadow and palette. Fix it at the source file, not with CSS overrides.
2. Performance:
   - Run npm run svg:optimize.
   - Total public/illustrations must be ≤ 400 KB (vector) plus ≤ 720 KB (optional photos).
   - Landing LCP image must not be an illustration.
   - Run Lighthouse (the preinstalled Chromium at /opt/pw-browsers/chromium, flags --headless --no-sandbox) on the built page served with `php -S 127.0.0.1:8080 -t dist/public_html php/router.php` after `npm run bundle`.
   - Targets: Performance ≥ 90 mobile, Accessibility ≥ 95, CLS ≤ 0.02.
3. Motion:
   - Every animation pauses off-screen and on a hidden tab.
   - prefers-reduced-motion shows a complete static state.
   - Verify with Playwright emulateMedia.
4. "Better than the original" audit:
   - Compare section by section against reference/*.png and reference/anim/** frames (local).
   - Write docs/DESIGN-AUDIT.md with one row per section: what the original does, what we do, verdict (better / equal / worse) and a screenshot pair.
   - Fix every "worse" or "equal" where a clear improvement is possible, then update the table.
5. Legal hygiene:
   - grep the repo for "evecoo.de" image URLs, real brand names in the passes/wordmarks, and redrawn Apple/Google badges.
   - The badges must be the official unmodified files.

Verify typecheck/test/build/bundle. Commit. Print the final audit table and Lighthouse scores in your reply.
```

---

## After the prompts

To deploy after the merges, ask me (or Claude Code): "rebuild the bundle and redeploy to the Hostinger Agency site". The upload, config and cache steps are written up in README.md under "Hostinger Agency: verified deploy notes".
