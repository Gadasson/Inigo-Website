import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import ScrollToTop from '../../components/ScrollToTop';
import ScrollOnNavigate from '../../components/ScrollOnNavigate';
import { WorldStateProvider } from '../../contexts/WorldStateContext';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import LocaleHtmlAttributes from '../../components/LocaleHtmlAttributes';
import Footer from '../../components/Footer';
import BrandLogoLink from '../../components/BrandLogoLink';
import HomeShortcutButton from '../../components/HomeShortcutButton';

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isHe = locale === 'he';

  const title = isHe
    ? 'איניגו — לתרגל את החיים'
    : 'Inigo — Practice Being Alive';
  const description = isHe
    ? 'לחזור בקלות. לבנות תרגול שנשאר איתכם—דרך מדיטציה, הליכה, נשימה ורגעים משותפים.'
    : 'Return with ease. Build a practice that stays with you—through meditation, walking, breathing, and shared moments.';

  return {
    metadataBase: new URL('https://inigo.now'),
    title,
    description,
    icons: {
      icon: { url: '/images/heart_logo_last.svg', type: 'image/svg+xml' },
      apple: '/apple-touch-icon.png',
      shortcut: '/favicon.ico',
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://inigo.now',
      siteName: 'Inigo',
      images: [
        {
          url: '/images/heart_logo_last.svg',
          width: 512,
          height: 512,
          alt: 'Inigo - Heart Logo'
        }
      ],
      locale: isHe ? 'he_IL' : 'en_US'
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: ['/images/heart_logo_last.svg'],
      creator: '@inigo',
      site: '@inigo'
    },
    /* Must match src/app/design-tokens.css --inigo-black-soft (metadata cannot use CSS variables). */
    other: {
      'msapplication-TileColor': '#0F0F0F',
      'theme-color': '#0F0F0F',
    },
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  setRequestLocale(locale);

  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone="Asia/Jerusalem">
      <LocaleHtmlAttributes />
      <WorldStateProvider>
        <ScrollOnNavigate />
        <BrandLogoLink />
        <LanguageSwitcher />
        <HomeShortcutButton />
        {children}
        <Footer />
        <ScrollToTop />
      </WorldStateProvider>
    </NextIntlClientProvider>
  );
}
