/**
 * Canonical site origin for share metadata and deep links.
 * Prefer NEXT_PUBLIC_SITE_URL in production (e.g. https://inigo.now).
 */
export function getPublicSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) return `https://${vercel.replace(/^https?:\/\//, '').replace(/\/$/, '')}`;

  return 'https://inigo.now';
}
