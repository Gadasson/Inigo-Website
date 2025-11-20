'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function About() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <>
      {/* Hero Section */}
      <section className="about-hero">
        <div className="container">
          <div className="about-hero-content">
            <h1>{t('about.title')}</h1>
            <p className="hero-subtitle">{t('about.heroSubtitle')}</p>
          </div>
        </div>
      </section>

      {/* Why Inigo Section */}
      <section className="why-inigo-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>{t('about.whyInigo.title')}</h2>
            </div>
            <div className="story-content">
              <p className="story-problem">
                {t('about.whyInigo.problem').split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t('about.whyInigo.problem').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
              <p className="story-solution">
                {t('about.whyInigo.solution')}
              </p>
              <p className="story-core">
                {t('about.whyInigo.core').split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t('about.whyInigo.core').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
              <p className="story-closing">
                {t('about.whyInigo.closing')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Meditation Section */}
      <section className="why-meditation-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>{t('about.whyMeditation.title')}</h2>
            </div>
            <div className="meditation-content">
              <p className="meditation-intro">
                {t('about.whyMeditation.intro').split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t('about.whyMeditation.intro').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
              <p className="meditation-core">
                {t('about.whyMeditation.core')}
              </p>
              <div className="meditation-benefits">
                {(t.raw('about.whyMeditation.benefits') as string[]).map((benefit, index) => (
                  <div key={index} className="benefit-item">
                    <span className="benefit-icon">
                      {index === 0 ? '🧠' : index === 1 ? '🎯' : index === 2 ? '✨' : index === 3 ? '🔋' : index === 4 ? '🌿' : '😊'}
                    </span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              <p className="meditation-closing">
                {t('about.whyMeditation.closing')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Together Section */}
      <section className="why-together-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>{t('about.whyTogether.title')}</h2>
            </div>
            <div className="together-content">
              <p className="together-problem">
                {t('about.whyTogether.problem').split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t('about.whyTogether.problem').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
              <div className="together-transformation">
                <h3>{t('about.whyTogether.transformationTitle')}</h3>
                <p>
                  {t('about.whyTogether.transformationText').split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < t('about.whyTogether.transformationText').split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Collective World State Section */}
      <section className="collective-world-state-section">
        <div className="container">
          <div className="section-content">
            <div className="section-header">
              <h2>{t('about.collectiveWorldState.title')}</h2>
              <p className="section-subtitle">
                {t('about.collectiveWorldState.subtitle')}
              </p>
            </div>
            <div className="collective-content">
              <p className="collective-intro">
                {t('about.collectiveWorldState.intro').split('\n').map((line, i) => (
                  <span key={i}>
                    {line}
                    {i < t('about.collectiveWorldState.intro').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </p>
              <p className="collective-vision">
                {t('about.collectiveWorldState.vision')}
              </p>
              <div className="collective-features">
                {(t.raw('about.collectiveWorldState.features') as string[]).map((feature, index) => (
                  <div key={index} className="feature-item">
                    <span className="feature-icon">
                      {index === 0 ? '🌍' : index === 1 ? '💫' : index === 2 ? '❤️' : '🌱'}
                    </span>
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
              <div className="collective-closing">
                <p>
                  {t('about.collectiveWorldState.closing').split('\n').map((line, i) => (
                    <span key={i}>
                      {line}
                      {i < t('about.collectiveWorldState.closing').split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </p>
                <p className="revolution-call">
                  {t('about.collectiveWorldState.revolutionCall')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="about-cta">
        <div className="container">
          <div className="cta-content">
            <h2>{t('about.cta.title')}</h2>
            <p>{t('about.cta.subtitle')}</p>
            <div className="cta-buttons">
              <Link href={`/${locale}#early-access`} className="btn btn-primary btn-large">
                {t('common.joinEarlyAccess')}
              </Link>
              <Link href={`/${locale}/contact`} className="btn btn-ghost">
                {t('common.getInTouch')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
