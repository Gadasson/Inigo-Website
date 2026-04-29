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
    ? 'סוג אחר של מקום. נוכחות משותפת — המשך מהעמוד הראשי של איניגו.'
    : 'A different kind of space. Shared presence — a continuation of the Inigo homepage.';

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
