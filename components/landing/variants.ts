// The A/B variant registry. See docs/VARIANTS.md.
//
// To add a B version of a section: build the component, import it here and add it to that section's
// `variants` map. Nothing else changes: the page renders every section through <VariantSlot>, the
// "Compare" panel lists every section with more than one variant, and `?<section>=<variant>` works.
import type { ComponentType } from 'react';
import { Hero } from './Hero';
import { HeroBowl } from './herob/HeroBowl';
import { HeroStamp } from './heroc/HeroStamp';
import { LogosPicker } from './logosb/LogosPicker';
import { Logos, Features } from './Features';
import { HowItWorks } from './HowItWorks';
import { FeaturesB } from './featuresb/FeaturesB';
import { HowItWorksB } from './howb/HowItWorksB';
import { Bento, Problem } from './Bento';
import { Service } from './Service';
import { DashPreview } from './DashPreview';
import { Pricing, Faq } from './PricingFaq';
import { DashPreviewB } from './dashb/DashPreviewB';
import { PricingB } from './pricb/PricingB';
import { FaqB } from './faqb/FaqB';
import { BentoB } from './bentob/BentoB';
import { ProblemB } from './problemb/ProblemB';
import { ServiceB } from './serviceb/ServiceB';

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
  hero: { label: 'Hero', default: 'b', variants: { a: Hero, b: HeroBowl, c: HeroStamp } },
  logos: { label: 'Logos', default: 'a', variants: { a: Logos, b: LogosPicker } },
  features: { label: 'Features', default: 'a', variants: { a: Features, b: FeaturesB } },
  how: { label: 'How it works', default: 'a', variants: { a: HowItWorks, b: HowItWorksB } },
  bento: { label: 'Benefits', default: 'a', variants: { a: Bento, b: BentoB } },
  problem: { label: 'Problem', default: 'a', variants: { a: Problem, b: ProblemB } },
  service: { label: 'Service', default: 'a', variants: { a: Service, b: ServiceB } },
  dash: { label: 'Dashboard', default: 'a', variants: { a: DashPreview, b: DashPreviewB } },
  pricing: { label: 'Pricing', default: 'a', variants: { a: Pricing, b: PricingB } },
  faq: { label: 'FAQ', default: 'a', variants: { a: Faq, b: FaqB } },
};
