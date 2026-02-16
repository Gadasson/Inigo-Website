'use client';

import { useTranslations } from 'next-intl';
import { useScrollAnimation } from '../hooks/useScrollAnimation';

export default function FinalCTA() {
  const t = useTranslations('finalCTA');
  const ref = useScrollAnimation();

  return (
    <section ref={ref} className="final-cta section-fade-in">
      <div className="container">
        <div className="final-cta-content">
          <h2 className="final-cta-headline">{t('headline')}</h2>
          
          <div className="final-cta-buttons">
            <a href="#" className="btn btn-app-store" aria-label="App Store - Coming Soon">
              <span className="btn-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 9.41 18.62 12.01 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" fill="currentColor"/>
                </svg>
              </span>
              <span className="btn-text">
                <span className="btn-label">App Store</span>
                <span className="btn-sublabel">Coming Soon</span>
              </span>
            </a>
            <a href="#" className="btn btn-google-play" aria-label="Google Play - Coming Soon">
              <span className="btn-icon">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.19 15.12L14.54 12.85L17.19 10.68L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="currentColor"/>
                </svg>
              </span>
              <span className="btn-text">
                <span className="btn-label">Google Play</span>
                <span className="btn-sublabel">Coming Soon</span>
              </span>
            </a>
          </div>
          
          {t('followUs') && (
            <p className="final-cta-follow">{t('followUs')}</p>
          )}
        </div>
      </div>
    </section>
  );
}
