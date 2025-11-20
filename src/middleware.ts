import createMiddleware from 'next-intl/middleware';
import { NextRequest } from 'next/server';
import { locales, defaultLocale } from './i18n/config';

const intlMiddleware = createMiddleware({
  // A list of all locales that are supported
  locales,

  // Used when no locale matches
  defaultLocale,

  // Always use locale prefix in URLs
  localePrefix: 'always',
  
  // Auto-detect locale from Accept-Language header
  localeDetection: true
});

export default function middleware(request: NextRequest) {
  // Note: We use localStorage on the client side for language preference
  // Middleware can't access localStorage, so we rely on:
  // 1. URL path (user's current locale)
  // 2. Accept-Language header (browser preference)
  // 3. Default locale (English)
  // The client-side component will handle localStorage-based redirects
  
  // Use the default next-intl middleware
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames (excluding API routes and static files)
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

