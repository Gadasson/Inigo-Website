import { cache } from 'react';

/**
 * Guided session share preview — backend contract
 * ================================================
 * The website loads this as JSON (this route is not HTML-proxied like /e/, /s/, …).
 *
 *   GET {INIGO_API_BASE}/api/share/guided_session/{id}/
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

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

export function isValidGuidedSessionShareId(id: string): boolean {
  return ID_PATTERN.test(id);
}

export type GuidedSessionPreviewOk = {
  kind: 'ok';
  title: string;
  shortDescription?: string;
  coverImageUrl?: string;
  durationLabel?: string;
  instructor?: string;
  language?: string;
  playable: boolean;
  unplayableReason?: string;
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

function previewEndpoint(id: string): string {
  return `${getInigoApiBase()}/api/share/guided_session/${encodeURIComponent(id)}/`;
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
    return parsed;
  } catch {
    return { kind: 'error' };
  }
}

/** Per-request dedupe when generateMetadata and page both need the payload. */
export const fetchGuidedSessionPreview = cache(fetchPreviewUncached);
