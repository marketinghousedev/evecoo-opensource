import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Hanken_Grotesk } from 'next/font/google';
import './globals.css';
import { getServerI18n } from '@/lib/i18n-server';
import { availableLocales } from '@/lib/i18n';
import { I18nProvider } from '@/components/I18nProvider';
import { LocaleSwitcher } from '@/components/LocaleSwitcher';

const hanken = Hanken_Grotesk({ subsets: ['latin'], weight: ['300', '400', '500', '600', '700'], variable: '--font-hanken', display: 'swap' });

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getServerI18n();
  return { title: `${t('common.appName')} – ${t('common.tagline')}` };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const { locale, messages } = await getServerI18n();
  return (
    <html lang={locale} className={hanken.variable}>
      <head>
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0,0&display=block" />
      </head>
      <body>
        <I18nProvider locale={locale} messages={messages}>
          <LocaleSwitcher locales={availableLocales()} />
          {children}
        </I18nProvider>
      </body>
    </html>
  );
}
