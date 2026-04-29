'use client';

import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function CommunityNew() {
  const t = useTranslations('communityNew');
  const ref = useScrollAnimation();

  return (
    <section ref={ref} className="community-new home-section-simplicity section-fade-in" aria-labelledby="simplicity-title">
      <div className="container container--narrow">
        <div className="community-new-content">
          <h2 id="simplicity-title" className="community-new-headline community-new-headline--preline">
            {t('headline')}
          </h2>
          <p className="community-supporting">{t('supporting')}</p>
        </div>
      </div>
    </section>
  );
}
