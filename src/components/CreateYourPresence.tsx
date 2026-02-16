'use client';

import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function CreateYourPresence() {
  const t = useTranslations('createYourPresence');
  const ref = useScrollAnimation();

  const features = [
    t('feature1'),
    t('feature2'),
    t('feature3'),
    t('feature4'),
    t('feature5')
  ];

  return (
    <section ref={ref} className="create-presence section-fade-in">
      <div className="container">
        <div className="create-presence-content">
          <div className="create-presence-text">
            <h2 className="create-presence-headline">{t('headline')}</h2>
            <ul className="create-presence-features">
              {features.map((feature, index) => (
                <li key={index} className="feature-item">
                  <span className="feature-bullet">•</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
          </div>
          
          <div className="create-presence-visual">
            <div className="feed-mockup">
              <div className="feed-header">
                <div className="feed-avatar"></div>
                <div className="feed-user-info">
                  <div className="feed-line short"></div>
                  <div className="feed-line shorter"></div>
                </div>
              </div>
              
              <div className="feed-content">
                <div className="feed-image-placeholder">
                  <Image 
                    src="/images/nature.png" 
                    alt="AI Symbolic Image" 
                    className="feed-ai-image"
                    width={400}
                    height={225}
                    quality={85}
                  />
                </div>
                
                <div className="feed-text">
                  <div className="feed-line"></div>
                  <div className="feed-line"></div>
                  <div className="feed-line short"></div>
                </div>
                
                <div className="feed-actions">
                  <span className="feed-action">💚</span>
                  <span className="feed-action">💭</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
