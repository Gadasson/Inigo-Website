'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function Terms() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <>
      {/* Hero Section */}
      <section className="terms-hero">
        <div className="container">
          <div className="terms-hero-content">
            <h1>{t('terms.title')}</h1>
            <p className="hero-subtitle">
              {t('terms.subtitle')}
            </p>
            <p className="terms-last-updated">
              <strong>{t('terms.lastUpdated')}</strong> {t('terms.lastUpdatedDate')}
            </p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="terms-content">
        <div className="container">
          <div className="terms-introduction">
            <p>{t('terms.intro')}</p>
          </div>

          <div className="terms-sections">
            <div className="terms-section">
              <h2>{t('terms.sections.aboutInigo.title')}</h2>
              <p>{t('terms.sections.aboutInigo.text1')}</p>
              <p>{t('terms.sections.aboutInigo.text2')}</p>
              <ul>
                {(t.raw('terms.sections.aboutInigo.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>{t('terms.sections.aboutInigo.text3')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.eligibility.title')}</h2>
              <p>{t('terms.sections.eligibility.text')}</p>
              <ul>
                {(t.raw('terms.sections.eligibility.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.accounts.title')}</h2>
              <p>{t('terms.sections.accounts.text1')}</p>
              <ul>
                {(t.raw('terms.sections.accounts.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>{t('terms.sections.accounts.text2')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.userContent.title')}</h2>
              <p>{t('terms.sections.userContent.text1')}</p>
              <p>{t('terms.sections.userContent.text2')}</p>
              <ul>
                {(t.raw('terms.sections.userContent.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>{t('terms.sections.userContent.text3')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.communityGuidelines.title')}</h2>
              <p>{t('terms.sections.communityGuidelines.text1')}</p>
              <ul>
                {(t.raw('terms.sections.communityGuidelines.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>{t('terms.sections.communityGuidelines.text2')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.intellectualProperty.title')}</h2>
              <p>{t('terms.sections.intellectualProperty.text')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.privacy.title')}</h2>
              <p>
                {t('terms.sections.privacy.text').split(t('privacy.title'))[0]}
                <Link href={`/${locale}/privacy`}>{t('privacy.title')}</Link>
                {t('terms.sections.privacy.text').split(t('privacy.title'))[1]}
              </p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.experimental.title')}</h2>
              <p>{t('terms.sections.experimental.text')}</p>
              <ul>
                {(t.raw('terms.sections.experimental.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.assumptionOfRisk.title')}</h2>
              <p>{t('terms.sections.assumptionOfRisk.text')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.disclaimer.title')}</h2>
              <p>{t('terms.sections.disclaimer.text')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.limitation.title')}</h2>
              <p>{t('terms.sections.limitation.text')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.indemnification.title')}</h2>
              <p>{t('terms.sections.indemnification.text')}</p>
              <ul>
                {(t.raw('terms.sections.indemnification.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.prohibitedUses.title')}</h2>
              <p>{t('terms.sections.prohibitedUses.text')}</p>
              <ul>
                {(t.raw('terms.sections.prohibitedUses.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.thirdPartyServices.title')}</h2>
              <p>{t('terms.sections.thirdPartyServices.text')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.forceMajeure.title')}</h2>
              <p>{t('terms.sections.forceMajeure.text')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.termination.title')}</h2>
              <p>{t('terms.sections.termination.text')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.changes.title')}</h2>
              <p>
                {t('terms.sections.changes.text').split('https://inigo.now/terms')[0]}
                <Link href="https://inigo.now/terms">https://inigo.now/terms</Link>
                {t('terms.sections.changes.text').split('https://inigo.now/terms')[1]}
              </p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.disputeResolution.title')}</h2>
              <p>{t('terms.sections.disputeResolution.text1')}</p>
              <p>{t('terms.sections.disputeResolution.text2')}</p>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.contact.title')}</h2>
              <p>{t('terms.sections.contact.text')}</p>
              <ul>
                {(t.raw('terms.sections.contact.items') as string[]).map((item, index) => (
                  <li key={index}>
                    {item.includes('Email:') || item.includes('אימייל:') ? (
                      <>
                        {item.split(':')[0]}: <a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a>
                      </>
                    ) : (
                      <>
                        {item.split(':')[0]}: <Link href="https://inigo.now">https://inigo.now</Link>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            </div>

            <div className="terms-section">
              <h2>{t('terms.sections.governingLaw.title')}</h2>
              <p>{t('terms.sections.governingLaw.text')}</p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
