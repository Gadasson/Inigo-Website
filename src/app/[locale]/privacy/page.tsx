'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import FinalCTA from '../../../components/FinalCTA';

export default function Privacy() {
  const t = useTranslations();

  return (
    <main className="subpage-quiet">
      <section className="privacy-hero">
        <div className="container">
          <div className="privacy-hero-content">
            <h1>{t('privacy.title')}</h1>
            <p className="hero-subtitle">{t('privacy.subtitle')}</p>
            <p className="terms-last-updated">
              <strong>{t('privacy.lastUpdated')}</strong> {t('privacy.lastUpdatedDate')}
            </p>
          </div>
        </div>
      </section>

      <section className="privacy-content">
        <div className="container">
          <div className="privacy-sections">
            <div className="privacy-section">
              <h2>{t('privacy.sections.intro.title')}</h2>
              <p>{t('privacy.sections.intro.text')}</p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.dataCollection.title')}</h2>
              <p>{t('privacy.sections.dataCollection.text')}</p>
              <ul>
                {(t.raw('privacy.sections.dataCollection.items') as string[]).map((item, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
              <p>{t('privacy.sections.dataCollection.note')}</p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.dataUsage.title')}</h2>
              <p>{t('privacy.sections.dataUsage.text')}</p>
              <ul>
                {(t.raw('privacy.sections.dataUsage.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>{t('privacy.sections.dataUsage.note')}</p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.thirdParty.title')}</h2>
              <p>{t('privacy.sections.thirdParty.text')}</p>
              <ul>
                {(t.raw('privacy.sections.thirdParty.items') as string[]).map((item, index) => (
                  <li key={index} dangerouslySetInnerHTML={{ __html: item }} />
                ))}
              </ul>
              <p>{t('privacy.sections.thirdParty.note')}</p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.dataProtection.title')}</h2>
              <p>{t('privacy.sections.dataProtection.text')}</p>
              <ul>
                {(t.raw('privacy.sections.dataProtection.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.rights.title')}</h2>
              <p>{t('privacy.sections.rights.text')}</p>
              <ul>
                {(t.raw('privacy.sections.rights.items') as string[]).map((item, index) => (
                  <li key={index}>{item}</li>
                ))}
              </ul>
              <p>
                {t('privacy.sections.rights.contact')}{' '}
                <a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a>.
              </p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.retention.title')}</h2>
              <p>{t('privacy.sections.retention.text')}</p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.children.title')}</h2>
              <p>{t('privacy.sections.children.text')}</p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.changes.title')}</h2>
              <p>{t('privacy.sections.changes.text')}</p>
            </div>

            <div className="privacy-section">
              <h2>{t('privacy.sections.contact.title')}</h2>
              <p>{t('privacy.sections.contact.text')}</p>
              <ul>
                <li>
                  <a href="mailto:inigomeditation@gmail.com">inigomeditation@gmail.com</a>
                </li>
                <li>
                  <Link href="https://inigo.now">https://inigo.now</Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <FinalCTA anchorId="privacy-final-store" titleId="privacy-final-cta-title" />
    </main>
  );
}
