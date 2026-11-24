'use client';

import { useRouter } from 'next/navigation';
import { clearToken, useSession } from '@/lib/client';
import { useT } from '@/components/I18nProvider';
import Stats from '@/components/dashboard/Stats';
import CardEditor from '@/components/dashboard/CardEditor';
import Messages from '@/components/dashboard/Messages';
import StaffManager from '@/components/dashboard/StaffManager';
import JoinLink from '@/components/dashboard/JoinLink';
import Icon from '@/components/dashboard/icons';
import s from '@/components/dashboard/dashboard.module.css';

const NAV = ['overview', 'card', 'messages', 'team', 'join'] as const;

export default function DashboardPage() {
  const { t } = useT();
  const router = useRouter();
  const { user, loading } = useSession('owner');

  function logout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <div className={s.shell}>
      <aside className={s.side}>
        <div className={s.sideTop}>
          <span className={s.wordmark}>
            <span className={s.mark} aria-hidden="true">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
            {t('common.appName').toUpperCase()}
          </span>
          <button className={`${s.navLink} ${s.logoutTop}`} onClick={logout} aria-label={t('common.logout')}><Icon name="logout" /></button>
        </div>
        <nav className={s.nav} aria-label={t('dashboard.title')}>
          {NAV.map((k, i) => (
            <a key={k} href={`#${k}`} className={`${s.navLink} ${i === 0 ? s.navActive : ''}`}>
              <Icon name={k === 'join' ? 'link' : k} />
              {t(`dashboard.nav.${k}`)}
            </a>
          ))}
        </nav>
        <div className={s.spacer} />
        <div className={s.sideFoot}>
          {user && <p style={{ margin: '0 0 12px' }}>{user.businessName}<br />{user.email}</p>}
          <button className={`${s.navLink} ${s.logoutSide}`} onClick={logout}><Icon name="logout" />{t('common.logout')}</button>
        </div>
      </aside>
      <main className={s.main}>
        <div className={s.stack}>
          <header className={s.header}>
            <h1>{t('dashboard.title')}</h1>
            {user && <p>{t('dashboard.signedInAs', { business: user.businessName, email: user.email })}</p>}
          </header>
          {loading && <p className="muted">{t('common.loading')}</p>}
          {!loading && !user && <p className="error">{t('dashboard.sessionError')}</p>}
          {user && (
            <>
              <Stats />
              <CardEditor businessName={user.businessName} />
              <Messages />
              <StaffManager />
              <JoinLink businessId={user.businessId} />
            </>
          )}
        </div>
      </main>
    </div>
  );
}
