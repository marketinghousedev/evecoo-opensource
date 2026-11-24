'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/client';
import { useT } from '@/components/I18nProvider';
import { errorText } from './errorText';
import s from './dashboard.module.css';

type StaffRow = { id: string; email: string };

export default function StaffManager() {
  const { t } = useT();
  const [list, setList] = useState<StaffRow[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setListError(null);
    api<StaffRow[]>('/api/staff').then(setList, (e) => setListError(errorText(t, e)));
  }, [t]);
  useEffect(load, [load]);

  async function create(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    setDone(false);
    try {
      await api<{ id: string }>('/api/staff', { method: 'POST', body: { email, password } });
      setDone(true);
      setEmail('');
      setPassword('');
      load();
    } catch (e) {
      setError(errorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={`${s.section} ${s.panel}`} id="team">
      <h2>{t('dashboard.staff.title')}</h2>
      <p className={s.sub}>{t('dashboard.staff.intro')}</p>
      <div className={s.msgGrid}>
      <div>
      <form onSubmit={create}>
        <div className="field">
          <label className="label" htmlFor="staff-email">{t('dashboard.staff.email')}</label>
          <input id="staff-email" className="input" type="email" autoComplete="off" value={email} required onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label className="label" htmlFor="staff-password">{t('dashboard.staff.password')}</label>
          <input id="staff-password" className="input" type="password" autoComplete="new-password" minLength={8} maxLength={200} value={password} required onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button className="btn" type="submit" disabled={busy}>{t('dashboard.staff.create')}</button>
        {done && <p className="success" role="status">{t('dashboard.staff.created')}</p>}
        {error && <p className="error" role="alert">{error}</p>}
      </form>
      </div>
      <div>
      <h3>{t('dashboard.staff.listTitle')}</h3>
      {listError && (
        <p>
          <span className="error">{listError}</span>{' '}
          <button className="btn btn-secondary" onClick={load}>{t('common.retry')}</button>
        </p>
      )}
      {!list && !listError && <p className="muted">{t('common.loading')}</p>}
      {list && list.length === 0 && <p className="muted">{t('dashboard.staff.empty')}</p>}
      {list && list.length > 0 && (
        <ul className={s.list} style={{ gap: 0 }}>
          {list.map((m) => (
            <li className={s.person} key={m.id}>
              <span className={s.avatar} aria-hidden="true">{m.email.slice(0, 1).toUpperCase()}</span>
              {m.email}
            </li>
          ))}
        </ul>
      )}
      </div>
      </div>
    </section>
  );
}
