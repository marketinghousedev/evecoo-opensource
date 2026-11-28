'use client';

import { useT } from '@/components/I18nProvider';
import { IlloSvg } from '@/components/illustration/IlloSvg';
import { backgroundsPosterCoffeeHills } from '@/components/illustration/illo-data';
import { Qr } from './howitworks/art';
import { PASS_BY_SLUG, type PassSlug } from './passes';
import './qrposter.css';

export type QrPosterProps = {
  /** Business shown in the brand bar (data from passes.ts). */
  brand?: PassSlug;
  /** Optional photo (src). Replaces the vector landscape; rendered object-fit: cover. */
  photo?: string;
  /** Encoded in the QR code. */
  url?: string;
  className?: string;
};

/** In-store QR poster, portrait 3:4. Sized in container units: it scales with whatever width it is given. */
export function QrPoster({ brand = 'coffee', photo, url = 'https://evecoo.de/join/', className }: QrPosterProps) {
  const { t } = useT();
  const biz = PASS_BY_SLUG[brand];
  return (
    <div className={`qrp${className ? ` ${className}` : ''}`}>
      <div className="qrp-bg" aria-hidden="true">
        {photo ? <img src={photo} alt="" className="qrp-photo" /> : <IlloSvg data={backgroundsPosterCoffeeHills} className="qrp-art" preserveAspectRatio="xMidYMid slice" />}
      </div>
      <div className="qrp-bar">
        <IlloSvg data={biz.mark} className="qrp-mark" />
        <span>{biz.name}</span>
      </div>
      <div className="qrp-head">
        <h3><span>{t('landing.poster.headline1')}</span> <span>{t('landing.poster.headline2')}</span></h3>
        <p>{t('landing.poster.sub')}</p>
      </div>
      <div className="qrp-scan">
        <span className="qrp-cta">{t('landing.poster.scan')}
          <svg viewBox="0 0 14 14" width="1em" height="1em" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M7 2v9M3 7l4 4 4-4" /></svg>
        </span>
        <div className="qrp-tile">
          <i className="c tl" /><i className="c tr" /><i className="c bl" /><i className="c br" />
          <Qr size="100%" text={url} />
        </div>
      </div>
      <div className="qrp-foot">
        <div className="qrp-pills"><span>{t('landing.poster.apple')}</span><span>{t('landing.poster.google')}</span></div>
        <small>{t('landing.poster.powered')}</small>
      </div>
    </div>
  );
}
