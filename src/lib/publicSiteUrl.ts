/**
 * Canonical site origin for share metadata, universal links, and absolute URLs.
 *
 * Priority: SITE_URL (server-only) → NEXT_PUBLIC_SITE_URL → https://inigo.now
 *
 * We intentionally do not fall back to VERCEL_URL: when NEXT_PUBLIC_SITE_URL is
 * missing on Vercel, VERCEL_URL is a deployment hostname and breaks OG URLs,
 * canonical links, and “Open in Inigo” vs the public inigo.now domain.
 */
export function getPublicSiteUrl(): string {
  const siteUrl = process.env.SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, '');

  const nextPublic = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (nextPublic) return nextPublic.replace(/\/$/, '');

  return 'https://inigo.now';
}
