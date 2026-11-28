// The A/B variant registry. See docs/VARIANTS.md.
//
// To add a B version of a section: build the component, import it here and add it to that section's
// `variants` map. Nothing else changes: the page renders every section through <VariantSlot>, the
// "Compare" panel lists every section with more than one variant, and `?<section>=<variant>` works.
import type { ComponentType } from 'react';
import { Hero } from './Hero';
import { HeroBowl } from './herob/HeroBowl';
import { Logos, Features } from './Features';
import { HowItWorks } from './HowItWorks';
import { Bento, Problem } from './Bento';
import { Service } from './Service';
import { DashPreview } from './DashPreview';
import { Pricing, Faq } from './PricingFaq';
import { DashPreviewB } from './dashb/DashPreviewB';
import { PricingB } from './pricb/PricingB';
import { FaqB } from './faqb/FaqB';

export type SectionDef = {
  /** Shown in the Compare panel. */
  label: string;
  /** Variant used when the URL does not say otherwise. Must be a key of `variants`. */
  default: string;
  /** Variant id (lower-case letter or short word) -> component. The first listed is shown first. */
  variants: Record<string, ComponentType>;
};

/** Order = order in the Compare panel (and the page order). Keys are the URL parameters. */
export const SECTIONS: Record<string, SectionDef> = {
  hero: { label: 'Hero', default: 'b', variants: { a: Hero, b: HeroBowl } },
  logos: { label: 'Logos', default: 'a', variants: { a: Logos } },
  features: { label: 'Features', default: 'a', variants: { a: Features } },
  how: { label: 'How it works', default: 'a', variants: { a: HowItWorks } },
  bento: { label: 'Benefits', default: 'a', variants: { a: Bento } },
  problem: { label: 'Problem', default: 'a', variants: { a: Problem } },
  service: { label: 'Service', default: 'a', variants: { a: Service } },
  dash: { label: 'Dashboard', default: 'a', variants: { a: DashPreview, b: DashPreviewB } },
  pricing: { label: 'Pricing', default: 'a', variants: { a: Pricing, b: PricingB } },
  faq: { label: 'FAQ', default: 'a', variants: { a: Faq, b: FaqB } },
};
