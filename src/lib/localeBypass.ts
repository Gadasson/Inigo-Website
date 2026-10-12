/** Paths that must not be rewritten onto a locale prefix (`/en/...`). */
export const LOCALE_BYPASS_EXACT_PATHS = ['/app', '/app/'] as const;

export const LOCALE_BYPASS_PREFIXES = [
  '/e/',
  '/s/',
  '/event/',
  '/spot/',
  '/m/',
  '/i/',
  '/moment/',
  '/guided-session/',
  '/guided-sessions/',
  '/studio',
  '/api/share/',
  '/apple-app-site-association',
  '/.well-known/',
  '/static/share/',
  '/recipe/',
  '/challenge/',
] as const;

export function shouldBypassLocale(pathname: string): boolean {
  return (
    (LOCALE_BYPASS_EXACT_PATHS as readonly string[]).includes(pathname) ||
    LOCALE_BYPASS_PREFIXES.some((path) => pathname.startsWith(path))
  );
}
