'use client';

import { useTranslations } from 'next-intl';

export default function Places() {
  const t = useTranslations('places');
  // Using 3 images to show different places around the world
  const images = [
    { src: '/images/place1.jpg', alt: 'Place 1' },
    { src: '/images/place2.jpg', alt: 'Place 2' },
    { src: '/images/place3.jpg', alt: 'Place 3' }
  ];

  return (
    <section className="places-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
          <p>{t('body')}</p>
        </div>
        <div className="places-images-grid">
          {images.map((image, index) => (
            <div key={index} className="place-image-wrapper">
              <img
                src={image.src}
                alt={image.alt}
                className="place-image"
                loading="lazy"
              />
            </div>
          ))}
        </div>
        <p className="places-closing">{t('closing')}</p>
      </div>
    </section>
  );
}

