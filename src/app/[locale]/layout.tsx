import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { locales } from '@/i18n/config';
import ScrollToTop from '../../components/ScrollToTop';
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
    ? 'איניגו — נוכחות משותפת'
    : 'Inigo — Your presence matters';
  const description = isHe
    ? 'נוכחות משותפת. תנועה שקטה. שבו, הרגישו, והזיזו משהו יחד.'
    : 'Shared presence. A quiet movement. Sit, feel, and shift the world together.';

  return {
    metadataBase: new URL('https://inigo.now'),
    title,
    description,
    icons: { 
      icon: '/images/heart_logo_light.svg',
      apple: '/images/heart_logo_light.svg'
    },
    openGraph: {
      title,
      description,
      type: 'website',
      url: 'https://inigo.now',
      siteName: 'Inigo',
      images: [
        {
          url: '/images/heart_logo_light.svg',
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
      images: ['/images/heart_logo_light.svg'],
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

  // Validate locale (middleware should handle this, but double-check)
  if (!locale || !locales.includes(locale as (typeof locales)[number])) {
    notFound();
  }

  // Providing all messages to the client
  // Load messages directly using the locale from params
  let messages;
  try {
    // Import messages directly for the locale
    messages = (await import(`../../../messages/${locale}.json`)).default;
  } catch (error) {
    console.error('Error loading messages:', error);
    // Fallback to empty messages if loading fails
    messages = {};
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleHtmlAttributes />
      <WorldStateProvider>
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

