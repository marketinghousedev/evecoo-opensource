'use client';

import { useEffect, useState } from 'react';
import { useT } from '@/components/I18nProvider';
import s from './dashboard.module.css';

export default function JoinLink({ businessId }: { businessId: string }) {
  const { t } = useT();
  const [url, setUrl] = useState(`/join/?id=${encodeURIComponent(businessId)}`);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setUrl(`${window.location.origin}/join/?id=${encodeURIComponent(businessId)}`);
  }, [businessId]);

  async function copy() {
    setFailed(false);
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
    } catch {
      setCopied(false);
      setFailed(true);
    }
  }

  return (
    <section className={`${s.section} ${s.panel}`} id="join">
      <h2>{t('dashboard.join.title')}</h2>
      <p className={s.sub} style={{ marginTop: 0 }}>{t('dashboard.join.intro')}</p>
      <p className={s.link}>{url}</p>
      <div className={s.row}>
        <button className="btn btn-secondary" onClick={copy}>{t('dashboard.join.copy')}</button>
        {copied && <span className="success" role="status">{t('dashboard.join.copied')}</span>}
        {failed && <span className="error" role="alert">{t('dashboard.join.copyFailed')}</span>}
      </div>
    </section>
  );
}
