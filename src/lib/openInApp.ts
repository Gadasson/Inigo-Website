import { PLAY_STORE_URL } from './appLinks';
import { detectAppDownloadPlatform } from './appDownloadRedirect';

/** Android applicationId — must match assetlinks.json and Play listing. */
export const ANDROID_APP_PACKAGE = 'now.inigo.app';

/** Custom URL scheme declared by the Inigo Android / iOS apps. */
export const APP_CUSTOM_SCHEME = 'inigo';

/**
 * Build an Android Intent URL that opens a verified https App Link in the
 * installed package, falling back to Play (or another URL) when missing.
 *
 * Same-origin https navigation does not re-trigger App Links once Chrome (or a
 * WhatsApp in-app browser) already loaded the page — Intent URLs do.
 *
 * Example:
 *   intent://inigo.now/guided-session/abc#Intent;scheme=https;package=now.inigo.app;S.browser_fallback_url=...;end
 */
export function buildAndroidAppLinkIntentUrl(
  httpsUrl: string,
  fallbackUrl: string = PLAY_STORE_URL,
): string {
  const url = new URL(httpsUrl);
  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    throw new Error('buildAndroidAppLinkIntentUrl expects an http(s) URL');
  }

  // Omit url.hash — `#` would collide with the `#Intent;` delimiter.
  const pathAndQuery = `${url.host}${url.pathname}${url.search}`;
  const fallback = encodeURIComponent(fallbackUrl);

  return `intent://${pathAndQuery}#Intent;scheme=${url.protocol.replace(':', '')};package=${ANDROID_APP_PACKAGE};S.browser_fallback_url=${fallback};end`;
}

/** Custom-scheme deep link, e.g. inigo://guided-session/{id}. */
export function buildInigoCustomSchemeUrl(pathOrHttpsUrl: string): string {
  if (/^https?:\/\//i.test(pathOrHttpsUrl)) {
    const url = new URL(pathOrHttpsUrl);
    const path = `${url.pathname.replace(/^\//, '')}${url.search}${url.hash}`;
    return `${APP_CUSTOM_SCHEME}://${path}`;
  }

  const cleaned = pathOrHttpsUrl.replace(/^\/+/, '');
  return `${APP_CUSTOM_SCHEME}://${cleaned}`;
}

/**
 * Href for share-landing “Open in Inigo”.
 * Android → Intent URL (opens app from Chrome after an https land).
 * iOS / other → https Universal Link / canonical URL.
 */
export function resolveOpenInAppHref(
  httpsUrl: string,
  userAgent: string | null | undefined,
  androidFallbackUrl: string = PLAY_STORE_URL,
): string {
  if (detectAppDownloadPlatform(userAgent) === 'android') {
    return buildAndroidAppLinkIntentUrl(httpsUrl, androidFallbackUrl);
  }
  return httpsUrl;
}
