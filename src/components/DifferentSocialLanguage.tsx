'use client';

import { useTranslations } from 'next-intl';

export default function DifferentSocialLanguage() {
  const t = useTranslations('differentSocialLanguage');
  const items = t.raw('items') as string[];

  return (
    <section className="different-social-language-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="social-language-content">
          <div className="social-items">
            {items.map((item, index) => (
              <div key={index} className="social-item">
                {item}
              </div>
            ))}
          </div>
          <p className="social-closing">{t('closing')}</p>
        </div>
      </div>
    </section>
  );
}

