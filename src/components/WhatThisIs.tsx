'use client';

import { useTranslations } from 'next-intl';

export default function WhatThisIs() {
  const t = useTranslations('whatThisIs');
  
  const bodyLines = t('body').split('\n');
  
  return (
    <section className="what-this-is-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="what-this-is-content">
          {bodyLines.map((line, index) => (
            <p key={index} className={line.trim() === '' ? 'what-this-is-spacer' : ''}>
              {line.trim() === '' ? '\u00A0' : line}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}

