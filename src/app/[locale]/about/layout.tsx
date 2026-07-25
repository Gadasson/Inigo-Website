import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';

  const title = isHe ? 'אודות — איניגו' : 'About — Inigo';
  const description = isHe
    ? 'למה איניגו קיימת. אנחנו מאמינים בתרגול של חזרה — לנוכחות, לקלות, וביחד עם אחרים.'
    : 'Why Inigo exists. We believe in a practice of returning—to presence, to ease, and together with others.';

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary',
      title,
      description,
    },
  };
}

export default function AboutLayout({ children }: { children: ReactNode }) {
  return children;
}
