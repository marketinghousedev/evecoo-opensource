import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { availableLocales, getMessages } from '@/lib/i18n-build';
import { translate } from '@/lib/i18n';
import { I18nProvider } from '@/components/I18nProvider';
import { variantScript, variantCss } from '@/components/landing/variant-prepaint';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-hanken', display: 'swap' });

const en = getMessages('en');

export const metadata: Metadata = {
  title: `${translate(en, 'en', 'common.appName')} – ${translate(en, 'en', 'common.tagline')}`,
  description: `${translate(en, 'en', 'landing.hero.sub1')} ${translate(en, 'en', 'landing.hero.sub2')}`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const locales = availableLocales();
  return (
    <html lang="en" className={hanken.variable} suppressHydrationWarning>
      <head>
        {/* Variants (docs/VARIANTS.md): data-<section> is set before first paint so ?how=b or ?all=b never flashes variant A. */}
        <style dangerouslySetInnerHTML={{ __html: variantCss() }} />
        <script dangerouslySetInnerHTML={{ __html: variantScript() }} />
      </head>
      <body>
        <I18nProvider locales={locales} messages={en}>
          <LocaleSwitcher locales={locales} />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
