'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import StampCard from '@/components/StampCard';
import { useT } from '@/components/I18nProvider';
import { api, ApiClientError } from '@/lib/client';
import type { PublicCard } from '@/lib/types';
import s from './join.module.css';

export default function JoinPage({ params }: { params: Promise<{ businessId: string }> }) {
  const { businessId } = use(params);
  const { t } = useT();
  const router = useRouter();
  const [card, setCard] = useState<PublicCard | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [birthday, setBirthday] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<PublicCard>(`/api/public/card/${encodeURIComponent(businessId)}`)
      .then((c) => !cancelled && setCard(c))
      .catch((e) => {
        if (cancelled) return;
        setLoadError(e instanceof ApiClientError && e.status === 404 ? t('join.notFound') : e instanceof ApiClientError && e.code === 'network' ? t(e.message) : t('errors.internal'));
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businessId]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const r = await api<{ customerId: string; passUrl: string }>('/api/customers', {
        body: { businessId, name, ...(birthday ? { birthday } : {}) },
      });
      router.push(r.passUrl);
    } catch (err) {
      if (err instanceof ApiClientError) setError(err.code === 'network' ? t(err.message) : err.message);
      else setError(t('errors.internal'));
      setBusy(false);
    }
  }

  if (loading) return <main className={s.page}><p className={s.note}>{t('common.loading')}</p></main>;
  if (loadError || !card) return <main className={s.page}><p className={s.err} role="alert">{loadError ?? t('join.notFound')}</p></main>;

  return (
    <main className={s.page}>
      <div className={s.col}>
        <h1 className={s.title}>{t('join.title', { business: card.businessName })}</h1>
        <p className={s.sub}>{t('join.subtitle')}</p>
        <StampCard
          businessName={card.businessName}
          cardName={card.name}
          reward={card.reward}
          stampsRequired={card.stampsRequired}
          stamps={0}
          color={card.color}
          rewardLabel={t('card.rewardLabel', { reward: card.reward })}
          progressLabel={t('card.progress', { stamps: 0, total: card.stampsRequired })}
        />
        <form className={s.form} onSubmit={onSubmit}>
          <label className={s.label} htmlFor="name">{t('join.field.name')}</label>
          <input id="name" className={s.input} required maxLength={80} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
          <label className={s.label} htmlFor="birthday">{t('join.field.birthday')}</label>
          <input id="birthday" className={s.input} type="date" value={birthday} onChange={(e) => setBirthday(e.target.value)} autoComplete="bday" />
          <span className={s.hint}>{t('join.field.birthdayHint')}</span>
          {error && <p className={s.err} role="alert">{error}</p>}
          <button className={s.submit} type="submit" disabled={busy}>{busy ? t('join.submitting') : t('join.submit')}</button>
        </form>
      </div>
    </main>
  );
}
