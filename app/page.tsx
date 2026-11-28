'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useT } from '@/components/I18nProvider';
import { SiteNav, SiteFooter } from '@/components/landing/Chrome';
import { Hero } from '@/components/landing/Hero';
import { Logos, Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Bento, Problem } from '@/components/landing/Bento';
import { Service } from '@/components/landing/Service';
import { DashPreview } from '@/components/landing/DashPreview';
import { Pricing, Faq } from '@/components/landing/PricingFaq';
import { HeroBowl, BowlAtmo, HeroSwitch } from '@/components/landing/herob/HeroBowl';
import { Reveal } from '@/components/landing/Reveal';
import { Icon } from '@/components/landing/Icon';
import './landing.css';

export default function LandingPage() {
  const { t } = useT();
  // Hero variant: B (bowl glow) is the default, ?hero=a keeps the previous hero.
  const [variant, setVariant] = useState<'a' | 'b'>('b');
  useEffect(() => {
    const v = new URLSearchParams(window.location.search).get('hero');
    if (v === 'a' || v === 'b') setVariant(v);
  }, []);
  const choose = (v: 'a' | 'b') => {
    const u = new URL(window.location.href);
    u.searchParams.set('hero', v);
    window.history.replaceState(null, '', u);
    window.scrollTo(0, 0);
    setVariant(v);
  };
  return (
    <div className={variant === 'b' ? 'landing hb-on' : 'landing'}>
      <SiteNav />
      {variant === 'b' && <BowlAtmo />}
      <main>
        {variant === 'b' ? <HeroBowl key="b" /> : <Hero key="a" />}
        <Logos />
        <Features />
        <HowItWorks />
        <Bento />
        <Problem />
        <Service />
        <DashPreview />
        <Pricing />
        <Faq />
        <section className="final">
          <h2>{t('landing.final.title')}</h2>
          <p>{t('landing.final.sub')}</p>
          <Link href="/signup" className="btn btn-xl btn-glow">{t('landing.cta.create')} <Icon name="arrow_forward" size={22} /></Link>
        </section>
      </main>
      <SiteFooter />
      <Reveal key={variant} />
      <HeroSwitch value={variant} onChange={choose} />
    </div>
  );
}
