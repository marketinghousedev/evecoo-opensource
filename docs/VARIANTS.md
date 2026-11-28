# Section variants (A/B compare)

Every landing section can have several versions. Visitors (and reviewers) switch between them with
the floating **Compare** panel or the URL, with no reload.

## URL

| URL | Effect |
| --- | --- |
| `/?how=b` | section `how` shows variant `b` |
| `/?how=b&problem=b` | several sections at once |
| `/?all=b` | every section that has a `b` variant shows it |
| `/?all=b&how=a` | a specific parameter beats `all` |

Without a parameter each section shows its registry default: `a` everywhere, except `hero`, where `b` is the
default. Unknown ids are ignored. The pre-paint script in `app/layout.tsx` sets `data-<section>` on `<html>`
before first paint, so the default never flashes.

## Adding a B version (one registry entry, no edits to shared files)

1. Create your component anywhere (e.g. `components/landing/howb/HowItWorksB.tsx`). It takes no props and
   renders the whole section (usually a `<section id="how">`; keep the same anchor id as variant A).
2. Open `components/landing/variants.ts`, import it and add it to the section's `variants`:

```ts
how: { label: 'How it works', default: 'a', variants: { a: HowItWorks, b: HowItWorksB } },
```

That is all. The page renders every section through `<VariantSlot section="how" />`, the Compare panel lists
every section with more than one variant, and `?how=b` works. To make `b` the default, set `default: 'b'`.
To add a new section, add a registry entry and one `<VariantSlot section="..." />` line to `app/page.tsx`.
Variant ids are short lower-case words or letters (`a`, `b`, `c`, `tall`); the panel shows them upper-cased.

## API (`components/landing/variant-runtime.tsx`)

```tsx
const v = useVariant('how');                      // 'a' | 'b' | ... (registry default on the server and first render)
<Variant section="how" v="b"><Extra /></Variant>  // children render only while how === 'b'
<VariantSlot section="how" />                     // renders the active registered component
setVariant('how', 'b');                           // programmatic switch; updates the URL via history.replaceState
setVariant('all', 'b');                           // same as ?all=b
```

`useVariant(section, ['a', 'b'])` optionally restricts the accepted ids. `<ComparePanel />` is mounted once
by `app/page.tsx`; it is collapsed by default, sits bottom-right above the safe area, and each row is a
segmented control (`aria-pressed`).

## Notes for variant authors

- The hero's B version also drives page-level extras (`BowlAtmo`, `hb-on`): read them with
  `useVariant('hero')` in the page, not inside the registry.
- Sections are wrapped in `<div data-vslot style="display:contents">`; use `:is(main, [data-vslot]) > section` in
  global selectors instead of `main > section`.
- Hide server-rendered markup of non-default variants with the generated rule
  `html[data-<section>="<id>"] [data-vslot="<section>"]:not([data-v="<id>"])`; you do not need to write it.
- Copy goes in `messages/en.json` like everything else; the panel's section labels are plain registry strings.
