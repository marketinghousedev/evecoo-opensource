// The illustration palette (docs/ILLUSTRATION-SYSTEM.md). Every hex colour inside
// public/illustrations/**/*.svg must be one of these; tests/assets.test.ts enforces it.
// Use fill-opacity / stroke-opacity for lighter steps instead of inventing new hexes.

/** Core UI colours, mirrored from app/globals.css. */
export const core = {
  brand: '#044DF2',
  brandLight: '#2F6BFF',
  brandSoft: '#E8EFFE',
  brandMuted: '#B9CCFB',
  navy: '#0B1F44',
  ink: '#071130',
  muted: '#3A4160',
  border: '#D7DDE7',
  line: '#EEF1F8',
  bg: '#F8F8FC',
  white: '#FFFFFF',
} as const;

/** Status. `success` is decorative (2.6:1 on white); carry meaning with `successStrong`. */
export const status = {
  success: '#12B76A',
  successStrong: '#12945A',
  successSoft: '#E3F7EE',
  loss: '#D6244B',
  lossSoft: '#FCE4E9',
} as const;

/** Warm industry accents. Each solid passes 3:1 against white; the -soft tints are fills only. */
export const accents = {
  espresso: '#8A4B2A', // coffee, chocolate, barber leather       6.7:1
  espressoSoft: '#F3E6DC',
  honey: '#B86E00', // bread crust, baklava, kebab, beer       4.0:1
  honeySoft: '#FCEFD6',
  tomato: '#D4421C', // pizza, kebab sauce, chili                4.6:1
  tomatoSoft: '#FCE4DC',
  salmon: '#E5674A', // sushi, peach, nail coral                 3.3:1
  salmonSoft: '#FDE8E2',
  berry: '#C2366F', // nail studio, berries, cocktails          5.2:1
  berrySoft: '#FAE3EC',
  herb: '#5E7A1F', // basil, salad, matcha, plants             4.9:1
  herbSoft: '#EAF0DA',
} as const;

/** People. Six skin tones (light to deep) and six natural hair colours. */
export const skin = ['#F6D7C3', '#EBBF9F', '#D6A07A', '#B97D56', '#8D5A3B', '#5E3A26'] as const;
export const hair = ['#2B1D16', '#4A2E1F', '#7A4A2A', '#B07A3F', '#D9B26A', '#9AA3B5'] as const;

/** All allowed hex colours, upper-case, 6 digits. */
export const allowedHex: ReadonlySet<string> = new Set(
  [...Object.values(core), ...Object.values(status), ...Object.values(accents), ...skin, ...hair].map((h) => h.toUpperCase()),
);
