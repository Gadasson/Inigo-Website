import { StudioApiError } from '@/lib/api/studioApiClient';

export function parseStudioApiError(error: unknown): string {
  if (error instanceof StudioApiError) {
    if (error.status === 401) {
      return 'Your session expired. Please sign in again.';
    }
    if (error.status === 403) {
      return error.message || 'You do not have permission to perform this action.';
    }
    if (error.status === 404) {
      return error.message || 'This session or resource was not found.';
    }
    if (error.status >= 500) {
      return 'The backend is unavailable right now. Please try again shortly.';
    }
    if (/session_id is already in use/i.test(error.message)) {
      return 'Could not reserve a session ID. Please try again.';
    }
    return error.message;
  }

  if (error instanceof TypeError || error instanceof DOMException || error instanceof Event) {
    return 'Could not reach the backend. Is Django running and CORS configured?';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong. Please try again.';
}

/** Extract DRF-style field errors from a Studio API error body. */
export function getStudioApiFieldErrors(error: unknown): Record<string, string> {
  if (!(error instanceof StudioApiError)) {
    return {};
  }
  const body = error.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return {};
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
    if (key === 'detail' || key === 'code' || key === 'message' || key === 'error') {
      continue;
    }
    if (Array.isArray(value)) {
      const parts = value.filter((item): item is string => typeof item === 'string');
      if (parts.length > 0) {
        result[key] = parts.join(' ');
      }
    } else if (typeof value === 'string' && value.trim()) {
      result[key] = value.trim();
    }
  }
  return result;
}
