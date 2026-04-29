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
    <section ref={ref} className="world-state-new home-section-world section-fade-in" aria-labelledby="world-quiet-title">
      <div className="container container--narrow">
        <div className="world-state-new-content">
          <h2 id="world-quiet-title" className="world-state-new-headline">
            {t('headline')}
          </h2>
          <p className="world-state-new-subheadline">{t('subheadline')}</p>

          <div className="world-state-visual world-state-visual--quiet">
            <div className="world-state-quiet-orb" aria-hidden>
              <span className="world-state-quiet-orb-core" />
            </div>

            <div className="world-state-counter-new">
              {loading ? (
                <div className="counter-skeleton-new counter-skeleton-new--quiet" />
              ) : (
                <div className="counter-number-new counter-number-new--quiet">
                  {currentMinutes.toLocaleString()}
                </div>
              )}
              <div className="live-indicator live-indicator--quiet">
                <span className="live-dot live-dot--quiet" />
                <span>{t('liveNow')}</span>
              </div>
            </div>
          </div>

          <p className="world-state-explanation world-state-explanation--quiet">{t('explanation')}</p>
        </div>
      </div>
    </section>
  );
}
