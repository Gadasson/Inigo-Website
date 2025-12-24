'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function About() {
  const t = useTranslations('about');
  const locale = useLocale();

  const heroLines = t.raw('hero.lines') as string[];
  const sections = [
    { key: 'whyBorn', bgClass: 'about-bg-soft-green' },
    { key: 'notChasing', bgClass: 'about-bg-white' },
    { key: 'meditationLife', bgClass: 'about-bg-soft-teal' },
    { key: 'whySocial', bgClass: 'about-bg-white' },
    { key: 'places', bgClass: 'about-bg-soft-amber' },
    { key: 'language', bgClass: 'about-bg-white' },
    { key: 'whereNow', bgClass: 'about-bg-soft-green' },
    { key: 'closing', bgClass: 'about-bg-white' }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">{t('hero.title')}</h1>
            <div className="about-hero-lines">
              {heroLines.map((line, i) => (
                <p key={i} className="about-hero-line">
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
            <div className="about-hero-ctas">
              <Link href={`/${locale}#early-access`} className="btn btn-primary">
                {t('cta')}
              </Link>
              <Link href={`/${locale}`} className="btn btn-ghost">
                {t('hero.secondaryCta')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Sections */}
      {sections.map((section, idx) => {
        const sectionData = t.raw(`sections.${section.key}`) as {
          title: string;
          body: string[];
          aiSharing?: { title: string; body: string[] };
        };

        return (
          <section key={section.key} className={`about-section ${section.bgClass}`}>
            <div className="about-container">
              <div className="about-section-content">
                <h2 className="about-section-title">{sectionData.title}</h2>
                <div className="about-section-body">
                  {sectionData.body.map((line, i) => (
                    <p key={i} className="about-section-line">
                      {line || '\u00A0'}
                    </p>
                  ))}
                </div>
                
                {/* AI Sharing sub-section for language section */}
                {sectionData.aiSharing && (
                  <div className="about-ai-sharing">
                    {sectionData.aiSharing.body.map((line, i) => (
                      <p key={i} className="about-section-line">
                        {line || '\u00A0'}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>
        );
      })}

      {/* Closing CTA */}
      <section className="about-closing-cta">
        <div className="about-container">
          <div className="about-closing-content">
            <h2 className="about-closing-title">{t('sections.closing.title')}</h2>
            <div className="about-closing-body">
              {(t.raw('sections.closing.body') as string[]).map((line, i) => (
                <p key={i} className="about-closing-line">
                  {line || '\u00A0'}
                </p>
              ))}
            </div>
            <Link href={`/${locale}#early-access`} className="btn btn-primary btn-large">
              {t('cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
