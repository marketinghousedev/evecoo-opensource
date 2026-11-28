# Illustration system

One vector language for the whole landing page: flat, friendly, precise. Line-drawn objects on
soft colour fields, brand violet as the hero, warm food accents as seasoning. No photos-plus-clipart
mix, no stock avatars. File rules and naming: `public/illustrations/README.md`. Machine-readable
palette: `components/illustration/palette.ts` (the asset test rejects any other hex).

## Palette

| Role | Tokens |
| --- | --- |
| Brand | brand `#6D3BF5` (white text 5.8:1), brand-hover `#5A2BE0`, brand-deep `#4C1D95`, brand-light `#8B5CF6`, brand-soft `#F1EBFE`, brand-muted `#CDBDFB` |
| Neutrals | navy `#0B1F44`, ink `#071130`, muted `#3A4160`, border `#D7DDE7`, line `#EEF1F8`, bg `#F8F8FC`, white |
| Status | success `#12B76A` (soft `#E3F7EE`), success-strong `#12945A`, loss `#D6244B` (soft `#FCE4E9`) |

Warm accents (solid on white, contrast ratio in brackets; `-soft` tints are fills only):

| Accent | Solid | Soft | Used for |
| --- | --- | --- | --- |
| espresso | `#8A4B2A` (6.7:1) | `#F3E6DC` | coffee, chocolate, barber leather |
| honey | `#B86E00` (4.0:1) | `#FCEFD6` | bread crust, baklava, kebab, beer |
| tomato | `#D4421C` (4.6:1) | `#FCE4DC` | pizza, sauce, chili |
| salmon | `#E5674A` (3.3:1) | `#FDE8E2` | sushi, peach, nail coral |
| berry | `#C2366F` (5.2:1) | `#FAE3EC` | nail studio, berries, cocktails |
| herb | `#5E7A1F` (4.9:1) | `#EAF0DA` | basil, salad, matcha, plants |

Rules:
- **60/30/10.** Each illustration: neutrals and soft tints about 60%, brand or one accent about
  30%, at most one second accent about 10%. Never more than two accents in one asset.
- Brand violet is reserved for "the product" (pass, phone UI, stamps earned). Food and shops use
  the accents.
- `success #12B76A` is only 2.6:1 on white: use it as a large fill or dot. Use `#12945A` where
  green carries meaning on white. `loss` is only for the "lost customer" story.
- Lighter steps come from `fill-opacity`, not new hexes. Recolourable parts use `currentColor`.

## Line, shape and light

- **Stroke.** Icons: 24 px grid, 1.75 stroke, 2 px safe padding. Spot illustrations and scenes
  are drawn at their 1x render size with a 2 px outline (1.5 px for small inner detail). Round
  caps and round joins everywhere. Outline colour: navy `#0B1F44`, or `currentColor` in icons.
- **Fill and outline.** Objects are filled shapes with a navy outline; the fill may sit offset
  1–2 px down-right of the outline for a printed, hand-made feel (one offset size per asset).
- **Radii.** Icons: 2 on the 24 grid. Illustrated cards and passes: 12 (= `--radius-sm`).
  Panels: 20 (= `--radius`). Phones: 28 outer, 20 screen. Pills: fully round. No sharp
  90-degree corners on objects.
- **Light** comes from the top-left. Each object gets at most one shade: a navy overlay at
  8–12% opacity on its bottom-right side, and optionally one white highlight at 60% on the
  top-left edge. No multi-stop gradients; scenes and backgrounds may use one two-stop linear
  gradient running top-left to bottom-right.
- **Shadow** is never baked in as a blur (no `<filter>`). Inside SVGs: a flat contact ellipse,
  navy at 8% opacity, under grounded objects. Lift comes from CSS on the wrapper, two soft
  layers tinted navy, never black: `--illo-shadow` in `app/globals.css`
  (`drop-shadow(0 1px 1px rgba(11,31,68,.06)) drop-shadow(0 10px 18px rgba(11,31,68,.10))`), via
  the `.illo-lift` class.
- **Texture: none.** No grain, no noise, no paper. This is decided; do not add it per asset.

## People

- Simplified, warm, non-caricatured: round heads, dot eyes, a short curved smile, no noses
  or a single short line, hands as rounded mittens. Same head-to-body ratio across the library.
- Skin, light to deep: `#F6D7C3` `#EBBF9F` `#D6A07A` `#B97D56` `#8D5A3B` `#5E3A26`.
- Hair: `#2B1D16` `#4A2E1F` `#7A4A2A` `#B07A3F` `#D9B26A` `#9AA3B5` (grey).
- Across any visible group, use at least four skin tones and mixed ages, genders and hair
  types. Clothing uses the palette (brand, accents, soft tints), never logos or text.

## Motion hooks

Every part that can move gets a stable class (`.beam`, `.stamp-slot`, `.steam`) or, for
`url(#…)` targets, an id namespaced `<file>__<part>`. Animate `transform` and `opacity` only, with
`transform-box: fill-box`. Every animation needs a complete static state for
`prefers-reduced-motion`.

## Using an illustration

```tsx
import { Illo } from '@/components/illustration/Illo';          // server components
<Illo name="icons/ui-stamp" className="my-icon" />               // decorative: aria-hidden
<Illo name="scenes/beam" title="Stamp sent to the phone" />      // meaningful: role="img"

import { IlloSvg } from '@/components/illustration/IlloSvg';     // 'use client' components
import { iconsUiStamp } from '@/components/illustration/illo-data';
<IlloSvg data={iconsUiStamp} />                                   // ships only this asset
```

## Do and don't

| Do | Don't |
| --- | --- |
| Navy 2 px outline, round caps, one shade from the top-left | Mixed stroke widths, square caps, light from below |
| Brand violet for the pass, phone and earned stamps | Brand violet on food, or food accents on product UI |
| Copy in `messages/*.json`, laid over the art in HTML | Words, prices or logos baked into an SVG |
| CSS `.illo-lift` shadow, flat contact ellipse | Blurred `<filter>` shadows, pure black shadows |
| Original, fictional shops and marks | Tracing any competitor's art or any real company's logo |
| Official Apple/Google Wallet badge files, unmodified | Redrawn or recoloured wallet badges |
| `currentColor` for parts recoloured by CSS | Off-palette hexes or colour names |
