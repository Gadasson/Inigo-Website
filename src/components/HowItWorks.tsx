'use client';

import { useTranslations } from 'next-intl';

export default function HowItWorks() {
  const t = useTranslations('howItWorks');
  
  const lines = t('text').split('\n');
  
  return (
    <section className="how-it-works-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="how-it-works-content">
          {lines.map((line, index) => (
            <p key={index} className={line.trim() === '' ? 'how-it-works-spacer' : ''}>
              {line.trim() === '' ? '\u00A0' : line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

