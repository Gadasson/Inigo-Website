import { StudioApiError } from '@/lib/api/studioApiClient';

export const PUBLISH_COOLDOWN_CODE = 'creator_publish_cooldown_active';
export const PUBLISH_LIMIT_CODE = 'creator_publish_limit_reached';

export type PublishControlError =
  | { kind: 'cooldown'; retryAfterAt: Date | null }
  | { kind: 'limit'; limit: number | null };

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function extractErrorCode(body: unknown): string | null {
  const record = asRecord(body);
  if (!record) return null;
  return typeof record.code === 'string' ? record.code : null;
}

function parseIsoDate(value: unknown): Date | null {
  if (typeof value !== 'string' && typeof value !== 'number') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function parseLimit(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/**
 * Maps structured publish-control errors from the backend into calm Studio copy.
 * Returns null when the error is not a known publish limit / cooldown response.
 *
 * Backend contract:
 * - cooldown: { code: "creator_publish_cooldown_active", retry_after_at }
 * - limit: { code: "creator_publish_limit_reached", limit }
 */
export function parsePublishControlError(error: unknown): PublishControlError | null {
  if (!(error instanceof StudioApiError)) return null;

  const record = asRecord(error.body);
  if (!record) return null;

  const code = extractErrorCode(record);

  if (code === PUBLISH_COOLDOWN_CODE) {
    return { kind: 'cooldown', retryAfterAt: parseIsoDate(record.retry_after_at) };
  }

  if (code === PUBLISH_LIMIT_CODE) {
    return { kind: 'limit', limit: parseLimit(record.limit) };
  }

  return null;
}
