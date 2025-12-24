'use client';

import { useTranslations } from 'next-intl';

export default function TimeThatCounts() {
  const t = useTranslations('timeThatCounts');
  const examples = t.raw('examples') as string[];

  return (
    <section className="time-that-counts-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="time-that-counts-content">
          <div className="time-examples">
            {examples.map((example, index) => (
              <p key={index} className="time-example">
                {example}
              </p>
            ))}
          </div>
          <p className="time-closing">{t('closing')}</p>
        </div>
      </div>
    </section>
  );
}

