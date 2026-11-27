# public/illustrations

Every illustration on the site lives here and follows `docs/ILLUSTRATION-SYSTEM.md`.
`tests/assets.test.ts` enforces the rules below; `npm test` fails on any violation.

## Folders

| Folder | Holds | Budget |
| --- | --- | --- |
| `avatars/` | people, faces, busts | 8 KB |
| `stamps/` | stamp glyphs per industry | 8 KB |
| `passes/` | wallet pass strips and pass art | 8 KB |
| `scenes/` | multi-object scenes (hero flow, phone story, counter) | 24 KB |
| `backgrounds/` | fields, spotlights, tileable patterns | 8 KB |
| `brands/` | fictional marks and wordmarks; official store badges | 8 KB (badges exempt) |
| `icons/` | UI glyphs on the 24 px grid | 8 KB |

Subfolders are allowed (e.g. `passes/photo/`); they inherit the top folder's rules.

## Naming

- kebab-case only: `<group>-<name>[-<variant>].svg`, where `<group>` is the asset family
  inside the folder. Examples: `passes/strip-kebab.svg`, `brands/mark-kiez-kaffee.svg`,
  `icons/automation-winback.svg`, `avatars/person-mira-wave.svg`. A one-off scene may be a single
  word (`scenes/beam.svg`).
- Inline it with `<Illo name="passes/strip-kebab" />` (the key is the path without `.svg`).
- `id`s must be namespaced with the file's base name and two underscores:
  `strip-kebab__steam`. Prefer classes (`.stamp-slot`, `.beam`) as animation hooks; use ids only
  for `url(#…)` references (gradients, clip paths, masks). Ids are unique across the library.

## File rules

- **SVG only.** Exceptions: the official badges in `brands/` (below). Photos are not part of the
  vector library; a prompt that adds them must extend the test for exactly that subfolder.
- **Optimized**: run `npm run svg:optimize` after adding or editing a file (SVGO with
  `svgo.config.mjs`, which keeps ids, classes, basic shapes and separate paths). It also
  regenerates `components/illustration/illo-data.ts` and `illo-index.ts`; commit those too.
- Root `<svg>` has a `viewBox` and **no** `width`/`height`; size it with CSS.
- No `<image>`, `data:` URIs or other raster, no external `href`.
- **No text** (`<text>`, `<tspan>`, fonts): every word stays in `messages/*.json`. Letter-like
  marks in fictional wordmarks are drawn as paths.
- No `<style>`, `<script>`, `<foreignObject>` or `<filter>` (inline SVG styles leak into the page,
  filters are slow; shadows come from CSS, see the system doc).
- Colours: only palette hexes from `components/illustration/palette.ts`, or `currentColor` for
  any part meant to be recoloured from CSS. No colour names.

## Official Apple Wallet and Google Wallet badges

Never redraw, recolour, crop or re-optimize these. Download the official files from Apple's
"Add to Apple Wallet" guidelines (developer.apple.com/wallet/add-to-apple-wallet-guidelines) and
Google's Wallet brand guidelines (developers.google.com/wallet/generic/resources/brand-guidelines),
and place them here unmodified:

- `brands/badge-apple-wallet-<locale>.svg`
- `brands/badge-google-wallet-<locale>.svg` (or `.png` if that is the official format offered)

Only renaming is allowed. Files matching `brands/badge-*` are skipped by `svg:optimize`, by the
asset test and by the Illo index; render them with a plain `<img>` with the correct alt text.
