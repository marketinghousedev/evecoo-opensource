'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { api } from '@/lib/client';
import type { Card } from '@/lib/types';
import { useT } from '@/components/I18nProvider';
import StampCard from '@/components/StampCard';
import { errorText } from './errorText';
import s from './dashboard.module.css';

const PREVIEW_STAMPS = 3;

export default function CardEditor({ businessName }: { businessName: string }) {
  const { t } = useT();
  const [loaded, setLoaded] = useState(false);
  const [name, setName] = useState('');
  const [reward, setReward] = useState('');
  const [required, setRequired] = useState('10');
  const [color, setColor] = useState('#1F6F5B');
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<Card>('/api/card').then(
      (c) => {
        setName(c.name);
        setReward(c.reward);
        setRequired(String(c.stampsRequired));
        setColor(c.color);
        setLoaded(true);
      },
      (e) => setError(errorText(t, e)),
    );
  }, [t]);

  async function submit(ev: FormEvent) {
    ev.preventDefault();
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const c = await api<Card>('/api/card', {
        method: 'PUT',
        body: { name, reward, stampsRequired: Number(required), color },
      });
      setName(c.name);
      setReward(c.reward);
      setRequired(String(c.stampsRequired));
      setColor(c.color);
      setSaved(true);
    } catch (e) {
      setError(errorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  const total = Math.max(2, Math.min(20, Math.round(Number(required)) || 2));

  return (
    <section className={`${s.section} ${s.panel}`} id="card">
      <h2>{t('dashboard.card.title')}</h2>
      {!loaded && !error && <p className="muted">{t('common.loading')}</p>}
      {loaded && (
        <div className={s.editor}>
          <form onSubmit={submit}>
            <div className="field">
              <label className="label" htmlFor="card-name">{t('dashboard.card.name')}</label>
              <input id="card-name" className="input" value={name} maxLength={60} required onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="card-reward">{t('dashboard.card.reward')}</label>
              <input id="card-reward" className="input" value={reward} maxLength={100} required onChange={(e) => setReward(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="card-required">{t('dashboard.card.stampsRequired')}</label>
              <input id="card-required" className="input" type="number" min={2} max={20} step={1} value={required} required onChange={(e) => setRequired(e.target.value)} />
            </div>
            <div className="field">
              <label className="label" htmlFor="card-color">{t('dashboard.card.color')}</label>
              <div className={s.colorRow}>
                <input id="card-color" className={`input ${s.color}`} type="color" value={color} onChange={(e) => setColor(e.target.value)} />
                <span className={s.hex}>{color.toUpperCase()}</span>
              </div>
            </div>
            <button className="btn" type="submit" disabled={busy}>{t('common.save')}</button>
            {saved && <p className="success" role="status">{t('dashboard.card.saved')}</p>}
            {error && <p className="error" role="alert">{error}</p>}
          </form>
          <div className={s.previewWrap}>
            <div className={s.previewLabel}>{t('dashboard.card.preview')}</div>
            <StampCard
              businessName={businessName}
              cardName={name}
              reward={reward}
              stampsRequired={total}
              stamps={Math.min(PREVIEW_STAMPS, total)}
              color={color}
              rewardLabel={t('card.rewardLabel', { reward })}
              progressLabel={t('card.progress', { stamps: Math.min(PREVIEW_STAMPS, total), total })}
            />
          </div>
        </div>
      )}
      {!loaded && error && <p className="error" role="alert">{error}</p>}
    </section>
  );
}
