'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function HeroNew() {
  const t = useTranslations('heroNew');
  const locale = useLocale();
  const ref = useScrollAnimation();

  return (
    <section ref={ref} className="hero-new hero-new--quiet section-fade-in" aria-labelledby="hero-quiet-title">
      <div className="hero-new-quiet-glow" aria-hidden />
      <div className="hero-new-container">
        <div className="hero-new-content hero-new-content--quiet">
          <div className="hero-new-text">
            <h1 id="hero-quiet-title" className="hero-new-headline">
              {t('headline')}
            </h1>
            <p className="hero-new-subheadline">{t('subheadline')}</p>

            <div className="hero-new-cta hero-new-cta--quiet">
              <a
                href="#final-store"
                className="btn btn-quiet-primary"
              >
                {t('primaryCta')}
              </a>
              <Link href={`/${locale}/about`} className="btn btn-quiet-secondary">
                {t('exploreCta')}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
