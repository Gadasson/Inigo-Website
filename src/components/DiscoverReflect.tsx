'use client';

import { useTranslations } from 'next-intl';

export default function DiscoverReflect() {
  const t = useTranslations('discoverReflect');
  
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
          {(t.raw('bullets') as string[]).map((bullet, index) => (
            <div key={index} className="feature-item">
              <div className="feature-icon">🌿</div>
              <span>{bullet}</span>
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
        </div>
      </div>
    </section>
  );
}
