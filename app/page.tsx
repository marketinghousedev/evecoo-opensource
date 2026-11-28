'use client';

import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { SiteNav, SiteFooter } from '@/components/landing/Chrome';
import { BowlAtmo } from '@/components/landing/herob/HeroBowl';
import { Reveal } from '@/components/landing/Reveal';
import { Icon } from '@/components/landing/Icon';
import { VariantSlot, ComparePanel, useVariant, useVariantKey } from '@/components/landing/variant-runtime';
import './landing.css';

export default function LandingPage() {
  const { t } = useT();
  // Every section renders through <VariantSlot>; add B versions in components/landing/variants.ts (docs/VARIANTS.md).
  const hero = useVariant('hero');
  const revision = useVariantKey();
  return (
    <div className={hero === 'b' ? 'landing hb-on' : 'landing'}>
      <SiteNav />
      {hero === 'b' && <BowlAtmo />}
      <main>
        <VariantSlot section="hero" />
        <VariantSlot section="logos" />
        <VariantSlot section="features" />
        <VariantSlot section="how" />
        <VariantSlot section="bento" />
        <VariantSlot section="problem" />
        <VariantSlot section="service" />
        <VariantSlot section="dash" />
        <VariantSlot section="pricing" />
        <VariantSlot section="faq" />
        <section className="final">
          <h2>{t('landing.final.title')}</h2>
          <p>{t('landing.final.sub')}</p>
          <Link href="/signup" className="btn btn-xl btn-glow">{t('landing.cta.create')} <Icon name="arrow_forward" size={22} /></Link>
        </section>
      </main>
      <SiteFooter />
      <Reveal key={revision} />
      <ComparePanel />
    </div>
  );
}
