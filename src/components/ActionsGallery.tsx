'use client';

import { useTranslations } from 'next-intl';

export default function ActionsGallery() {
  const t = useTranslations('actionsGallery');
  const actions = t('actions').split('\n').filter(line => line.trim());
  // Using 4 images for better visual balance - grid of 2x2 on mobile, 4 columns on desktop
  const images = [
    { src: '/images/silence.jpg', alt: 'Person sitting quietly' },
    { src: '/images/walk.jpg', alt: 'Person walking' },
    { src: '/images/reading.jpg', alt: 'Person reading' },
    { src: '/images/gardening.jpg', alt: 'Hands working with soil' }
  ];

  return (
    <section className="actions-gallery-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="actions-gallery-content">
          <div className="actions-images-grid">
            {images.map((image, index) => (
              <div key={index} className="action-image-wrapper">
                <img
                  src={image.src}
                  alt={image.alt}
                  className="action-image"
                  loading="lazy"
                />
              </div>
            ))}
          </div>
          <div className="actions-list">
            {actions.map((action, index) => (
              <p key={index} className="action-item">
                {action.trim()}
              </p>
            ))}
          </div>
          <p className="actions-closing">{t('closing')}</p>
        </div>
      </div>
    </section>
  );
}

