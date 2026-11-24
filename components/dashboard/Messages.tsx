'use client';

import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/client';
import { formatDate } from '@/lib/i18n';
import type { MessageSummary } from '@/lib/types';
import { useT } from '@/components/I18nProvider';
import Icon from './icons';
import { errorText } from './errorText';
import s from './dashboard.module.css';

export default function Messages() {
  const { t, locale } = useT();
  const [list, setList] = useState<MessageSummary[] | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(() => {
    setListError(null);
    api<MessageSummary[]>('/api/messages').then(setList, (e) => setListError(errorText(t, e)));
  }, [t]);
  useEffect(load, [load]);

  async function send(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await api<{ recipients: number }>('/api/messages', { method: 'POST', body: { title, body } });
      setResult(t('dashboard.messages.sent', { count: r.recipients }));
      setTitle('');
      setBody('');
      load();
    } catch (e) {
      setError(errorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  async function runAutomations() {
    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const r = await api<{ sent: number }>('/api/automations/run', { method: 'POST', body: {} });
      setResult(t('dashboard.automations.result', { count: r.sent }));
      load();
    } catch (e) {
      setError(errorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  const autos = ['welcome', 'winback', 'birthday'] as const;

  return (
    <section className={`${s.section} ${s.panel}`} id="messages">
      <h2>{t('dashboard.messages.title')}</h2>
      <div className={s.msgGrid}>
        <div>
          <form onSubmit={send}>
            <div className="field">
              <label className="label" htmlFor="msg-title">{t('dashboard.messages.subject')}</label>
              <input id="msg-title" className="input" value={title} maxLength={80} required onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="msg-body">{t('dashboard.messages.body')}</label>
              <textarea id="msg-body" className={`input ${s.textarea}`} value={body} maxLength={500} required onChange={(e) => setBody(e.target.value)} />
            </div>
            <button className="btn" type="submit" disabled={busy}>{t('dashboard.messages.send')}</button>
          </form>
          {result && <p className="success" role="status">{result}</p>}
          {error && <p className="error" role="alert">{error}</p>}

          <h3 style={{ marginTop: 28 }}>{t('dashboard.automations.title')}</h3>
          <div className={s.autos}>
            {autos.map((k) => (
              <div className={s.auto} key={k}>
                <span className={s.autoIcon}><Icon name={k} size={18} /></span>
                <div className={s.autoText}>
                  <strong>{t(`dashboard.messages.kind.${k}`)}</strong>
                  <span>{t(`dashboard.automations.${k}`)}</span>
                </div>
                <span className={s.toggle} role="img" aria-label={t('dashboard.automations.active')} />
              </div>
            ))}
          </div>
          <p className={s.sub} style={{ margin: '0 0 12px' }}>{t('dashboard.automations.hint')}</p>
          <button className="btn btn-secondary" type="button" disabled={busy} onClick={runAutomations}>{t('dashboard.automations.run')}</button>
        </div>

        <div>
          <h3>{t('dashboard.messages.history')}</h3>
          {listError && (
            <p>
              <span className="error">{listError}</span>{' '}
              <button className="btn btn-secondary" onClick={load}>{t('common.retry')}</button>
            </p>
          )}
          {!list && !listError && <p className="muted">{t('common.loading')}</p>}
          {list && list.length === 0 && <p className="muted">{t('dashboard.messages.empty')}</p>}
          {list && list.length > 0 && (
            <ul className={s.list}>
              {list.map((m) => (
                <li className={s.msg} key={m.id}>
                  <div className={s.msgHead}>
                    <strong style={{ fontWeight: 500 }}>{m.title}</strong>
                    <span className={s.chip}>{t(`dashboard.messages.kind.${m.kind}`)}</span>
                  </div>
                  <p>{m.body}</p>
                  <div className={s.meta}>
                    {t('dashboard.messages.meta', { date: formatDate(locale, m.createdAt), count: m.recipients })}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
