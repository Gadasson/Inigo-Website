import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { locales, defaultLocale } from './i18n/config';
import { shouldBypassLocale } from './lib/localeBypass';

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
  const { pathname } = request.nextUrl;

  // Share paths and association files stay off the locale prefix.
  if (shouldBypassLocale(pathname)) {
    // Bypass locale middleware - let Vercel rewrites or static file serving handle it
    return NextResponse.next();
  }

  // Note: We use localStorage on the client side for language preference
  // Middleware can't access localStorage, so we rely on:
  // 1. URL path (user's current locale)
  // 2. Accept-Language header (browser preference)
  // 3. Default locale (English)
  // The client-side component will handle localStorage-based redirects
  
  // Use the default next-intl middleware for all other paths
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames (excluding API routes and static files)
  // Note: Share paths are excluded in the middleware function above
  matcher: ['/((?!api|_next|_vercel|.*\\..*).*)']
};

