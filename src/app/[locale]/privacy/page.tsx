'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import FinalCTA from '../../../components/FinalCTA';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="privacy-section">
      <h2>{title}</h2>
      {children}
    </div>
  );
}

function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="privacy-subsection">
      <h3>{title}</h3>
      {children}
    </div>
  );
}

function Paragraphs({ items }: { items: string[] }) {
  return (
    <>
      {items.map((paragraph, index) => (
        <p key={index}>{paragraph}</p>
      ))}
    </>
  );
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul>
      {items.map((item, index) => (
        <li key={index}>{item}</li>
      ))}
    </ul>
  );
}

export default function Privacy() {
  const t = useTranslations('privacy');

  return (
    <main className="subpage-quiet">
      <section className="privacy-hero">
        <div className="container">
          <div className="privacy-hero-content">
            <h1>{t('title')}</h1>
            <p className="hero-subtitle">{t('subtitle')}</p>
            <p className="terms-last-updated">
              <strong>{t('versionLabel')}</strong> {t('version')}
            </p>
            <p className="terms-last-updated">
              <strong>{t('effectiveDateLabel')}</strong> {t('effectiveDate')}
            </p>
          </div>
        </div>
      </section>

      <section className="privacy-content">
        <div className="container">
          <div className="privacy-sections">
            <Section title={t('sections.yourPrivacy.title')}>
              <Paragraphs items={t.raw('sections.yourPrivacy.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.whoWeAre.title')}>
              <Paragraphs items={t.raw('sections.whoWeAre.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.whatWeCollect.title')}>
              <p>{t('sections.whatWeCollect.intro')}</p>

              <Subsection
                title={t('sections.whatWeCollect.subsections.accountInformation.title')}
              >
                <p>{t('sections.whatWeCollect.subsections.accountInformation.intro')}</p>
                <BulletList
                  items={
                    t.raw(
                      'sections.whatWeCollect.subsections.accountInformation.items',
                    ) as string[]
                  }
                />
                <Paragraphs
                  items={
                    t.raw(
                      'sections.whatWeCollect.subsections.accountInformation.closingParagraphs',
                    ) as string[]
                  }
                />
              </Subsection>

              <Subsection
                title={t('sections.whatWeCollect.subsections.practiceInformation.title')}
              >
                <p>{t('sections.whatWeCollect.subsections.practiceInformation.intro')}</p>
                <BulletList
                  items={
                    t.raw(
                      'sections.whatWeCollect.subsections.practiceInformation.items',
                    ) as string[]
                  }
                />
              </Subsection>

              <Subsection
                title={t('sections.whatWeCollect.subsections.communityActivity.title')}
              >
                <p>{t('sections.whatWeCollect.subsections.communityActivity.intro')}</p>
                <BulletList
                  items={
                    t.raw(
                      'sections.whatWeCollect.subsections.communityActivity.items',
                    ) as string[]
                  }
                />
              </Subsection>

              <Subsection
                title={t('sections.whatWeCollect.subsections.deviceInformation.title')}
              >
                <p>{t('sections.whatWeCollect.subsections.deviceInformation.intro')}</p>
                <BulletList
                  items={
                    t.raw(
                      'sections.whatWeCollect.subsections.deviceInformation.items',
                    ) as string[]
                  }
                />
                <p>{t('sections.whatWeCollect.subsections.deviceInformation.closing')}</p>
              </Subsection>

              <Subsection
                title={t('sections.whatWeCollect.subsections.informationYouShare.title')}
              >
                <Paragraphs
                  items={
                    t.raw(
                      'sections.whatWeCollect.subsections.informationYouShare.paragraphs',
                    ) as string[]
                  }
                />
                <BulletList
                  items={
                    t.raw(
                      'sections.whatWeCollect.subsections.informationYouShare.items',
                    ) as string[]
                  }
                />
                <p>{t('sections.whatWeCollect.subsections.informationYouShare.closing')}</p>
              </Subsection>
            </Section>

            <Section title={t('sections.howWeUse.title')}>
              <Paragraphs items={t.raw('sections.howWeUse.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.howWeUse.items') as string[]} />
              <p>{t('sections.howWeUse.closing')}</p>
            </Section>

            <Section title={t('sections.legalBasis.title')}>
              <p>{t('sections.legalBasis.intro')}</p>
              <BulletList items={t.raw('sections.legalBasis.items') as string[]} />
            </Section>

            <Section title={t('sections.sharingInformation.title')}>
              <Paragraphs
                items={t.raw('sections.sharingInformation.paragraphs') as string[]}
              />
              <BulletList items={t.raw('sections.sharingInformation.items') as string[]} />
              <p>{t('sections.sharingInformation.closing')}</p>
            </Section>

            <Section title={t('sections.yourContent.title')}>
              <Paragraphs items={t.raw('sections.yourContent.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.internationalTransfers.title')}>
              <Paragraphs
                items={t.raw('sections.internationalTransfers.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.dataRetention.title')}>
              <Paragraphs items={t.raw('sections.dataRetention.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.security.title')}>
              <Paragraphs items={t.raw('sections.security.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.yourRights.title')}>
              <Paragraphs items={t.raw('sections.yourRights.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.yourRights.items') as string[]} />
              <Paragraphs
                items={t.raw('sections.yourRights.closingParagraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.deletingAccount.title')}>
              <Paragraphs items={t.raw('sections.deletingAccount.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.deletingAccount.items') as string[]} />
              <p>{t('sections.deletingAccount.closing')}</p>
            </Section>

            <Section title={t('sections.dataPortability.title')}>
              <Paragraphs
                items={t.raw('sections.dataPortability.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.cookies.title')}>
              <p>{t('sections.cookies.intro')}</p>
              <BulletList items={t.raw('sections.cookies.items') as string[]} />
              <p>{t('sections.cookies.closing')}</p>
            </Section>

            <Section title={t('sections.analytics.title')}>
              <Paragraphs items={t.raw('sections.analytics.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.artificialIntelligence.title')}>
              <Paragraphs
                items={t.raw('sections.artificialIntelligence.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.pushNotifications.title')}>
              <p>{t('sections.pushNotifications.intro')}</p>
              <BulletList items={t.raw('sections.pushNotifications.items') as string[]} />
              <p>{t('sections.pushNotifications.closing')}</p>
            </Section>

            <Section title={t('sections.children.title')}>
              <Paragraphs items={t.raw('sections.children.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.securityIncidents.title')}>
              <Paragraphs
                items={t.raw('sections.securityIncidents.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.internationalUsers.title')}>
              <Paragraphs
                items={t.raw('sections.internationalUsers.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.changes.title')}>
              <Paragraphs items={t.raw('sections.changes.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.contact.title')}>
              <Paragraphs items={t.raw('sections.contact.paragraphs') as string[]} />
              <ul>
                <li>
                  {t('sections.contact.emailLabel')}{' '}
                  <a href={`mailto:${t('sections.contact.email')}`}>
                    {t('sections.contact.email')}
                  </a>
                </li>
              </ul>
              <p>{t('sections.contact.closing')}</p>
            </Section>

            <Section title={t('sections.ourCommitment.title')}>
              <Paragraphs items={t.raw('sections.ourCommitment.paragraphs') as string[]} />
            </Section>
          </div>
        </div>
      </section>

      <FinalCTA anchorId="privacy-final-store" titleId="privacy-final-cta-title" />
    </main>
  );
}
