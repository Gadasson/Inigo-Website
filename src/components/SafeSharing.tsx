'use client';

import { useTranslations } from 'next-intl';

export default function SafeSharing() {
  const t = useTranslations('safeSharing');
  const bodyLines = t('body').split('\n').filter(line => line.trim());
  // Using 1 symbolic/abstract image to represent safe sharing without exposure
  const image = { src: '/images/anime.jpg', alt: 'Symbolic representation of safe sharing' };

  return (
    <section className="safe-sharing-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="safe-sharing-content">
          <div className="sharing-image-wrapper">
            <img
              src={image.src}
              alt={image.alt}
              className="sharing-image"
              loading="lazy"
            />
          </div>
          {bodyLines.map((line, index) => (
            <p key={index} className="sharing-line">
              {line}
            </p>
          ))}
          <p className="sharing-closing">{t('closing')}</p>
        </div>
      </div>
    </section>
  );
}

