import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { availableLocales, getMessages } from '@/lib/i18n-build';
import { translate } from '@/lib/i18n';
import { I18nProvider } from '@/components/I18nProvider';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-hanken', display: 'swap' });

const en = getMessages('en');

export const metadata: Metadata = {
  title: `${translate(en, 'en', 'common.appName')} – ${translate(en, 'en', 'common.tagline')}`,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  const locales = availableLocales();
  return (
    <html lang="en" className={hanken.variable}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block" />
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
