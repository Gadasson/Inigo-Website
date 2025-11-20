'use client';

import { useTranslations } from 'next-intl';

export default function EarlyAdopters() {
  const t = useTranslations('earlyAdopters');
  
  return (
    <section className="early-adopters-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('miniHeadline')}</h2>
        </div>
        
        <div className="benefits-list">
          {(t.raw('bullets') as string[]).map((benefit, index) => (
            <div key={index} className="benefit-item">
              <div className="benefit-icon">🌟</div>
              <span>{benefit}</span>
            </div>
          ))}
        </div>
        
        <div className="section-cta">
          <a href="#early-access" className="btn btn-primary btn-large">
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
  );
}
