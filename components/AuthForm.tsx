'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useT } from '@/components/I18nProvider';
import { Wordmark } from '@/components/landing/Logo';
import { api, ApiClientError, setToken } from '@/lib/client';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' }) {
  const { t } = useT();
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const signup = mode === 'signup';

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      if (signup) {
        const r = await api<{ token: string; businessId: string }>('/api/auth/signup', {
          body: { email, password, businessName },
        });
        setToken(r.token);
        router.push('/dashboard');
      } else {
        const r = await api<{ token: string; role: 'owner' | 'staff' }>('/api/auth/login', {
          body: { email, password },
        });
        setToken(r.token);
        router.push(r.role === 'owner' ? '/dashboard' : '/staff');
      }
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.code === 'network' ? t(err.message) : err.message);
      else setError(t('errors.internal'));
      setBusy(false);
    }
  }

  return (
    <main className="auth-wrap">
      <div style={{ marginBottom: 24 }}><Wordmark name={t('common.appName')} /></div>
      <form className="auth-card" onSubmit={onSubmit}>
        <h1>{t(`auth.${mode}.title`)}</h1>
        <p className="sub">{t(signup ? 'auth.subtitleSignup' : 'auth.subtitleLogin')}</p>
        {signup && (
          <div className="field">
            <label className="label" htmlFor="businessName">{t('auth.field.businessName')}</label>
            <input id="businessName" className="input" required maxLength={100} value={businessName}
              onChange={(e) => setBusinessName(e.target.value)} autoComplete="organization" />
          </div>
        )}
        <div className="field">
          <label className="label" htmlFor="email">{t('auth.field.email')}</label>
          <input id="email" className="input" type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
        </div>
        <div className="field">
          <label className="label" htmlFor="password">{t('auth.field.password')}</label>
          <input id="password" className="input" type="password" required minLength={signup ? 8 : undefined}
            maxLength={200} value={password} onChange={(e) => setPassword(e.target.value)}
            autoComplete={signup ? 'new-password' : 'current-password'} />
          {signup && <span className="muted">{t('auth.field.passwordHint')}</span>}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? t('auth.submitting') : t(`auth.${mode}.submit`)}
        </button>
        <p className="muted" style={{ marginTop: 16, marginBottom: 0, textAlign: 'center' }}>
          {t(`auth.${mode}.switchPrompt`)}{' '}
          <Link href={signup ? '/login' : '/signup'}>{t(`auth.${mode}.switchLink`)}</Link>
        </p>
      </form>
      <Link className="back" href="/">{t('auth.back')}</Link>
    </main>
  );
}
