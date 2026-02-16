'use client';

import { useTranslations } from 'next-intl';

export default function WhatIsInigo() {
  const t = useTranslations('whatIsInigo');
  
  const bodyLines = t('body').split('\n');
  
  return (
    <section className="what-is-inigo-section">
      <div className="container">
        <div className="what-is-inigo-content">
          <h2 className="what-is-inigo-title">{t('title')}</h2>
          <div className="what-is-inigo-body">
            {bodyLines.map((line, index) => (
              <p key={index} className={line.trim() === '' ? 'what-is-inigo-spacer' : ''}>
                {line.trim() === '' ? '\u00A0' : line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



