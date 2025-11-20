'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import ContactForm from '../../../components/ContactForm';

export default function Contact() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <>
      {/* Hero Section */}
      <section className="contact-hero">
        <div className="container">
          <div className="contact-hero-content">
            <h1>{t('contact.title')}</h1>
            <p>{t('contact.subtitle')}</p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="contact-content">
        <div className="container">
          <div className="contact-grid">
            {/* Contact Form */}
            <div className="contact-form-section">
              <h2>{t('contact.sendMessage')}</h2>
              <p>{t('contact.responseTime')}</p>
              
              <Suspense fallback={<div>Loading contact form...</div>}>
                <ContactForm />
              </Suspense>
            </div>

            {/* Contact Information */}
            <div className="contact-info-section">
              <h2>{t('contact.otherWays')}</h2>
              
              <div className="contact-methods">
                <div className="contact-method">
                  <div className="method-icon">📧</div>
                  <div className="method-content">
                    <h3>{t('contact.email')}</h3>
                    <p><a href="mailto:inigomeditation@gmail.com">{t('contact.emailAddress')}</a></p>
                    <p>{t('contact.emailDescription')}</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">🔒</div>
                  <div className="method-content">
                    <h3>{t('contact.privacy')}</h3>
                    <p><a href="mailto:inigomeditation@gmail.com">{t('contact.emailAddress')}</a></p>
                    <p>{t('contact.privacyDescription')}</p>
                  </div>
                </div>

                <div className="contact-method">
                  <div className="method-icon">🌍</div>
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

      {/* CTA Section */}
      <section className="contact-cta">
        <div className="container">
          <div className="cta-content">
            <h2>{t('contact.cta.title')}</h2>
            <p>{t('contact.cta.subtitle')}</p>
            <div className="cta-buttons">
              <Link href={`/${locale}#early-access`} className="btn btn-primary btn-large">
                {t('common.joinEarlyAccess')}
              </Link>
              <Link href={`/${locale}/about`} className="btn btn-ghost">
                {t('common.learnMore')}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
