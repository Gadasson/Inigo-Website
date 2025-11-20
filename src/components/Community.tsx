'use client';

import { useTranslations } from 'next-intl';

export default function Community() {
  const t = useTranslations('community');
  
  return (
    <section className="community-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('miniHeadline')}</h2>
          <p>{t('copy')}</p>
        </div>
        
        <div className="community-pillars">
          {(t.raw('pillars') as Array<{ title: string; icon: string }>).map((pillar, index) => (
            <div key={index} className="pillar-item">
              <div className="pillar-icon">{pillar.icon}</div>
              <h3>{pillar.title}</h3>
            </div>
          ))}
        </div>
        
        <div className="section-cta">
          <a href="#early-access" className="btn btn-primary">
            {t('cta')}
          </a>
        </div>
      </div>
    </section>
  );
}
