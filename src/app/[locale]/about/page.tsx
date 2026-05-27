import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import FinalCTA from '../../../components/FinalCTA';

type AboutBlock = { lead?: string; lines: string[] };

function AboutNarrativeSection({
  index,
  block,
}: {
  index: number;
  block: AboutBlock;
}) {
  const alt = index % 2 === 1;

  return (
    <section
      className={`about-quiet-block${alt ? ' about-quiet-block--alt' : ''}`}
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

export default async function About({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations('about');
  const blocks = t.raw('blocks') as AboutBlock[];

  return (
    <main className="about-quiet">
      <section
        className="about-quiet-hero"
        aria-labelledby="about-quiet-hero-title"
      >
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
