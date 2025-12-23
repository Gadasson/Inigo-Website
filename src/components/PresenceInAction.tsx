'use client';

import { useTranslations } from 'next-intl';

export default function PresenceInAction() {
  const t = useTranslations('presenceInAction');
  
  const textLines = t('text').split('\n');
  const images = t.raw('images') as {
    src: string;
    alt: string;
  }[];

  return (
    <section className="presence-in-action-section">
      <div className="container">
        <div className="section-header">
          <h2>{t('title')}</h2>
        </div>
        <div className="presence-in-action-content">
          <div className="presence-in-action-text">
            {textLines.map((line, index) => (
              <p key={index} className={line.trim() === '' ? 'presence-spacer' : ''}>
                {line.trim() === '' ? '\u00A0' : line}
              </p>
            ))}
          </div>
          
          <div className="presence-images-container">
            <div className="presence-images-scroll">
              {images.map((image, index) => (
                <div key={index} className="presence-image-wrapper">
                  <img
                    src={image.src}
                    alt={image.alt}
                    className="presence-image"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

