import { APP_STORE_URL, PLAY_STORE_URL } from './appLinks';

export type AppDownloadPlatform = 'ios' | 'android' | 'other';

/** Classify User-Agent for the canonical /app QR download entry point. */
export function detectAppDownloadPlatform(
  userAgent: string | null | undefined,
): AppDownloadPlatform {
  if (!userAgent) return 'other';

  const ua = userAgent.toLowerCase();

  if (/iphone|ipad|ipod/.test(ua)) return 'ios';
  if (/android/.test(ua)) return 'android';

  return 'other';
}

/**
 * Resolve the redirect target for /app.
 * Desktop and unknown clients land on the homepage store section (both store buttons).
 */
export function getAppDownloadRedirectUrl(
  platform: AppDownloadPlatform,
  siteOrigin: string,
): string {
  switch (platform) {
    case 'ios':
      return APP_STORE_URL;
    case 'android':
      return PLAY_STORE_URL;
    default: {
      const origin = siteOrigin.replace(/\/$/, '');
      return `${origin}/en#final-store`;
    }
  }
}

export function resolveAppDownloadRedirect(
  userAgent: string | null | undefined,
  siteOrigin: string,
): string {
  return getAppDownloadRedirectUrl(
    detectAppDownloadPlatform(userAgent),
    siteOrigin,
  );
}
