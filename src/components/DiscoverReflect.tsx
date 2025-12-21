'use client';

import { useTranslations } from 'next-intl';

export default function DiscoverReflect() {
  const t = useTranslations('discoverReflect');
  
  const cards = t.raw('cards') as {
    title: string;
    description: string;
  }[];
  
  const spots = t.raw('spots') as {
    icon: string;
    title: string;
    description: string;
  }[];

  return (
    <section className="discover-reflect-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('miniHeadline')}</h2>
          <p>{t('copy')}</p>
        </div>
        
        <div className="discover-features">
          {cards.map((card, index) => (
            <div key={index} className="feature-item">
              <div className="feature-icon">🌿</div>
              <h3>{card.title}</h3>
              <p>{card.description}</p>
            </div>
          ))}
        </div>
        
        <div className="spots-preview">
          {spots.map((spot, index) => (
            <div key={index} className="spot-card">
              <div className="spot-image">{spot.icon}</div>
              <h3>{spot.title}</h3>
              <p>{spot.description}</p>
            </div>
          ))}
        </div>
        
        <div className="section-cta">
          <a href="#early-access" className="btn btn-secondary">
            {t('cta')}
          </a>
          {t('ctaNote') && (
            <p className="cta-note">{t('ctaNote')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
