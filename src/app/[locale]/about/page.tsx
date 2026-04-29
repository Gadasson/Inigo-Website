'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useScrollAnimation } from '../../../hooks/useScrollAnimation';
import FinalCTA from '../../../components/FinalCTA';

type AboutBlock = { lead?: string; lines: string[] };

function AboutNarrativeSection({
  index,
  block,
}: {
  index: number;
  block: AboutBlock;
}) {
  const ref = useScrollAnimation();
  const alt = index % 2 === 1;

  return (
    <section
      ref={ref}
      className={`about-quiet-block section-fade-in${alt ? ' about-quiet-block--alt' : ''}`}
    >
      <div className="container container--narrow about-quiet-inner">
        {block.lead ? <p className="about-quiet-lead">{block.lead}</p> : null}
        {block.lines.map((line, i) =>
          line === '' ? (
            <div key={i} className="about-quiet-stanza-gap" aria-hidden />
          ) : (
            <p
              key={i}
              className={`about-quiet-line${line.length <= 14 ? ' about-quiet-line--staccato' : ''}`}
            >
              {line}
            </p>
          )
        )}
      </div>
    </section>
  );
}

export default function About() {
  const t = useTranslations('about');
  const locale = useLocale();
  const heroRef = useScrollAnimation();
  const blocks = t.raw('blocks') as AboutBlock[];

  return (
    <main className="about-quiet">
      <section ref={heroRef} className="about-quiet-hero section-fade-in" aria-labelledby="about-quiet-hero-title">
        <div className="about-quiet-hero-glow" aria-hidden />
        <div className="container container--narrow about-quiet-hero-inner">
          <h1 id="about-quiet-hero-title" className="about-quiet-hero-title">
            {t('hero.title')}
          </h1>
          <div className="about-quiet-hero-cta">
            <Link href={`/${locale}`} className="btn-quiet-secondary">
              {t('hero.backCta')}
            </Link>
          </div>
        </div>
      </section>

      {blocks.map((block, index) => (
        <AboutNarrativeSection key={index} index={index} block={block} />
      ))}

      <FinalCTA anchorId="about-final-store" titleId="about-final-cta-title" />
    </main>
  );
}
