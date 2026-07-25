import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';

  const title = isHe ? 'מדיניות פרטיות — איניגו' : 'Privacy Policy — Inigo';
  const description = isHe
    ? 'מדיניות הפרטיות של איניגו — גרסה 1.0. איזה מידע אנחנו אוספים ואיך אנחנו מגנים עליו.'
    : 'Inigo Privacy Policy — Version 1.0. What information we collect and how we protect it.';

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

export default function PrivacyLayout({ children }: { children: ReactNode }) {
  return children;
}
