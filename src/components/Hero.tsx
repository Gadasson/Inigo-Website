'use client';

import { useTranslations, useLocale } from 'next-intl';
import { useWorldStateContext } from '../contexts/WorldStateContext';
import Link from 'next/link';

export default function Hero() {
  const t = useTranslations();
  const locale = useLocale();
  const { worldState, loading } = useWorldStateContext();
  
  // Get current minutes from API or use fallback
  // Fallback to 0 if no data available (prevents errors)
  const currentMinutes = worldState?.state_info?.current_minutes ?? 0;

  return (
    <section className="hero">
      <div className="hero-inner">
        <span className="badge">{t('hero.badge')}</span>
        
        <h1>{t('hero.headline')}</h1>
        <p className="hero-heartline">{t('hero.heartline')}</p>
        
        {/* World State Counter */}
        <div className="world-state-counter">
          <div className="counter-display">
            <div className="counter-circle">
              {loading && (
                <div className="counter-skeleton"></div>
              )}
              {!loading && (
                <span className="counter-number">
                  {currentMinutes.toLocaleString()}
                </span>
              )}
            </div>
            <span className="counter-label">{t('hero.counterLabel')}</span>
          </div>
        </div>
        
        <div className="cta-buttons">
          <Link 
            className="btn btn-ghost" 
            href={`/${locale}/about`}
            data-event="hero_about_clicked"
          >
            {t('hero.aboutUs')}
          </Link>
          <a 
            className="btn btn-primary" 
            href="#early-access"
            data-event="hero_cta_clicked"
          >
            {t('hero.primaryCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
