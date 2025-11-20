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
  
  return {
    title: 'Inigo — From inner to beyond',
    description: 'From fake to real. From numb to now. From inner to beyond.',
    icons: { 
      icon: '/images/heart_logo.svg',
      apple: '/images/heart_logo.svg'
    },
    openGraph: {
      title: 'Inigo — From inner to beyond',
      description: 'Quiet is the new revolution. Join the frequency.',
      type: 'website',
      url: 'https://inigo.now',
      siteName: 'Inigo',
      images: [
        {
          url: '/images/heart_logo.svg',
          width: 512,
          height: 512,
          alt: 'Inigo - Heart Logo'
        }
      ],
      locale: locale === 'he' ? 'he_IL' : 'en_US'
    },
    twitter: {
      card: 'summary_large_image',
      title: 'Inigo — From inner to beyond',
      description: 'Quiet is the new revolution. Join the frequency.',
      images: ['/images/heart_logo.svg'],
      creator: '@inigo',
      site: '@inigo'
    },
    other: {
      'msapplication-TileColor': '#4F7942',
      'theme-color': '#4F7942'
    }
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
  if (!locale || !locales.includes(locale as any)) {
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

