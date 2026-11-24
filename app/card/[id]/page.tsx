import { notFound } from 'next/navigation';
import QRCode from 'qrcode';
import StampCard from '@/components/StampCard';
import s from './card.module.css';
import { getServerI18n } from '@/lib/i18n-server';
import { formatDate } from '@/lib/i18n';
import { getCustomerView } from '@/lib/loyalty';
import { listCustomerMessages } from '@/lib/messages';

export const dynamic = 'force-dynamic';

export default async function CardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const view = getCustomerView(id);
  if (!view) notFound();
  const { locale, t } = await getServerI18n();
  let messages: Awaited<ReturnType<typeof listCustomerMessages>> = [];
  try {
    messages = await listCustomerMessages(id);
  } catch {
    messages = [];
  }
  const qr = await QRCode.toString(id, { type: 'svg', margin: 1 });

  const apple = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M16.4 12.7c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.15-2.8.85-3.5.85-.75 0-1.85-.83-3.05-.8-1.55.02-3 .92-3.8 2.3-1.65 2.85-.42 7.05 1.15 9.35.8 1.1 1.7 2.35 2.9 2.3 1.15-.05 1.6-.75 3-.75s1.8.75 3.05.72c1.25-.02 2.05-1.1 2.8-2.25.9-1.3 1.25-2.55 1.28-2.62-.03-.02-2.45-.93-2.45-3.7zM14.2 5.9c.65-.8 1.1-1.85.97-2.9-.93.04-2.07.62-2.74 1.4-.6.68-1.12 1.8-.98 2.8 1.04.08 2.1-.53 2.75-1.3z" /></svg>
  );
  const google = (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M22 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.6a4.8 4.8 0 01-2.1 3.1v2.6h3.4c2-1.8 3.1-4.5 3.1-7.5z" /><path fill="#34A853" d="M12 22.5c2.8 0 5.2-.9 6.9-2.5l-3.4-2.6c-.9.6-2.1 1-3.5 1-2.7 0-5-1.8-5.8-4.3H2.7v2.7A10.5 10.5 0 0012 22.5z" /><path fill="#FBBC05" d="M6.2 14.1a6.3 6.3 0 010-4.2V7.2H2.7a10.5 10.5 0 000 9.6z" /><path fill="#EA4335" d="M12 5.6c1.5 0 2.9.5 4 1.6l3-3A10.5 10.5 0 002.7 7.2l3.5 2.7C7 7.4 9.3 5.6 12 5.6z" /></svg>
  );

  return (
    <main className={s.page}>
      <div className={s.col}>
        <h1 className={s.greet}>{t('cardPage.greeting', { name: view.name })}</h1>
        <p className={s.tag}>{t('cardPage.tagline')}</p>
        <StampCard
          businessName={view.businessName}
          cardName={view.cardName}
          reward={view.reward}
          stampsRequired={view.stampsRequired}
          stamps={view.stamps}
          color={view.color}
          rewardLabel={t('card.rewardLabel', { reward: view.reward })}
          progressLabel={t('card.progress', { stamps: Math.min(view.stamps, view.stampsRequired), total: view.stampsRequired })}
          qrSvg={qr}
          qrAlt={t('cardPage.qr.alt')}
          qrHint={t('cardPage.qr.hint')}
        />
        {view.redeemable && <span className={s.ready}>{t('card.redeemable')}</span>}

        <div className={s.wallet}>
          <p className={s.wtitle}>{t('cardPage.wallet.title')}</p>
          <a className={`${s.wbtn} ${s.apple}`} href={`/api/pass/${encodeURIComponent(id)}/apple`}>{apple}{t('cardPage.wallet.apple')}</a>
          <a className={`${s.wbtn} ${s.google}`} href={`/api/pass/${encodeURIComponent(id)}/google`}>{google}{t('cardPage.wallet.google')}</a>
        </div>

        <section className={s.msgs}>
          <h2>{t('cardPage.messages.title', { business: view.businessName })}</h2>
          {messages.length === 0 ? (
            <p className={s.empty}>{t('cardPage.messages.empty')}</p>
          ) : (
            messages.map((m) => (
              <article className={s.msg} key={m.id}>
                <h3>{m.title}</h3>
                <time>{formatDate(locale, m.createdAt)}</time>
                <p>{m.body}</p>
              </article>
            ))
          )}
        </section>
      </div>
    </main>
  );
}
