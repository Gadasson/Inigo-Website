'use client';

import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function CommunityNew() {
  const t = useTranslations('communityNew');
  const ref = useScrollAnimation();

  return (
    <section ref={ref} className="community-new section-fade-in">
      <div className="container">
        <div className="community-new-content">
          <h2 className="community-new-headline">{t('headline')}</h2>
          <div className="community-features">
            <p>{t('feature1')}</p>
            <p>{t('feature2')}</p>
            <p>{t('feature3')}</p>
            <p>{t('feature4')}</p>
          </div>
          <p className="community-tagline">{t('tagline')}</p>
        </div>
      </div>
    </section>
  );
}
