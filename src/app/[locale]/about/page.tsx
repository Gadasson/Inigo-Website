'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';

export default function About() {
  const t = useTranslations();
  const locale = useLocale();

  const openingLines = t('about.opening').split('\n').filter(line => line.trim());
  const bodyContent = t.raw('about.body') as Array<{ type: 'paragraph' | 'title'; text: string }>;

  // Group content into sections for visual variety - each title starts a new section
  const sections: Array<{ blocks: typeof bodyContent; bgClass: string; hasTitle: boolean }> = [];
  let currentSection: typeof bodyContent = [];
  let sectionIndex = 0;
  let hasTitleInCurrent = false;

  bodyContent.forEach((block, i) => {
    if (block.type === 'title') {
      // If we have content, save it first
      if (currentSection.length > 0) {
        sections.push({ 
          blocks: currentSection, 
          bgClass: sectionIndex % 2 === 0 ? 'about-section-light' : 'about-section-white',
          hasTitle: hasTitleInCurrent
        });
        sectionIndex++;
      }
      // Start new section with title
      currentSection = [block];
      hasTitleInCurrent = true;
    } else {
      currentSection.push(block);
    }
  });
  // Add the last section
  if (currentSection.length > 0) {
    sections.push({ 
      blocks: currentSection, 
      bgClass: sectionIndex % 2 === 0 ? 'about-section-light' : 'about-section-white',
      hasTitle: hasTitleInCurrent
    });
  }

  return (
    <div className="about-page">
      {/* Opening Section */}
      <section className="about-opening">
        <div className="about-opening-content">
          {openingLines.map((line, i) => (
            <p key={i} className="about-opening-line">
              {line}
            </p>
          ))}
        </div>
      </section>

      {/* Body Content - Split into visual sections */}
      {sections.map((section, sectionIdx) => {
        // Find the title in this section
        const titleBlock = section.blocks.find(b => b.type === 'title');
        const paragraphs = section.blocks.filter(b => b.type === 'paragraph');
        
        return (
          <section key={sectionIdx} className={`about-body-section ${section.bgClass}`}>
            <div className="about-container">
              <div className="about-body-content">
                {titleBlock && (
                  <h3 className="about-section-title">
                    {titleBlock.text}
                  </h3>
                )}
                {paragraphs.map((block, i) => (
                  <p key={i} className="about-paragraph">
                    {block.text.split('\n').map((line, j) => (
                      <span key={j}>
                        {line}
                        {j < block.text.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </p>
                ))}
              </div>
            </div>
          </section>
        );
      })}

      {/* CTA Section */}
      <section className="about-cta">
        <div className="about-container">
          <div className="about-cta-content">
            <Link href={`/${locale}#early-access`} className="btn btn-primary btn-large">
              {t('about.cta')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
