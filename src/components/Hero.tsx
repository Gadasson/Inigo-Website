'use client';

import { useTranslations } from 'next-intl';
import { useWorldStateContext } from '../contexts/WorldStateContext';

export default function Hero() {
  const t = useTranslations('hero');
  const { worldState, loading } = useWorldStateContext();
  const subtitleLines = t('subtitle').split('\n');
  const currentMinutes = worldState?.state_info?.current_minutes ?? 0;

  return (
    <section className="hero">
      <div className="hero-inner">
        <h1>{t('title')}</h1>
        <p className="hero-subtitle">
          {subtitleLines.map((line, index) => (
            <span key={index}>
              {line}
              {index < subtitleLines.length - 1 && <br />}
            </span>
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
            <span className="counter-label">{t('counterLabel')}</span>
          </div>
        </div>
        
        <div className="cta-buttons">
          <a 
            className="btn btn-primary" 
            href="#early-access"
            data-event="hero_cta_clicked"
          >
            {t('primaryCta')}
          </a>
        </div>
      </div>
    </section>
  );
}
