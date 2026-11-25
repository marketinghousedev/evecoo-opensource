import { getServerI18n } from '@/lib/i18n-server';
import { SectionHead } from './Features';
import { HowItWorksStory } from './howitworks/Story';
import { HOW_KEYS, type HowCopy } from './howitworks/keys';

export async function HowItWorks() {
  const { t } = await getServerI18n();
  const copy = Object.fromEntries(HOW_KEYS.map((k) => [k, t(`landing.how.${k}`)])) as HowCopy;
  return (
    <section className="sec" id="how">
      <SectionHead eyebrow={t('landing.how.eyebrow')} t1={t('landing.how.title1')} t2={t('landing.how.title2')} sub={t('landing.how.sub')} />
      <HowItWorksStory c={copy} />
    </section>
  );
}
