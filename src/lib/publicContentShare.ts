import { cache } from 'react';
import type { Metadata } from 'next';
import { absolutizeSessionCoverUrl } from '@/lib/guidedSessionPreview';
import { getInigoApiBase } from '@/lib/inigoApiBase';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';

/**
 * Public recipe / challenge share pages.
 *
 * Same contract shape as guided-session preview, without studio auth:
 *   GET {INIGO_API_BASE}/api/share/preview/recipe/{id}/
 *   GET {INIGO_API_BASE}/api/share/preview/challenge/{id}/
 *   Header: Accept: application/json
 *   No Authorization header and no service-account credentials.
 *
 * The website does not fall back to `/api/studio/...`. A payload that looks like
 * a studio document (draft / unpublished version) is treated as unavailable and
 * its title is discarded.
 *
 * Availability is not stored in the Next.js data cache (`cache: 'no-store'`).
 * Link-preview images for these routes also use `Cache-Control: no-store`.
 *
 * Success JSON: title, description, image_url, cover_image_url, canonical_url.
 *   403 {"error":"feature_disabled"} — gate off
 *   404 {"error":"not_found"} — missing or not approved (drafts stay hidden)
 *   404 {"error":"archived"} — archived
 * Language follows Accept-Language on that request (en / he). No cookies.
 *
 * The local API serves this contract. Production api2.inigo.now still answers
 * these paths with an HTML 404. That response, any other non-JSON body, an HTTP
 * failure, and a timeout all finish as “content is not available right now”.
 * They do not keep the page loading, and they do not publish the missing
 * content’s title or cover. The Open Graph image is /static/share/default.jpg.
 */

export const PUBLIC_CONTENT_KINDS = ['recipe', 'challenge'] as const;
export type PublicContentKind = (typeof PUBLIC_CONTENT_KINDS)[number];

/** Studio ids are positive integers. Slugs and draft tokens are not public ids. */
const PUBLIC_CONTENT_ID_PATTERN = /^[1-9][0-9]{0,17}$/;

const PUBLIC_STATUSES = new Set(['approved', 'published', 'available', 'live', 'public']);

const PRIVATE_CODES = new Set([
  'not_found',
  'notfound',
  'unavailable',
  'archived',
  'disabled',
  'flag_off',
  'feature_disabled',
  'not_public',
  'draft',
]);

const FALLBACK_OG_PATH = '/static/share/default.jpg';

/** Do not keep a cover or an “unavailable” image in a shared cache. */
export const PUBLIC_CONTENT_OG_CACHE = 'no-store';

/**
 * Same install note as the guided-session share page.
 * It tells people to come back to the link. It does not promise the destination
 * is stored through an install.
 */
export const PUBLIC_SHARE_INSTALL_NOTE =
  'On your phone, this opens the Inigo app when it is installed. If you do not have it yet, get Inigo from the App Store or Google Play, then return to this link.';

export const GENERIC_SHARE_TITLE = 'Inigo';
export const GENERIC_SHARE_DESCRIPTION =
  'This link is not available right now. You can still open Inigo, or get the app from the App Store or Google Play.';

/** Terminal copy when the preview request itself fails. Not a loading state. */
export const CONTENT_UNAVAILABLE_NOW_TITLE = 'This content is not available right now';

/** Bound the public preview fetch so a missing route or a hung API still renders. */
export const PUBLIC_CONTENT_PREVIEW_TIMEOUT_MS = 8000;

export function isPublicContentKind(value: string): value is PublicContentKind {
  return (PUBLIC_CONTENT_KINDS as readonly string[]).includes(value);
}

export function isValidPublicContentId(id: string): boolean {
  return PUBLIC_CONTENT_ID_PATTERN.test(id);
}

export type PublicContentPreviewOk = {
  kind: 'ok';
  title: string;
  shortDescription?: string;
  displayLanguage?: 'he' | 'en';
  coverImageUrl?: string;
  coverImageUrlResolved?: string;
};

export type PublicContentPreviewUnavailable = { kind: 'unavailable' };
export type PublicContentPreviewError = { kind: 'error' };

export type PublicContentPreviewResult =
  | PublicContentPreviewOk
  | PublicContentPreviewUnavailable
  | PublicContentPreviewError;

/** Keep a normal language list. Drop newlines and anything that is not a header value. */
export function sanitizeAcceptLanguage(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  const cleaned = value.replace(/[\r\n]/g, ' ').trim().slice(0, 160);
  if (!cleaned || !/^[A-Za-z0-9*.;,=_ -]{1,160}$/.test(cleaned)) return undefined;
  return cleaned;
}

/** Fetch init for the public preview. No auth material, and no data-cache storage. */
export function publicContentPreviewRequestInit(acceptLanguage?: string | null): RequestInit {
  const headers: Record<string, string> = { Accept: 'application/json' };
  const language = sanitizeAcceptLanguage(acceptLanguage);
  if (language) headers['Accept-Language'] = language;
  return {
    method: 'GET',
    headers,
    credentials: 'omit',
    cache: 'no-store',
  };
}

export function publicContentPreviewEndpoint(kind: PublicContentKind, id: string): string {
  return `${getInigoApiBase()}/api/share/preview/${kind}/${encodeURIComponent(id)}/`;
}

/**
 * https URL the installed app already opens for this content.
 * Invalid ids do not invent a client destination.
 */
export function resolvePublicContentOpenUrl(site: string, kind: PublicContentKind, id: string): string {
  const base = site.replace(/\/$/, '');
  if (!isValidPublicContentId(id)) return `${base}/en`;
  return `${base}/${kind}/${id}`;
}

export function resolvePublicContentCanonicalUrl(site: string, kind: PublicContentKind, id: string): string {
  return resolvePublicContentOpenUrl(site, kind, id);
}

export function publicContentOgProxyUrl(site: string, kind: PublicContentKind, id: string): string {
  const base = site.replace(/\/$/, '');
  return `${base}/api/og/${kind}/${encodeURIComponent(id)}`;
}

function absoluteUrl(site: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    try {
      return new URL(pathOrUrl).toString();
    } catch {
      /* fall through */
    }
  }
  const base = site.endsWith('/') ? site : `${site}/`;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(path, base).toString();
}

/** Crawlers and meta attributes handle single-line text more reliably than raw newlines. */
export function toMetaDescriptionLine(text: string, maxLen: number): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLen);
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const key of keys) {
    const value = obj[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return undefined;
}

function isStudioDocument(record: Record<string, unknown>): boolean {
  if ('draft' in record || 'published_version_id' in record) return true;
  if ('title_he' in record && 'title_en' in record && ('ingredients' in record || 'steps' in record)) {
    return true;
  }
  return false;
}

function unwrapPreview(kind: PublicContentKind, record: Record<string, unknown>): Record<string, unknown> {
  if (isStudioDocument(record)) return record;
  const wrapped = record[kind] ?? record.preview;
  if (wrapped && typeof wrapped === 'object' && !Array.isArray(wrapped)) {
    return wrapped as Record<string, unknown>;
  }
  return record;
}

function flagDisabled(record: Record<string, unknown>): boolean {
  for (const key of [
    'available',
    'is_available',
    'isAvailable',
    'is_public',
    'isPublic',
    'enabled',
    'feature_enabled',
    'featureEnabled',
    'sharing_enabled',
    'sharingEnabled',
    'is_shareable',
    'isShareable',
  ]) {
    if (record[key] === false) return true;
  }
  if (record.archived === true || record.is_archived === true || record.isArchived === true) return true;
  if (typeof record.archived_at === 'string' && record.archived_at.trim()) return true;
  if (typeof record.archivedAt === 'string' && record.archivedAt.trim()) return true;
  return false;
}

function statusBlocksShare(record: Record<string, unknown>): boolean {
  const status = pickString(record, [
    'status',
    'availability',
    'visibility',
    'publication_status',
    'publicationStatus',
  ])?.toLowerCase();
  if (!status) return false;
  return !PUBLIC_STATUSES.has(status);
}

function errorCodeBlocksShare(record: Record<string, unknown>): boolean {
  if (record.found === false || record.exists === false) return true;
  const code = pickString(record, ['code', 'error_code', 'errorCode', 'error', 'reason_code', 'reasonCode'])?.toLowerCase();
  if (code && PRIVATE_CODES.has(code)) return true;
  const detail = pickString(record, ['detail', 'message']);
  if (detail && /not\s*found|unavailable|archived|disabled|not\s*public/i.test(detail) && !pickString(record, ['title', 'name'])) {
    return true;
  }
  if (detail && /not\s*found|archived|unavailable/i.test(detail) && (record.found === false || record.available === false)) {
    return true;
  }
  return false;
}

function blocksShare(record: Record<string, unknown>): boolean {
  return isStudioDocument(record) || flagDisabled(record) || statusBlocksShare(record) || errorCodeBlocksShare(record);
}

export function classifyPublicContentResponse(
  kind: PublicContentKind,
  status: number,
  contentType: string | null,
  body: unknown,
): PublicContentPreviewResult {
  if (status === 404 || status === 403 || status === 410) {
    const json = (contentType ?? '').includes('application/json');
    if (status === 404 && !json) return { kind: 'error' };
    return { kind: 'unavailable' };
  }

  if (status !== 200) return { kind: 'error' };
  if (!(contentType ?? '').includes('application/json')) return { kind: 'error' };
  if (!body || typeof body !== 'object' || Array.isArray(body)) return { kind: 'error' };

  const record = unwrapPreview(kind, body as Record<string, unknown>);
  if (blocksShare(record) || isStudioDocument(body as Record<string, unknown>)) {
    return { kind: 'unavailable' };
  }

  const title = pickString(record, ['title', 'name']);
  if (!title) return { kind: 'error' };

  const shortDescription =
    pickString(record, ['short_description', 'shortDescription', 'summary', 'subtitle']) ??
    pickString(record, ['description']);
  const coverImageUrl = pickString(record, [
    'image_url',
    'imageUrl',
    'cover_image_url',
    'coverImageUrl',
    'cover',
    'thumbnail_url',
    'thumbnailUrl',
  ]);
  const displayLanguage = pickString(record, ['display_language', 'displayLanguage'])?.toLowerCase();

  return {
    kind: 'ok',
    title,
    shortDescription,
    displayLanguage: displayLanguage === 'he' || displayLanguage === 'iw' ? 'he' : displayLanguage === 'en' ? 'en' : undefined,
    coverImageUrl,
  };
}

async function fetchPublicContentPreviewUncached(
  kind: PublicContentKind,
  id: string,
  acceptLanguage?: string | null,
): Promise<PublicContentPreviewResult> {
  if (!isValidPublicContentId(id)) return { kind: 'unavailable' };

  try {
    const res = await fetch(publicContentPreviewEndpoint(kind, id), {
      ...publicContentPreviewRequestInit(acceptLanguage),
      signal: AbortSignal.timeout(PUBLIC_CONTENT_PREVIEW_TIMEOUT_MS),
    });
    const contentType = res.headers.get('content-type');
    let body: unknown = null;
    if ((contentType ?? '').includes('application/json')) {
      try {
        body = await res.json();
      } catch {
        body = null;
      }
    }
    const classified = classifyPublicContentResponse(kind, res.status, contentType, body);
    if (classified.kind !== 'ok' || !classified.coverImageUrl) return classified;
    const site = getPublicSiteUrl();
    return {
      ...classified,
      coverImageUrlResolved: absolutizeSessionCoverUrl(site, classified.coverImageUrl),
    };
  } catch {
    return { kind: 'error' };
  }
}

/** Per-request dedupe when generateMetadata and the page both need the payload. */
export const loadPublicContentPreview = cache(fetchPublicContentPreviewUncached);

export async function fetchPublicContentPreview(
  kind: PublicContentKind,
  id: string,
  acceptLanguage?: string | null,
): Promise<PublicContentPreviewResult> {
  return fetchPublicContentPreviewUncached(kind, id, acceptLanguage);
}

export function publicContentOgImage(site: string, kind: PublicContentKind, id: string, preview: PublicContentPreviewResult): string {
  if (preview.kind === 'ok' && (preview.coverImageUrlResolved || preview.coverImageUrl) && isValidPublicContentId(id)) {
    return publicContentOgProxyUrl(site, kind, id);
  }
  return absoluteUrl(site, FALLBACK_OG_PATH);
}

export function coverSrcFromPreview(site: string, preview: PublicContentPreviewResult): string | undefined {
  if (preview.kind !== 'ok') return undefined;
  return preview.coverImageUrlResolved ?? absolutizeSessionCoverUrl(site, preview.coverImageUrl);
}

function metaDescription(kind: PublicContentKind, preview: PublicContentPreviewResult): string {
  if (preview.kind !== 'ok') return GENERIC_SHARE_DESCRIPTION;
  if (preview.shortDescription?.trim()) return toMetaDescriptionLine(preview.shortDescription, 200);
  return kind === 'recipe' ? 'Open this recipe in Inigo.' : 'Open this challenge in Inigo.';
}

export function buildPublicContentMetadata(
  site: string,
  kind: PublicContentKind,
  id: string,
  preview: PublicContentPreviewResult,
): Metadata {
  const shareable = preview.kind === 'ok';
  const title = shareable ? `${preview.title} — Inigo` : GENERIC_SHARE_TITLE;
  const description = metaDescription(kind, preview);
  const canonical = resolvePublicContentCanonicalUrl(site, kind, id);
  const ogImage = publicContentOgImage(site, kind, id, preview);

  return {
    metadataBase: new URL(site),
    title,
    description,
    alternates: { canonical },
    robots: { index: shareable, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Inigo',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export async function publicContentMetadata(
  kind: PublicContentKind,
  id: string,
  acceptLanguage?: string | null,
): Promise<Metadata> {
  const site = getPublicSiteUrl();
  const preview = isValidPublicContentId(id)
    ? await loadPublicContentPreview(kind, id, acceptLanguage)
    : { kind: 'unavailable' as const };
  return buildPublicContentMetadata(site, kind, id, preview);
}

export function publicContentShareCopy(
  kind: PublicContentKind,
  preview: PublicContentPreviewResult,
): { title: string; description: string } {
  if (preview.kind === 'ok') {
    return { title: preview.title, description: preview.shortDescription ?? '' };
  }
  if (preview.kind === 'error') {
    return {
      title: CONTENT_UNAVAILABLE_NOW_TITLE,
      description: 'You can open Inigo if it is installed, or get the app from the App Store or Google Play.',
    };
  }
  const label = kind === 'recipe' ? 'recipe' : 'challenge';
  return {
    title: `This ${label} is not available`,
    description: 'It may be missing, archived, or not open to share right now.',
  };
}
