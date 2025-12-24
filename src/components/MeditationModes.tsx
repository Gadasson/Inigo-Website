'use client';

import { useTranslations } from 'next-intl';

export default function MeditationModes() {
  const t = useTranslations('meditationModes');
  const modes = t.raw('items') as string[];

  return (
    <section className="meditation-modes-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="meditation-modes-content">
          <div className="modes-list">
            {modes.map((mode, index) => (
              <div key={index} className="mode-item">
                {mode}
              </div>
            ))}
          </div>
          {t('optional') && <p className="modes-optional">{t('optional')}</p>}
        </div>
      </div>
    </section>
  );
}

