'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import FinalCTA from '../../../components/FinalCTA';

type DefinitionItem = { term: string; text: string };

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="terms-section">
      <h2>{title}</h2>
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

export default function Terms() {
  const t = useTranslations('terms');
  const tPrivacy = useTranslations('privacy');
  const locale = useLocale();

  const definitions = t.raw('sections.definitions.items') as DefinitionItem[];

  return (
    <main className="subpage-quiet">
      <section className="terms-hero">
        <div className="container">
          <div className="terms-hero-content">
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

      <section className="terms-content">
        <div className="container">
          <div className="terms-sections">
            <Section title={t('sections.welcome.title')}>
              <Paragraphs items={t.raw('sections.welcome.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.whoWeAre.title')}>
              <Paragraphs items={t.raw('sections.whoWeAre.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.definitions.title')}>
              <p>{t('sections.definitions.intro')}</p>
              <ul>
                {definitions.map((item) => (
                  <li key={item.term}>
                    <strong>{item.term}</strong> {item.text}
                  </li>
                ))}
              </ul>
            </Section>

            <Section title={t('sections.whoCanUse.title')}>
              <p>{t('sections.whoCanUse.intro')}</p>
              <BulletList items={t.raw('sections.whoCanUse.items') as string[]} />
              <p>{t('sections.whoCanUse.closing')}</p>
            </Section>

            <Section title={t('sections.yourAccount.title')}>
              <Paragraphs items={t.raw('sections.yourAccount.paragraphs') as string[]} />
              <p>{t('sections.yourAccount.intro')}</p>
              <BulletList items={t.raw('sections.yourAccount.items') as string[]} />
              <Paragraphs
                items={t.raw('sections.yourAccount.closingParagraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.aboutInigo.title')}>
              <Paragraphs items={t.raw('sections.aboutInigo.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.aboutInigo.items') as string[]} />
              <Paragraphs
                items={t.raw('sections.aboutInigo.closingParagraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.personalWellbeing.title')}>
              <Paragraphs
                items={t.raw('sections.personalWellbeing.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.community.title')}>
              <Paragraphs items={t.raw('sections.community.paragraphs') as string[]} />
              <p>{t('sections.community.intro')}</p>
              <BulletList items={t.raw('sections.community.items') as string[]} />
              <Paragraphs
                items={t.raw('sections.community.closingParagraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.yourContent.title')}>
              <Paragraphs items={t.raw('sections.yourContent.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.yourContent.items') as string[]} />
              <Paragraphs
                items={t.raw('sections.yourContent.closingParagraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.privacy.title')}>
              <Paragraphs items={t.raw('sections.privacy.paragraphs') as string[]} />
              <p>
                {t('sections.privacy.agreeBefore')}
                <Link href={`/${locale}/privacy`}>{tPrivacy('title')}</Link>
                {t('sections.privacy.agreeAfter')}
              </p>
            </Section>

            <Section title={t('sections.creatorStudio.title')}>
              <Paragraphs items={t.raw('sections.creatorStudio.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.creatorStudio.items') as string[]} />
              <Paragraphs
                items={t.raw('sections.creatorStudio.closingParagraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.userGeneratedContent.title')}>
              <Paragraphs
                items={t.raw('sections.userGeneratedContent.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.copyright.title')}>
              <Paragraphs items={t.raw('sections.copyright.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.acceptableUse.title')}>
              <p>{t('sections.acceptableUse.intro')}</p>
              <BulletList items={t.raw('sections.acceptableUse.items') as string[]} />
              <p>{t('sections.acceptableUse.closing')}</p>
            </Section>

            <Section title={t('sections.artificialIntelligence.title')}>
              <Paragraphs
                items={t.raw('sections.artificialIntelligence.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.paidFeatures.title')}>
              <Paragraphs items={t.raw('sections.paidFeatures.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.paidFeatures.items') as string[]} />
              <p>{t('sections.paidFeatures.closing')}</p>
            </Section>

            <Section title={t('sections.feedback.title')}>
              <Paragraphs items={t.raw('sections.feedback.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.availability.title')}>
              <Paragraphs items={t.raw('sections.availability.paragraphs') as string[]} />
              <BulletList items={t.raw('sections.availability.items') as string[]} />
              <p>{t('sections.availability.closing')}</p>
            </Section>

            <Section title={t('sections.softwareUpdates.title')}>
              <Paragraphs
                items={t.raw('sections.softwareUpdates.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.electronicCommunications.title')}>
              <Paragraphs
                items={t.raw('sections.electronicCommunications.paragraphs') as string[]}
              />
              <BulletList
                items={t.raw('sections.electronicCommunications.items') as string[]}
              />
              <p>{t('sections.electronicCommunications.closing')}</p>
            </Section>

            <Section title={t('sections.thirdPartyServices.title')}>
              <Paragraphs
                items={t.raw('sections.thirdPartyServices.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.suspensionAndTermination.title')}>
              <Paragraphs
                items={t.raw('sections.suspensionAndTermination.paragraphs') as string[]}
              />
              <BulletList
                items={t.raw('sections.suspensionAndTermination.items') as string[]}
              />
              <Paragraphs
                items={
                  t.raw('sections.suspensionAndTermination.closingParagraphs') as string[]
                }
              />
            </Section>

            <Section title={t('sections.limitationOfLiability.title')}>
              <Paragraphs
                items={t.raw('sections.limitationOfLiability.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.yourResponsibility.title')}>
              <Paragraphs
                items={t.raw('sections.yourResponsibility.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.indemnification.title')}>
              <p>{t('sections.indemnification.intro')}</p>
              <BulletList items={t.raw('sections.indemnification.items') as string[]} />
            </Section>

            <Section title={t('sections.changesToService.title')}>
              <Paragraphs
                items={t.raw('sections.changesToService.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.changesToTerms.title')}>
              <Paragraphs
                items={t.raw('sections.changesToTerms.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.governingLaw.title')}>
              <Paragraphs items={t.raw('sections.governingLaw.paragraphs') as string[]} />
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

            <Section title={t('sections.entireAgreement.title')}>
              <Paragraphs
                items={t.raw('sections.entireAgreement.paragraphs') as string[]}
              />
            </Section>

            <Section title={t('sections.severability.title')}>
              <Paragraphs items={t.raw('sections.severability.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.noWaiver.title')}>
              <Paragraphs items={t.raw('sections.noWaiver.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.assignment.title')}>
              <Paragraphs items={t.raw('sections.assignment.paragraphs') as string[]} />
            </Section>

            <Section title={t('sections.thankYou.title')}>
              <Paragraphs items={t.raw('sections.thankYou.paragraphs') as string[]} />
            </Section>
          </div>
        </div>
      </section>

      <FinalCTA anchorId="terms-final-store" titleId="terms-final-cta-title" />
    </main>
  );
}
