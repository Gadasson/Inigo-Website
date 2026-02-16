'use client';

import { useTranslations } from 'next-intl';
import { useWorldStateContext } from '../contexts/WorldStateContext';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function WorldStateNew() {
  const t = useTranslations('worldStateNew');
  const { worldState, loading } = useWorldStateContext();
  const currentMinutes = worldState?.state_info?.current_minutes ?? 0;
  const ref = useScrollAnimation();

  return (
    <section ref={ref} className="world-state-new section-fade-in">
      <div className="container">
        <div className="world-state-new-content">
          <h2 className="world-state-new-headline">{t('headline')}</h2>
          <p className="world-state-new-subheadline">{t('subheadline')}</p>
          
          <div className="world-state-visual">
            <div className="heart-progression">
              <div className="heart-icon">❤️</div>
              <div className="heart-glow"></div>
            </div>
            
            <div className="world-state-counter-new">
              {loading ? (
                <div className="counter-skeleton-new"></div>
              ) : (
                <div className="counter-number-new">
                  {currentMinutes.toLocaleString()}
                </div>
              )}
              <div className="live-indicator">
                <span className="live-dot"></span>
                <span>{t('liveNow')}</span>
              </div>
            </div>
          </div>
          
          <p className="world-state-explanation">{t('explanation')}</p>
        </div>
      </div>
    </section>
  );
}
