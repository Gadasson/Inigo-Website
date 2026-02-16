'use client';

import { useTranslations } from 'next-intl';

export default function Foundation() {
  const t = useTranslations('foundation');
  
  const bodyLines = t('body').split('\n');
  
  return (
    <section className="foundation-section">
      <div className="container">
        <div className="foundation-content">
          {t('title') && (
            <h2 className="foundation-title">{t('title')}</h2>
          )}
          <div className="foundation-body">
            {bodyLines.map((line, index) => (
              <p key={index} className={line.trim() === '' ? 'foundation-spacer' : ''}>
                {line.trim() === '' ? '\u00A0' : line}
              </p>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}



