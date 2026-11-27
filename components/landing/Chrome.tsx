'use client';

import Link from 'next/link';
import { useT } from '@/components/I18nProvider';
import { Wordmark } from './Logo';
import { Icon } from './Icon';

const LINKS = [
  ['features', '#features'],
  ['benefits', '#benefits'],
  ['dashboard', '#dashboard'],
  ['service', '#service'],
  ['pricing', '#pricing'],
  ['faq', '#faq'],
  ['support', '#support'],
] as const;

export function SiteNav({ announce = true }: { announce?: boolean }) {
  const { t } = useT();
  return (
    <>
      {announce && (
        <div className="announce">
          <span className="laurel" aria-hidden="true"><Icon name="eco" size={18} fill /></span>
          <span>{t('landing.announce')}</span>
          <span className="laurel flip" aria-hidden="true"><Icon name="eco" size={18} fill /></span>
        </div>
      )}
      <header className="site-nav">
        <div className="site-nav-in">
          <Wordmark name={t('common.appName')} />
          <nav className="nav-links" aria-label={t('nav.primary')}>
            {LINKS.map(([k, href]) => (
              <a key={k} href={`/${href}`}>{t(`nav.${k}`)}</a>
            ))}
          </nav>
          <div className="nav-cta">
            <Link href="/login" className="nav-login">{t('nav.login')}</Link>
            <Link href="/signup" className="btn btn-sm">{t('nav.start')}</Link>
          </div>
          <details className="nav-menu">
            <summary aria-label={t('nav.menu')}><Icon name="menu" size={26} /></summary>
            <div className="nav-sheet">
              {LINKS.map(([k, href]) => (
                <a key={k} href={`/${href}`}>{t(`nav.${k}`)}</a>
              ))}
              <Link href="/login">{t('nav.login')}</Link>
              <Link href="/signup" className="btn">{t('nav.start')}</Link>
            </div>
          </details>
        </div>
      </header>
    </>
  );
}

export function SiteFooter() {
  const { t } = useT();
  const cols: [string, [string, string][]][] = [
    ['product', [['how', '/#how'], ['pricing', '/#pricing'], ['faq', '/#faq']]],
    ['resources', [['benefits', '/#benefits'], ['features', '/#features'], ['compare', '/#service'], ['industries', '/#benefits'], ['blog', '/']]],
    ['legal', [['privacy', '/'], ['imprint', '/'], ['terms', '/'], ['support', '/#support']]],
  ];
  return (
    <footer className="site-footer" id="support">
      <div className="footer-in">
        <div className="footer-grid">
          <div className="footer-brand">
            <Wordmark name={t('common.appName')} light />
            <p>{t('footer.about')}</p>
          </div>
          {cols.map(([title, items]) => (
            <div key={title}>
              <h4>{t(`footer.${title}`)}</h4>
              <ul>
                {items.map(([k, href]) => (
                  <li key={k}><Link href={href}>{t(`footer.${k}`)}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="footer-bottom">
          <span>{t('footer.copy')}</span>
          <span className="footer-contact">
            <a href="mailto:hello@evecoo.app">{t('footer.mail')}</a>
            <Link href="/login">{t('footer.login')}</Link>
            <a href="#support">{t('footer.whatsapp')}</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
