'use client';

import { useTranslations, useLocale } from 'next-intl';
import Image from 'next/image';
import Link from 'next/link';
import { useScrollAnimation } from '../hooks/useScrollAnimation';
import { useMemo, useState, useEffect } from 'react';

// Deterministic random number generator using seed
function seededRandom(seed: number) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

export default function HeroNew() {
  const t = useTranslations('heroNew');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const ref = useScrollAnimation();
  const [mounted, setMounted] = useState(false);
  
  const heroImage = locale === 'he' ? '/images/hero1_he.png' : '/images/hero1.png';

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate stable random values for dots using seeded random
  const dots = useMemo(() => {
    return Array.from({ length: 20 }, (_, i) => {
      const seed = i * 123.456; // Deterministic seed based on index
      return {
        id: i,
        left: seededRandom(seed) * 100,
        top: seededRandom(seed + 1) * 100,
        delay: seededRandom(seed + 2) * 5,
        duration: 15 + seededRandom(seed + 3) * 10
      };
    });
  }, []);

  return (
    <section ref={ref} className="hero-new section-fade-in">
      {mounted && (
        <div className="floating-dots">
          {dots.map((dot) => (
            <div key={dot.id} className="floating-dot" style={{
              left: `${dot.left}%`,
              top: `${dot.top}%`,
              animationDelay: `${dot.delay}s`,
              animationDuration: `${dot.duration}s`
            }} />
          ))}
        </div>
      )}
      
      <div className="hero-new-container">
        <div className="hero-new-content">
          <div className="hero-new-text">
            <h1 className="hero-new-headline">{t('headline')}</h1>
            <p className="hero-new-subheadline">{t('subheadline')}</p>
            
            <div className="hero-new-supporting">
              <p>{t('supporting1')}</p>
              <p>{t('supporting2')}</p>
              <p>{t('supporting3')}</p>
            </div>
            
            <div className="hero-new-cta">
              <a href="#" className="btn btn-app-store" aria-label={`${t('appStore')} - ${t('comingSoon')}`}>
                <span className="btn-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M18.71 19.5C17.88 20.74 17 21.95 15.66 21.97C14.32 22 13.89 21.18 12.37 21.18C10.84 21.18 10.37 21.95 9.1 22C7.79 22.05 6.8 20.68 5.96 19.47C4.25 17 2.94 12.45 4.7 9.39C5.57 7.87 7.13 6.91 8.82 6.88C10.1 6.86 11.32 7.75 12.11 7.75C12.89 7.75 14.37 6.68 15.92 6.84C16.57 6.87 18.39 7.1 19.56 8.82C19.47 9.41 18.62 12.01 18.71 19.5M13 3.5C13.73 2.67 14.94 2.04 15.94 2C16.07 3.17 15.6 4.35 14.9 5.19C14.21 6.04 13.07 6.7 11.95 6.61C11.8 5.46 12.36 4.26 13 3.5Z" fill="currentColor"/>
                  </svg>
                </span>
                <span className="btn-text">
                  <span className="btn-label">{t('appStore')}</span>
                  <span className="btn-sublabel">{t('comingSoon')}</span>
                </span>
              </a>
              <a href="#" className="btn btn-google-play" aria-label={`${t('googlePlay')} - ${t('comingSoon')}`}>
                <span className="btn-icon">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 20.5V3.5C3 2.91 3.34 2.39 3.84 2.15L13.69 12L3.84 21.85C3.34 21.6 3 21.09 3 20.5ZM16.81 15.12L6.05 21.34L14.54 12.85L16.81 15.12ZM20.16 10.81C20.5 11.08 20.75 11.5 20.75 12C20.75 12.5 20.5 12.92 20.16 13.19L17.19 15.12L14.54 12.85L17.19 10.68L20.16 10.81ZM6.05 2.66L16.81 8.88L14.54 11.15L6.05 2.66Z" fill="currentColor"/>
                  </svg>
                </span>
                <span className="btn-text">
                  <span className="btn-label">{t('googlePlay')}</span>
                  <span className="btn-sublabel">{t('comingSoon')}</span>
                </span>
              </a>
            </div>
            
            <p className="hero-new-microcopy">{t('microcopy')}</p>
            
            <Link href={`/${locale}/about`} className="hero-new-about-link">
              {tCommon('learnMore')}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="hero-new-about-arrow">
                <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
          </div>
          
          <div className="hero-new-visual">
            <div className="app-mockup">
              <Image 
                src={heroImage} 
                alt="Inigo App" 
                className="hero-app-image"
                width={400}
                height={711}
                priority
                quality={90}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
