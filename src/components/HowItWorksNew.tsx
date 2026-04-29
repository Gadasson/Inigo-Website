'use client';

import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function HowItWorksNew() {
  const t = useTranslations('howItWorksNew');
  const ref = useScrollAnimation();

  return (
    <section ref={ref} className="how-it-works-new home-section-shift section-fade-in" aria-labelledby="shift-title">
      <div className="container container--narrow">
        <div className="home-shift-copy">
          <p className="home-shift-lead" id="shift-title">
            {t('line1')}
            <br />
            <span className="home-shift-emphasis">{t('line2')}</span>
          </p>
          <p className="home-shift-body">{t('body1')}</p>
          <p className="home-shift-body home-shift-body--accent">{t('body2')}</p>
          <p className="home-shift-body">{t('body3')}</p>
        </div>
      </div>
    </section>
  );
}
