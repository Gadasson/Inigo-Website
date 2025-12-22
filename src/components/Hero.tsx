'use client';

import { Fragment } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { useWorldStateContext } from '../contexts/WorldStateContext';
import Link from 'next/link';

export default function Hero() {
  const t = useTranslations();
  const locale = useLocale();
  const { worldState, loading } = useWorldStateContext();
  const subheadLines = t('hero.subhead').split('\n');
  
  // Get current minutes from API or use fallback
  // Fallback to 0 if no data available (prevents errors)
  const currentMinutes = worldState?.state_info?.current_minutes ?? 0;

  return (
    <section className="hero">
      <div className="hero-inner">
        <span className="badge">{t('hero.badge')}</span>
        
        <h1>{t('hero.headline')}</h1>
        <p className="hero-heartline">{t('hero.heartline')}</p>
        
        <p className="hero-subhead">
          {subheadLines.map((line, index) => (
            <Fragment key={index}>
              {line}
              {index < subheadLines.length - 1 && <br className="hero-line-break" />}
            </Fragment>
          ))}
        </p>
        
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
          <Link 
            className="btn btn-ghost" 
            href={`/${locale}/contact?subject=Guided%20meditations%20for%20Inigo&message=Hi%20Inigo%20Team%2C%0A%0AI%E2%80%99m%20a%20meditation%20guide%20and%20I%E2%80%99d%20love%20to%20share%20guided%20meditations%20to%20support%20the%20quiet%20revolution.%0A%0AHere%E2%80%99s%20a%20bit%20about%20me%20and%20what%20I%20can%20offer%3A%0A-%20Style%2FTradition%3A%20%0A-%20Experience%3A%20%0A-%20Sample%20links%3A%20%0A-%20How%20I%E2%80%99d%20like%20to%20contribute%3A%20%0A%0AThank%20you!%0A`}
            data-event="hero_cta_clicked"
          >
            {t('hero.meditationGuide')}
          </Link>
        </div>
      </div>
    </section>
  );
}
