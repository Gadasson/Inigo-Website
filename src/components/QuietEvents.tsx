'use client';

import { useTranslations } from 'next-intl';

export default function QuietEvents() {
  const t = useTranslations('quietEvents');
  const bodyLines = t('body').split('\n').filter(line => line.trim());
  // Using 2 images to show the concept of quiet events - people together but in their own space
  const images = [
    { src: '/images/event1.jpg', alt: 'Quiet event - people together' },
    { src: '/images/event2.jpg', alt: 'Quiet event - shared presence' }
  ];

  return (
    <section className="quiet-events-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="quiet-events-content">
          <div className="events-images-grid">
            {images.map((image, index) => (
              <div key={index} className="event-image-wrapper">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="event-image"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          {bodyLines.map((line, index) => (
            <p key={index} className="event-line">
              {line}
            </p>
          ))}
          <p className="events-closing">{t('closing')}</p>
        </div>
      </div>
    </section>
  );
}

