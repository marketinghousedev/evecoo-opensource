'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { api, clearToken, useSession } from '@/lib/client';
import type { PassJson, StampResult } from '@/lib/types';
import { useT } from '@/components/I18nProvider';
import StampCard from '@/components/StampCard';
import { errorText } from '@/components/dashboard/errorText';
import s from './staff.module.css';

type Detector = { detect(v: HTMLVideoElement): Promise<{ rawValue: string }[]> };
type DetectorCtor = new (o: { formats: string[] }) => Detector;

export default function StaffPage() {
  const { t } = useT();
  const router = useRouter();
  const { user, loading } = useSession('any');
  const [customerId, setCustomerId] = useState('');
  const [pass, setPass] = useState<PassJson | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [canScan, setCanScan] = useState(false);
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    setCanScan('BarcodeDetector' in window);
  }, []);

  async function lookup(id: string) {
    const trimmed = id.trim();
    if (!trimmed) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    setPass(null);
    try {
      setPass(await api<PassJson>(`/api/pass/${encodeURIComponent(trimmed)}/google`));
    } catch (e) {
      setError(errorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  function onLookup(ev: FormEvent) {
    ev.preventDefault();
    void lookup(customerId);
  }

  async function act(kind: 'stamp' | 'redeem') {
    if (!pass) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (kind === 'stamp') {
        const r = await api<StampResult>('/api/stamps', { method: 'POST', body: { customerId: pass.serialNumber } });
        setPass({ ...pass, stamps: r.stamps, redeemable: r.redeemable });
        setNotice(r.redeemable ? t('staff.result.ready') : t('staff.result.stamped'));
      } else {
        await api<{ stamps: number }>('/api/redeem', { method: 'POST', body: { customerId: pass.serialNumber } });
        setPass({ ...pass, stamps: 0, redeemable: false });
        setNotice(t('staff.result.redeemed'));
      }
    } catch (e) {
      setError(errorText(t, e));
    } finally {
      setBusy(false);
    }
  }

  async function scan() {
    setError(null);
    setScanning(true);
    let stream: MediaStream | null = null;
    try {
      const Ctor = (window as unknown as { BarcodeDetector: DetectorCtor }).BarcodeDetector;
      const detector = new Ctor({ formats: ['qr_code'] });
      stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      const video = videoRef.current;
      if (!video) return;
      video.srcObject = stream;
      await video.play();
      const deadline = Date.now() + 60_000;
      while (Date.now() < deadline) {
        const found = await detector.detect(video);
        if (found.length > 0) {
          setCustomerId(found[0].rawValue);
          await lookup(found[0].rawValue);
          return;
        }
        await new Promise((r) => setTimeout(r, 250));
      }
    } catch {
      setError(t('staff.scan.failed'));
    } finally {
      stream?.getTracks().forEach((tr) => tr.stop());
      setScanning(false);
    }
  }

  function logout() {
    clearToken();
    router.replace('/login');
  }

  return (
    <main className={s.page}>
      <header className={s.top}>
        <div className={s.brand}>
          <span className={s.mark} aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
          </span>
          <div>
            <div className={s.title}>{t('staff.title')}</div>
            {user && <div className={s.biz}>{t('staff.signedInAs', { business: user.businessName })}</div>}
          </div>
        </div>
        <button className={s.logout} onClick={logout}>{t('common.logout')}</button>
      </header>
      <div className={s.wrap}>
        {loading && <p className={s.note}>{t('common.loading')}</p>}
        {!loading && !user && <p className="error">{t('staff.sessionError')}</p>}
        {user && (
          <>
            <section className={s.panel}>
              <form onSubmit={onLookup}>
                <label className={s.label} htmlFor="customer-id">{t('staff.customerId')}</label>
                <input id="customer-id" className={s.input} value={customerId} autoComplete="off" autoCapitalize="off" spellCheck={false} placeholder={t('staff.customerIdPlaceholder')} onChange={(e) => setCustomerId(e.target.value)} />
                <div className={s.row}>
                  <button className={s.primary} type="submit" disabled={busy || scanning || !customerId.trim()}>{t('staff.lookup')}</button>
                  {canScan && (
                    <button className={s.secondary} type="button" disabled={busy || scanning} onClick={scan}>{t('staff.scan.start')}</button>
                  )}
                </div>
              </form>
              <video ref={videoRef} className={s.video} muted playsInline hidden={!scanning} />
              {scanning && <p className={s.note}>{t('staff.scan.hint')}</p>}
              {busy && <p className={s.note}>{t('common.loading')}</p>}
              {error && <p className={s.err} role="alert">{error}</p>}
              {notice && <p className={s.ok} role="status">{notice}</p>}
            </section>
            {pass && (
              <section className={s.result}>
                <div className={s.who}>
                  <strong>{pass.customerName}</strong>
                  {pass.redeemable && <span className={s.ready}>{t('card.redeemable')}</span>}
                </div>
                <StampCard
                  businessName={pass.businessName}
                  cardName={pass.cardName}
                  reward={pass.reward}
                  stampsRequired={pass.stampsRequired}
                  stamps={pass.stamps}
                  color={pass.color}
                  rewardLabel={t('card.rewardLabel', { reward: pass.reward })}
                  progressLabel={t('card.progress', { stamps: pass.stamps, total: pass.stampsRequired })}
                />
                <div className={s.actions}>
                  <button className={s.stamp} disabled={busy || pass.redeemable} onClick={() => act('stamp')}>{t('staff.addStamp')}</button>
                  <button className={s.redeem} disabled={busy || !pass.redeemable} onClick={() => act('redeem')}>{t('staff.redeem')}</button>
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
