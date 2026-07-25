import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';

  const title = isHe ? 'תנאי שימוש — איניגו' : 'Terms of Service — Inigo';
  const description = isHe
    ? 'תנאי השימוש של איניגו — גרסה 1.0. איך השירות עובד ומה אנחנו מבקשים ממשתמשים.'
    : 'Inigo Terms of Service — Version 1.0. How the Service works and what we ask from users.';

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

export default function TermsLayout({ children }: { children: ReactNode }) {
  return children;
}
