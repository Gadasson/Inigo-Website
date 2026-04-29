'use client';

import { Suspense } from 'react';
import { useTranslations } from 'next-intl';
import ContactForm from '../../../components/ContactForm';
import FinalCTA from '../../../components/FinalCTA';

export default function Contact() {
  const t = useTranslations();

  return (
    <main className="subpage-quiet">
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <h1>{t('contact.title')}</h1>
            <p className="hero-subtitle">{t('contact.subtitle')}</p>
          </div>
        </div>
      </section>

      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            <div className="contact-form-section">
              <h2>{t('contact.sendMessage')}</h2>
              <p>{t('contact.responseTime')}</p>

              <Suspense fallback={<p className="subpage-quiet-suspense">{t('contact.sendMessage')}…</p>}>
                <ContactForm />
              </Suspense>
            </div>

            <div className="contact-info-section">
              <h2>{t('contact.otherWays')}</h2>

              <div className="contact-methods">
                <div className="contact-method">
                  <span className="contact-method-mark" aria-hidden />
                  <div className="method-content">
                    <h3>{t('contact.email')}</h3>
                    <p>
                      <a href="mailto:inigomeditation@gmail.com">{t('contact.emailAddress')}</a>
                    </p>
                    <p>{t('contact.emailDescription')}</p>
                  </div>
                </div>

                <div className="contact-method">
                  <span className="contact-method-mark" aria-hidden />
                  <div className="method-content">
                    <h3>{t('contact.privacy')}</h3>
                    <p>
                      <a href="mailto:inigomeditation@gmail.com">{t('contact.emailAddress')}</a>
                    </p>
                    <p>{t('contact.privacyDescription')}</p>
                  </div>
                </div>

                <div className="contact-method">
                  <span className="contact-method-mark" aria-hidden />
                  <div className="method-content">
                    <h3>{t('contact.social')}</h3>
                    <p>{t('contact.socialDescription')}</p>
                    <p>{t('contact.socialComingSoon')}</p>
                  </div>
                </div>
              </div>

              <div className="contact-note">
                <h3>{t('contact.responseTimeTitle')}</h3>
                <p>{t('contact.responseTimeDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA anchorId="contact-final-store" titleId="contact-final-cta-title" />
    </main>
  );
}
