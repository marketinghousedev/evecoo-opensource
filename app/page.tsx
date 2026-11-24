import Link from 'next/link';
import { getServerI18n } from '@/lib/i18n-server';
import { SiteNav, SiteFooter } from '@/components/landing/Chrome';
import { Hero } from '@/components/landing/Hero';
import { Logos, Features } from '@/components/landing/Features';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { Bento, Problem } from '@/components/landing/Bento';
import { Service } from '@/components/landing/Service';
import { DashPreview } from '@/components/landing/DashPreview';
import { Pricing, Faq } from '@/components/landing/PricingFaq';
import { Reveal } from '@/components/landing/Reveal';
import { Icon } from '@/components/landing/Icon';
import './landing.css';

export default async function LandingPage() {
  const { t } = await getServerI18n();
  return (
    <div className="landing">
      <SiteNav />
      <main>
        <Hero />
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
      <Reveal />
    </div>
  );
}
