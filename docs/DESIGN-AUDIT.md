# Design audit: rebuild vs. evecoo.de (P10)

Compared section by section at 1440 px against `reference/home-desktop.png` and the recording
frames in `reference/anim/{hero,features,howitworks,bento}/f###.jpg`. Screenshot pairs live next to
the reference material and are **git-ignored** (they contain evecoo.de imagery):
`reference/audit/NN-<section>-original.png` and `reference/audit/NN-<section>-ours.png`.

## Section table

| # | Section | Original (evecoo.de) | Ours | Verdict |
| --- | --- | --- | --- | --- |
| 1 | Hero | Static guest/regular field, photo avatars, one beam; logos of real shops in the proof pill | Deterministic flow: outline guests cross the beam and turn into illustrated regulars, chips avoid each other (fade instead of overlap), one seamless light band behind the ONE-TIME GUESTS / REGULARS labels, pauses off screen and in hidden tabs, full static frame for reduced motion. LCP is the H1 text. | better |
| 2 | Logo strip | Grey real customer logos (third-party marks) | Fictional drawn wordmarks in a paused-off-screen marquee, AA contrast eyebrow | better (legal) / equal (visual) |
| 3 | Features (3 cards) | Photo pass, phone lock screen with real-looking brand logos, static mini dashboard | Pass carousel with illustrated strips and stamp icons, lock screen with drawn marks, live mini dashboard (ring label now 16 px, was ~8 px) | better |
| 4 | How it works | Phone story with a photographed kebab counter, raster standee | Fully drawn counter scene (vector, CSS depth of field), real scannable QR, join page, wallet pass with döner stamp icons, scan success and lock screen scenes | better |
| 5 | Bento (6 cards) | Wallet stack (photo passes) with buttons below a fade, live feed, map, team, birthday | Same structure, vector passes; wallet stack now shows three readable pass headers, strip and stamp row, fades out above the wallet pills (no overlap, no crop) | better |
| 6 | Problem (3 steps) | Stats cards + plain step labels | Same cards plus illustrated spot icons and illustrated avatars, AA contrast footnote | better |
| 7 | Service | Photographed acrylic standee, photo pass | Drawn standee and parcel scene, messenger chat, checklist; print copy in a real serif stack | equal (photo standee is richer; vector is consistent and lighter) |
| 8 | Dashboard preview | Static dashboard; overlapping eyebrow labels ("Rundum-Service"/"Dashboard") and a real shop logo | Glass tiles on a drawn area chart, fictional shop, no overlapping labels | better |
| 9 | Pricing | Navy price card + feature list | Same layout, pattern background, inline SVG check glyphs | equal (no clear improvement without changing the offer) |
| 10 | FAQ | Two-column accordion | Same, inline SVG chevrons | equal |
| 11 | Final CTA + footer | CTA band, footer | Same; footer column titles are h3 (heading order) | equal |

## What P10 changed

- Stamp icons: `kebab` redrawn as a döner spit (skewer through, bumpy cone, slice ridges), so it no
  longer reads as a drink cup at 20 px; `scissors` has hollow finger rings and a pivot, `flower` is a
  five-petal bloom on a stem, `pizza` has a fuller slice with three toppings (`scripts/gen-stamps.mjs`).
  The join-page header pattern was regenerated from the new kebab art.
- Removed unused assets/code: `scenes/counter-scene-coffee`, `scenes/join-header-coffee`,
  `scenes/lockscreen-wallpaper-violet` and `components/landing/demoStamps.ts` (`DEMO_STAMPS`).
- Hero: merged the two band shapes in `backgrounds/hero-field.svg` (the gap was the faint stripe at the
  labels); chips that cannot find a free lane fade out instead of overlapping (overlap frames 1.0–2.0 % → 0–0.8 %).
- Bento wallet stack re-laid out; feature dashboard ring label enlarged.
- Material Symbols web font removed: the 8 landing glyphs are inline SVG (`components/landing/Icon.tsx`);
  CSP no longer allows Google Fonts. Saves ~325 KB and a render-blocking third-party stylesheet.
- `content-visibility: auto` on below-the-fold sections; gzip in `deploy/htaccess.root` (mod_deflate)
  and in the dev router; meta description; favicon (`app/icon.svg`).
- Every landing section's CSS animations pause while it is off screen or the tab is hidden
  (`Reveal.tsx` sets `data-paused`). JS loops (hero rAF, tickers) already paused.
- Contrast fixes to WCAG AA on small grey/green labels; wallet pills in the bento no longer carry a
  redrawn Apple logo or Google "G", and the join-page wallet button uses a generic monochrome pass glyph.

## Measurements (local, `php -S` + `php/router.php`, gzip on)

| Check | Result | Target |
| --- | --- | --- |
| Lighthouse mobile (3 runs) | Performance 92–95, Accessibility 100, Best practices 100, SEO 100; FCP/LCP 1.4 s, TBT 250–340 ms, CLS 0 | ≥ 90, ≥ 95, CLS ≤ 0.02 |
| Lighthouse desktop | 100 / 100 / 100 / 100; LCP 0.4 s, CLS 0 | |
| LCP element | `section.hero h1` (text) | not an illustration |
| `public/illustrations` | 161.9 KB of SVG (no photos) | ≤ 400 KB |
| axe (WCAG 2 A/AA) at 412 and 1440 px | 0 violations | |
| Off-screen running CSS animations | 0 at top, middle and bottom of the page | 0 |
| Hidden tab | hero loop frozen | paused |
| `prefers-reduced-motion` (Playwright `emulateMedia`) | 0 infinite animations, every section revealed, hero shows a full static frame, no horizontal scroll at 390/1440 | complete static state |

## Open items (need the owner)

- **Official wallet badges are missing.** Download the unmodified files from Apple's "Add to Apple
  Wallet" guidelines and Google's Wallet brand guidelines into
  `public/illustrations/brands/badge-apple-wallet-<locale>.svg` and
  `badge-google-wallet-<locale>.svg|png`, then render them with `<img>` in the How-it-works standee and
  join screen and the bento wallet card. Until then those spots use neutral text pills; nothing is redrawn.
- **Unverified marketing claims.** "One of the leading digital stamp card providers" and "Hundreds of
  businesses use evecoo" (hero proof pill) are not backed by data in the repo. Confirm or rephrase
  before launch (copy was not changed in P10).
- **Safari/WebKit not tested.** WebKit is not installed here, so the CSS `filter: blur()` depth of field
  on the counter scene (`.hw-vf-art .dof`), `mask-image` fades and `content-visibility` were only
  verified in Chromium. Safari 18+ supports all three; check once on a real iPhone.
- Service standee: the original's photographed acrylic stand is richer than our vector stand; a
  photo strip (skipped P9) would be the only way to beat it.
- Hero chips: a residual 0–0.8 % of sampled frames still show a chip mid-fade touching a guest.
