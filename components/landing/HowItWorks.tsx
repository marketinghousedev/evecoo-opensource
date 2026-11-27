'use client';

import { useT } from '@/components/I18nProvider';
import { SectionHead } from './Features';
import { HowItWorksStory } from './howitworks/Story';
import { HOW_KEYS, type HowCopy } from './howitworks/keys';

export function HowItWorks() {
  const { t } = useT();
  const copy = Object.fromEntries(HOW_KEYS.map((k) => [k, t(`landing.how.${k}`)])) as HowCopy;
  return (
    <section className="sec" id="how">
      <SectionHead eyebrow={t('landing.how.eyebrow')} t1={t('landing.how.title1')} t2={t('landing.how.title2')} sub={t('landing.how.sub')} />
      <HowItWorksStory c={copy} />
    </section>
  );
}
