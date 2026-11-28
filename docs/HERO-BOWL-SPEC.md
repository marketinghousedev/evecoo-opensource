# Hero B: bowl-glow scroll hero (owner-supplied spec, adapted)

Source: the owner supplied a motion spec, written originally for another product ("Halden", port operators). We keep its **mechanics and numbers exactly** and replace the **content and image** with ours.

## Adaptations (these override the original spec)

- **Language and fonts.** Copy is English via `messages/en.json` (new keys under `landing.heroB.*`). The product name comes from `common.appName`, never hardcoded, because a rebrand is pending. The font stays Hanken Grotesk.
- **Hero headline (`#h1`).** Use the current hero headline keys: "The system that brings your customers back" plus the highlighted `.hl` "again and again". Keep the existing subline, primary CTA, "100% free to try | No credit card" line and the social-proof badge, as fade-up elements.
- **Hero lower area.** Place the existing guest-flow stage (`components/landing/hero/HeroFlow`) in the lower part of the hero, with a transparent background so the bowl glow shows through. It fades up. Its own hero-field background is dropped in variant B.
- **Statement (`#stmt`).** 4 lines:

  > {appName} is a digital stamp card
  > that lives in your guests' wallets, stamps every visit,
  > sends offers, wins back one-time guests and does
  > everything in between to keep your shop full

  The `.hl` highlight goes on "digital stamp card".
- **Dark split, left column.**
  - `h2`: "Loyalty that works<br>like your shop does".
  - Row `h3`: "Cafés, bakeries & barbers".
  - Row `p`: **"More regulars. Fuller days. No paper cards."** (white, weight 500), followed by "Stamps, push messages, birthday greetings and win-backs run on their own – so your team can focus on the guests in front of them."
- **Dark split, right column.** Do not use the ship image. Use the coffee-hills landscape `backgrounds/poster-coffee-hills.svg`, rendered via IlloSvg or as an img, with object-fit cover equivalent. Keep the scale-in from 1.08 to 1. Make it swappable through an optional photo src constant, so a real photo can replace it later. Alt / aria: "Coffee plantation hills at sunrise".
- **Nav.** Use the existing site nav. Toggle a class `on` when statement p > .4: the "Start free" CTA gets a filled emphasis state. Do not rebuild the nav.
- **Variants.**
  - Variant B is the new default.
  - The previous hero stays as variant A.
  - Selection is via the URL `?hero=a` or `?hero=b`. Also add a small floating "Compare: A | B" pill, bottom-right, with safe-area-aware offsets. It switches the variant client-side and updates the query without reloading.
  - The bowl glow, statement and split exist only in variant B.
- **Reduced motion.** No canvas animation: draw the q=0 bowl once. Every letter reveal shows its final state immediately. There is no pin rise. The statement and split are simply visible.
- **Performance.**
  - The canvas is 96×60 and is painted via ImageData each rAF only while the hero/statement region is near the viewport or the intro is running. Stop it when the page is hidden or after the bowl is solid cyan and stable; at that point paint once and set the `.atmo` background to `#8fd5f1`.
  - Avoid layout thrash: read `scrollY` once per frame.
  - Below the split, `.atmo` must not show through. Later sections keep their own backgrounds, so ensure each following section has an opaque background (the page bg `#F8F8FC`).

## Mechanics: implement exactly

### Bowl glow (`#bg`)

**Canvas setup.** `.atmo` is `position:fixed; inset:0; z-index:0; pointer-events:none; background:#fff`. The canvas is 96×60, absolute, `inset:0`, 100%×100%. `main` is `position:relative; z-index:1`.

**Coordinates.** y runs 0..1, top to bottom. x is measured from the centre in height units: `px = |x/W − .5| · aspect`, where `aspect = innerWidth/innerHeight`.

**Edge curve.** 48 points with `yy` running from −0.3 to `tip`: `CX = half·aspect·(1 − yy/tip)^0.72`, `CY = yy`.

**Signed distance.** Use the exact distance to the nearest **segment** of that polyline. It is negative inside, i.e. when `py < tip` and `px < half·aspect·(1 − py/tip)^0.72`.

**Round the bottom.** Subtract `RND = 0.25`.

**Fill.** `g = 1 − smoothstep((sd + soft)/(2·soft))`.

**Colour.**
- For `g < .38`: mix `#ffffff` → `#d2daff`, eased by smoothstep(g/.38).
- Otherwise: mix `#d2daff` → `#8fd5f1`, eased by smoothstep((g−.38)/.62).

**Idle drift.** `tip += sin(t·0.00033+1.3)·0.02` and `half += sin(t·0.0005)·0.015`.

**Scroll table.** With `q = scrollY/innerHeight`, interpolate linearly between these keys:

| q | 0 | .03 | .08 | .18 | .40 | .66 | .87 | 1.15 | 1.43 | 1.8 |
|---|---|---|---|---|---|---|---|---|---|---|
| tip | .30 | .45 | .65 | .80 | .95 | 1.05 | 1.05 | 1.10 | 1.30 | 2.40 |
| half | .34 | .38 | .38 | .38 | .38 | .46 | .66 | .90 | 1.60 | 3.00 |
| soft | .22 | .26 | .22 | .22 | .19 | .16 | .13 | .10 | .10 | .10 |

**Inertia.** Each frame, `cur += (tgt − cur)·0.12`.

**Intro.**
1. Start at `tip −.3, half .3, soft .1`.
2. After 0.25s, smoothstep over 1.05s to the q=0 values.
3. During the intro, set `cur` directly instead of easing.

### Letter reveal (shared)

**Split.** Wrap each word in an `inline-block; nowrap` span. Wrap each character in its own span. Whitespace stays as text, and `<br>` is kept. Characters inside `.hl` are flagged.

**Progress.** `paint(chars, p, spread, final, accent, ghost)`: `t = clamp((p·(1+spread) − i/n)/spread)`.

**States.** Map `t` like this:

| t | opacity | colour | blur |
|---|---|---|---|
| 0 | 0 | ghost | 8px |
| 0 → .35 | 0 → 1 | ghost | 8 → 1.5px |
| .35 → .70 | 1 | ghost → accent | 1.5 → 0px |
| .70 → 1 | 1 | accent → final (flagged characters end at `#5b7cf0`) | 0 |

Colour and blur are set inline.

**Where it is used.**
- **Hero h1:** time-based, 0 → 1 over 1.25s from load. Spread .35, final `#0b1d3a` (use the site's ink, `#071130`, if closer to the system), accent `#3f7cff`, ghost white.
- **Statement:** scroll-based, spread .16, same colours.
- **Dark h2:** scroll-based, spread .35, final white, accent `#8fe6f4`, ghost `#5c6f92`.

The reveal accents `#3f7cff`, `#8fe6f4`, `#5c6f92`, `#5b7cf0` and `#0e1f3d` are CSS/JS colours, not SVG. Add them as named tokens in `globals.css` (`--glow-*`), not in `palette.ts`.

### Hero

The hero is 100vh with a min-height of 640px. Fade-ups start as `opacity:0; translateY(14px)`. Once `body.ready` (or a wrapper class) is set, each runs `fu .9s var(--ease) forwards` with `animation-delay: var(--d)`.

### Statement (pinned)

**Section.** `.statement{position:relative; height:306vh; margin-top:-31vh; pointer-events:none}`. The pin is `.pin{position:sticky; top:0; height:100vh}`.

**Text.** `#stmt` is absolute, `top:41.5vh`, left and right 0, centred. Weight 400, `clamp(20px,2.8vw,42px)`, line-height 1.16, letter-spacing −.03em, nowrap, `will-change:transform`. Put a space after each `<br>`.

**Rise.** `s = clamp((q − .69)/.74)`, then `translateY(.205·(1−s)²·innerHeight)`.

**Reveal.** `p = clamp((q − .56)/2.03)`. The nav CTA gets `.on` when `p > .4`.

### Dark split

**Section.** `.split{position:relative; z-index:2; background:#0e1f3d; color:#fff; min-height:100vh; display:grid; grid-template-columns:58.3% 41.7%}`.

**Left column (`.l`).** `padding-left:var(--gut)`, with a 1px vertical guide at `left:var(--gut)`, full height, in `rgba(255,255,255,.12)`.

**Headline (`h2`).**
- Weight 400, `clamp(32px,3.15vw,48px)`, line-height 1.08, letter-spacing −.03em, padding `21vh 0 0 6.2vw`.
- Reveal: `p2 = clamp((.8 − splitTop/innerHeight)/.65)`.

**Row.**
- Layout: `margin-top:6.4vh`, a 1px top border in the line colour from the guide to the image, grid `1fr 1.05fr`, gap 24px, padding `3vh 6vw 0 6.2vw`.
- `h3`: weight 400, `clamp(17px,1.4vw,21px)`.
- `p`: `clamp(13px,1.1vw,16px)`, line-height 1.38, `rgba(255,255,255,.5)`, max-width 20em.
- Motion: starts at `opacity:0; translateY(14px)` and transitions in over .9s once `p2 > .92`. It reverses when you scroll back up.

**Right column (`.r`).** `position:relative; overflow:hidden`. The image scale is `1.08 − 0.08·clamp(1 − splitTop/innerHeight)`, with origin `50% 60%`.

### Script order

1. Split the text and paint everything at p=0.
2. On the first rAF, set ready, then start the intro loop and the canvas loop.
3. Run `onScroll` (passive) on scroll, resize and during the intro. It updates the bowl targets, the statement, the nav CTA, the split and the image scale.

### Responsive (≤ 820px)

- **Hero headline:** `top:17vh`, 7.4vw, wrapping allowed. Adapt the remaining hero children sensibly; the guest-flow stage sits below the CTA.
- **Statement:** wraps normally at 23px, max-width 15em, `<br>` hidden.
- **Split:** one column, rows `auto 70vh`. h2 padding `16vh 0 0 6vw`. The row is single-column with padding `3vh 6vw 6vh`.
- **No horizontal scroll at 390px.**
