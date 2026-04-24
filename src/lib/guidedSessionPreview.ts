import { cache } from 'react';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';

/**
 * Guided session share preview — backend contract
 * ================================================
 * The website loads preview JSON (this route is not HTML-proxied like /e/, /s/, …).
 *
 *   HTML share (app / crawlers that want HTML): GET {INIGO_API_BASE}/api/share/guided-session/{identifier}/
 *   JSON preview (this module): GET {INIGO_API_BASE}/api/share/preview/guided-session/{identifier}/
 *   `{identifier}` may be a numeric id or a slug (e.g. morning-meditation-1).
 *   Header: Accept: application/json
 *   Response: application/json
 *
 * Suggested success shape (snake_case or camelCase both tolerated):
 *   {
 *     "title": string,                    // required for a rich preview
 *     "short_description"?: string,
 *     "description"?: string,             // fallback if short_description missing
 *     "cover_image_url"?: string,       // absolute https preferred
 *     "duration_seconds"?: number,      // or "duration_display"?: string
 *     "instructor"?: string,            // or "instructor_name"
 *     "language"?: string,
 *     "playable"?: boolean,              // default true; false = inactive / not openable
 *     "unplayable_reason"?: string       // optional gentle message when playable is false
 *     "canonical_url"?: string           // optional; full URL or site path for SEO + Open Graph url
 *   }
 *
 * HTTP:
 *   200 + valid JSON with title → parsed (playable may be false)
 *   404 → session not found
 *   403 / 410 → inactive or removed (treated as unavailable)
 *   5xx / network → error
 *
 * Environment:
 *   INIGO_API_BASE — optional, default https://api2.inigo.now
 */
const DEFAULT_API_BASE = 'https://api2.inigo.now';

export function getInigoApiBase(): string {
  const raw = process.env.INIGO_API_BASE?.trim() || DEFAULT_API_BASE;
  return raw.replace(/\/$/, '');
}

/** Route param: numeric id, slug (e.g. morning-meditation-1), or opaque token — not assumed numeric. */
const SESSION_IDENTIFIER_PATTERN = /^[-a-zA-Z0-9_.]{1,128}$/;

export function isValidGuidedSessionShareId(id: string): boolean {
  if (!id || id.length > 128) return false;
  return SESSION_IDENTIFIER_PATTERN.test(id);
}

export type GuidedSessionPreviewOk = {
  kind: 'ok';
  title: string;
  shortDescription?: string;
  coverImageUrl?: string;
  /** Resolved public URL for `<img src>` (absolute https preferred). */
  coverImageUrlResolved?: string;
  durationLabel?: string;
  instructor?: string;
  language?: string;
  playable: boolean;
  unplayableReason?: string;
  /** When set, use for canonical link, og:url, and share metadata (still use site universal link for “Open in Inigo”). */
  canonicalUrl?: string;
};

export type GuidedSessionPreviewNotFound = { kind: 'not_found' };
export type GuidedSessionPreviewUnavailable = {
  kind: 'unavailable';
  message?: string;
};
export type GuidedSessionPreviewError = { kind: 'error' };

export type GuidedSessionPreviewResult =
  | GuidedSessionPreviewOk
  | GuidedSessionPreviewNotFound
  | GuidedSessionPreviewUnavailable
  | GuidedSessionPreviewError;

function previewEndpoint(identifier: string): string {
  return `${getInigoApiBase()}/api/share/preview/guided-session/${encodeURIComponent(identifier)}/`;
}

function absolutizeAgainstBase(baseNoSlash: string, pathOrUrl: string): string {
  const base = baseNoSlash.endsWith('/') ? baseNoSlash : `${baseNoSlash}/`;
  const raw = pathOrUrl.trim();
  if (/^https?:\/\//i.test(raw)) {
    return new URL(raw).toString();
  }
  if (raw.startsWith('//')) {
    return new URL(`https:${raw}`).toString();
  }
  const path = raw.startsWith('/') ? raw : `/${raw}`;
  return new URL(path, base).toString();
}

/**
 * Turn API cover paths into absolute URLs (https) for `<img>` and Open Graph.
 * Protocol-relative and root-relative URLs resolve against `INIGO_API_BASE` first, then the public site.
 */
export function absolutizeSessionCoverUrl(site: string, cover?: string): string | undefined {
  if (!cover?.trim()) return undefined;
  const s = cover.trim();
  const siteBase = site.replace(/\/$/, '');
  const apiBase = getInigoApiBase();
  try {
    if (/^https?:\/\//i.test(s)) {
      return new URL(s).toString();
    }
    if (s.startsWith('//')) {
      return new URL(`https:${s}`).toString();
    }
    if (s.startsWith('/')) {
      return absolutizeAgainstBase(apiBase, s);
    }
    return new URL(s, `${apiBase}/`).toString();
  } catch {
    try {
      return absolutizeAgainstBase(siteBase, s.startsWith('/') ? s : `/${s}`);
    } catch {
      return undefined;
    }
  }
}

/**
 * Canonical / OG URL: prefer backend `canonical_url` when present; otherwise the default share page on this site.
 * Returns an absolute URL suitable for `alternates.canonical`, `openGraph.url`, and Twitter card URL.
 */
export function resolveGuidedSessionShareCanonicalUrl(
  site: string,
  routeIdentifier: string,
  preview: GuidedSessionPreviewResult,
): string {
  const siteBase = site.replace(/\/$/, '');
  const defaultPath = `/guided-session/${routeIdentifier}`;
  const defaultCanonical = new URL(defaultPath, `${siteBase}/`).toString();

  if (preview.kind !== 'ok') {
    return defaultCanonical;
  }

  const raw = preview.canonicalUrl?.trim();
  if (!raw) {
    return defaultCanonical;
  }

  try {
    return /^https?:\/\//i.test(raw) ? new URL(raw).toString() : absolutizeAgainstBase(siteBase, raw);
  } catch {
    return defaultCanonical;
  }
}

function pickString(obj: Record<string, unknown>, keys: string[]): string | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'string' && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(obj: Record<string, unknown>, keys: string[]): number | undefined {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && Number.isFinite(v)) return v;
    if (typeof v === 'string' && v.trim()) {
      const n = Number(v);
      if (Number.isFinite(n)) return n;
    }
  }
  return undefined;
}

function pickBool(obj: Record<string, unknown>, keys: string[], defaultValue: boolean): boolean {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'boolean') return v;
  }
  return defaultValue;
}

function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  if (m <= 0) return `${total}s`;
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rm = m % 60;
  if (rm === 0) return `${h} h`;
  return `${h} h ${rm} min`;
}

function parseOkBody(data: Record<string, unknown>): GuidedSessionPreviewOk | GuidedSessionPreviewError {
  const title = pickString(data, ['title', 'name', 'session_title']);
  if (!title) {
    return { kind: 'error' };
  }

  const shortDescription = pickString(data, [
    'short_description',
    'shortDescription',
    'summary',
    'subtitle',
  ]);
  const longDescription = pickString(data, ['description', 'long_description', 'longDescription']);
  const description = shortDescription ?? longDescription;

  const canonicalUrl = pickString(data, [
    'canonical_url',
    'canonicalUrl',
    'share_url',
    'shareUrl',
    'public_url',
    'publicUrl',
    'og_url',
    'ogUrl',
  ]);

  const coverImageUrl = pickString(data, [
    'cover_image_url',
    'coverImageUrl',
    'image_url',
    'imageUrl',
    'cover',
    'thumbnail_url',
    'thumbnailUrl',
  ]);

  const durationDisplay = pickString(data, ['duration_display', 'durationDisplay', 'duration_label']);
  const durationSeconds = pickNumber(data, ['duration_seconds', 'durationSeconds', 'duration']);
  const durationLabel =
    durationDisplay ?? (durationSeconds != null ? formatDuration(durationSeconds) : undefined);

  const instructor = pickString(data, ['instructor', 'instructor_name', 'instructorName', 'guide', 'teacher']);
  const language = pickString(data, ['language', 'language_name', 'languageName', 'locale_label']);

  const playable = pickBool(data, ['playable', 'is_playable', 'isPlayable'], true);
  const unplayableReason = pickString(data, ['unplayable_reason', 'unplayableReason', 'status_message', 'statusMessage']);

  return {
    kind: 'ok',
    title,
    shortDescription: description,
    coverImageUrl,
    durationLabel,
    instructor,
    language,
    playable,
    unplayableReason,
    canonicalUrl,
  };
}

async function fetchPreviewUncached(id: string): Promise<GuidedSessionPreviewResult> {
  if (!isValidGuidedSessionShareId(id)) {
    return { kind: 'not_found' };
  }

  const url = previewEndpoint(id);

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'application/json' },
      next: { revalidate: 60 },
    });

    if (res.status === 404) {
      return { kind: 'not_found' };
    }

    if (res.status === 403 || res.status === 410) {
      return { kind: 'unavailable' };
    }

    if (!res.ok) {
      return { kind: 'error' };
    }

    const ct = res.headers.get('content-type') ?? '';
    if (!ct.includes('application/json')) {
      return { kind: 'error' };
    }

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return { kind: 'error' };
    }

    if (!data || typeof data !== 'object') {
      return { kind: 'error' };
    }

    const record = data as Record<string, unknown>;

    if (record.found === false || record.exists === false) {
      return { kind: 'not_found' };
    }

    const errCode = pickString(record, ['code', 'error_code', 'errorCode'])?.toLowerCase();
    if (errCode === 'not_found' || errCode === 'notfound') {
      return { kind: 'not_found' };
    }

    // Django-style error payload
    const detail = pickString(record, ['detail', 'message', 'error']);
    if (detail && /not\s*found/i.test(detail)) {
      return { kind: 'not_found' };
    }

    const parsed = parseOkBody(record);
    if (parsed.kind !== 'ok') {
      return parsed;
    }
    const site = getPublicSiteUrl();
    const coverResolved = parsed.coverImageUrl
      ? absolutizeSessionCoverUrl(site, parsed.coverImageUrl)
      : undefined;
    return { ...parsed, coverImageUrlResolved: coverResolved ?? parsed.coverImageUrl };
  } catch {
    return { kind: 'error' };
  }
}

/** Per-request dedupe when generateMetadata and page both need the payload. */
export const fetchGuidedSessionPreview = cache(fetchPreviewUncached);
