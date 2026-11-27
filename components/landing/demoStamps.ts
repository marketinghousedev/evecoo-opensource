import type { StampName } from '@/components/illustration/stamps';

/**
 * Which stamp icon each demo business on the landing page uses. The real card setting that picks
 * the icon comes later (no API change yet); until then only the landing data maps businesses.
 */
export const DEMO_STAMPS = {
  burger: 'burger',
  sushi: 'sushi',
  scissors: 'scissors',
  cup: 'coffee',
  nail: 'nail',
  kebab: 'kebab',
} as const satisfies Record<string, StampName>;
