'use client';

import { useTranslations } from 'next-intl';

export default function Wonder() {
  const t = useTranslations('wonder');
  
  const lines = t('text').split('\n');
  
  return (
    <section className="wonder-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="wonder-content">
          {lines.map((line, index) => (
            <p key={index} className={line.trim() === '' ? 'wonder-spacer' : ''}>
              {line.trim() === '' ? '\u00A0' : line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

