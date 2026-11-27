import type { StampName } from '@/components/illustration/stamps';
import type { IlloData } from '@/components/illustration/types';
import {
  brandsMarkBakehouse, brandsMarkBarber, brandsMarkBloom, brandsMarkBoba, brandsMarkBurger, brandsMarkCoffee,
  brandsMarkGelato, brandsMarkKebab, brandsMarkNail, brandsMarkPaws, brandsMarkPizza, brandsMarkSushi,
  passesStripBakehouse, passesStripBarber, passesStripBloom, passesStripBoba, passesStripBurger, passesStripCoffee,
  passesStripGelato, passesStripKebab, passesStripNail, passesStripPaws, passesStripPizza, passesStripSushi,
} from '@/components/illustration/illo-data';

export type PassSlug =
  | 'kebab' | 'coffee' | 'bakehouse' | 'sushi' | 'barber' | 'nail'
  | 'pizza' | 'burger' | 'boba' | 'gelato' | 'bloom' | 'paws';

export type PassDef = {
  slug: PassSlug;
  /** Fictional business name (a proper noun, not translated). */
  name: string;
  holder: string;
  /** bg: pass body. fg: business name and field values. label: small-caps field labels. All text colours are
   *  checked against bg at 4.5:1 (tests/passes.test.ts). */
  bg: string;
  fg: string;
  label: string;
  /** Stamp icon from the stamp library. */
  stamp: StampName;
  stampsRequired: number;
  /** Stamps collected in the demo state. */
  current: number;
  /** Strip (375x123) and round mark art. */
  strip: IlloData;
  mark: IlloData;
};
// Reward copy: messages landing.passes.<slug>.reward

export const PASSES: readonly PassDef[] = [
  { slug: 'kebab', name: "Momo's Kebab", holder: 'Lena Maurer', bg: '#7A1424', fg: '#FFFFFF', label: '#F6C9CF', stamp: 'kebab', stampsRequired: 10, current: 6, strip: passesStripKebab, mark: brandsMarkKebab },
  { slug: 'coffee', name: 'Brew Coffee', holder: 'Max Mustermann', bg: '#3B2418', fg: '#FFFFFF', label: '#E3C7AE', stamp: 'coffee', stampsRequired: 8, current: 6, strip: passesStripCoffee, mark: brandsMarkCoffee },
  { slug: 'bakehouse', name: 'Bakehouse', holder: 'Mira Okafor', bg: '#E8C98E', fg: '#2F1F0A', label: '#5C3D10', stamp: 'croissant', stampsRequired: 8, current: 3, strip: passesStripBakehouse, mark: brandsMarkBakehouse },
  { slug: 'sushi', name: 'Sushi Kaito', holder: 'Jun Tanaka', bg: '#1E2528', fg: '#FFFFFF', label: '#8FE3C0', stamp: 'sushi', stampsRequired: 8, current: 5, strip: passesStripSushi, mark: brandsMarkSushi },
  { slug: 'barber', name: 'Barber Kings', holder: 'Karim Haddad', bg: '#111111', fg: '#F7E7C6', label: '#D9A94E', stamp: 'scissors', stampsRequired: 8, current: 4, strip: passesStripBarber, mark: brandsMarkBarber },
  { slug: 'nail', name: 'Nail Lounge', holder: 'Sofia Rossi', bg: '#F4B9CD', fg: '#3F1228', label: '#6E1F45', stamp: 'nail', stampsRequired: 8, current: 3, strip: passesStripNail, mark: brandsMarkNail },
  { slug: 'pizza', name: 'Pizza House', holder: 'Luca Bianchi', bg: '#A8321A', fg: '#FFFFFF', label: '#F8DCC0', stamp: 'pizza', stampsRequired: 10, current: 7, strip: passesStripPizza, mark: brandsMarkPizza },
  { slug: 'burger', name: 'Burgers', holder: 'Emre Yilmaz', bg: '#E8B21A', fg: '#1D1D22', label: '#3C2E05', stamp: 'burger', stampsRequired: 8, current: 5, strip: passesStripBurger, mark: brandsMarkBurger },
  { slug: 'boba', name: 'Bubble Bar', holder: 'Mei Lin', bg: '#CDB8F0', fg: '#25164B', label: '#4A2E85', stamp: 'boba', stampsRequired: 8, current: 4, strip: passesStripBoba, mark: brandsMarkBoba },
  { slug: 'gelato', name: 'Gelato', holder: 'Giulia Conti', bg: '#D3E6B6', fg: '#26330F', label: '#3F5A14', stamp: 'icecream', stampsRequired: 10, current: 8, strip: passesStripGelato, mark: brandsMarkGelato },
  { slug: 'bloom', name: 'Bloom', holder: 'Anna Weber', bg: '#A9BFA0', fg: '#14240F', label: '#26401D', stamp: 'flower', stampsRequired: 6, current: 4, strip: passesStripBloom, mark: brandsMarkBloom },
  { slug: 'paws', name: 'Paws', holder: 'Tom Becker', bg: '#0C6E78', fg: '#FFFFFF', label: '#BFF0F2', stamp: 'paw', stampsRequired: 8, current: 5, strip: passesStripPaws, mark: brandsMarkPaws },
];

export const PASS_BY_SLUG = Object.fromEntries(PASSES.map((p) => [p.slug, p])) as Record<PassSlug, PassDef>;

/** The six passes the bento wallet stack shuffles through. */
export const BENTO_PASSES: readonly PassDef[] = (['coffee', 'bakehouse', 'barber', 'pizza', 'gelato', 'nail'] as const).map((s) => PASS_BY_SLUG[s]);
