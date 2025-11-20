import { getRequestConfig } from 'next-intl/server';

export const locales = ['en', 'he'] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ locale }) => {
  // Validate that the incoming `locale` parameter is valid
  // If locale is invalid or missing, use default
  const validLocale = (locale && locales.includes(locale as Locale)) 
    ? locale 
    : defaultLocale;

  return {
    locale: validLocale,
    messages: (await import(`../../messages/${validLocale}.json`)).default
  };
});

