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
