import { STUDIO_BOOTSTRAP_PATH, type ParsedStudioAccess } from '@/lib/api/studioBootstrap';
import { StudioApiError } from '@/lib/api/studioApiClient';

export type StudioCheckPhase = 'idle' | 'loading' | 'connected' | 'denied' | 'offline' | 'error';

export type StudioAccessSession = {
  userId: string | null;
  generation: number;
  phase: StudioCheckPhase;
  access: ParsedStudioAccess | null;
  message: string | null;
  refreshInFlight: boolean;
};

export type StudioAccessFailureKind = 'network' | 'auth' | 'forbidden' | 'error';

export const STUDIO_ACCESS_DENIED_MESSAGE = 'This account is not an approved Studio creator.';

export function createStudioAccessSession(): StudioAccessSession {
  return {
    userId: null,
    generation: 0,
    phase: 'idle',
    access: null,
    message: null,
    refreshInFlight: false,
  };
}

export function signOutStudioAccess(state: StudioAccessSession, generation: number): StudioAccessSession {
  return {
    userId: null,
    generation,
    phase: 'idle',
    access: null,
    message: null,
    refreshInFlight: false,
  };
}

export function beginStudioAccessRefresh(
  state: StudioAccessSession,
  input: { userId: string; generation: number; mode: 'initial' | 'background' },
): StudioAccessSession {
  const accountSwitch = state.userId !== null && state.userId !== input.userId;
  const clearForLoad = input.mode === 'initial' || state.phase === 'idle' || accountSwitch;
  return {
    userId: input.userId,
    generation: input.generation,
    phase: clearForLoad ? 'loading' : state.phase,
    access: clearForLoad ? null : state.access,
    message: clearForLoad ? null : state.message,
    refreshInFlight: true,
  };
}

export function isCurrentStudioAccessResult(
  state: StudioAccessSession,
  result: { userId: string; generation: number },
): boolean {
  return state.userId === result.userId && state.generation === result.generation;
}

export function applyStudioAccessSuccess(
  state: StudioAccessSession,
  result: { userId: string; generation: number; access: ParsedStudioAccess },
): StudioAccessSession {
  if (!isCurrentStudioAccessResult(state, result)) return state;
  if (!result.access.enabled) {
    return {
      ...state,
      phase: 'denied',
      access: null,
      message: STUDIO_ACCESS_DENIED_MESSAGE,
      refreshInFlight: false,
    };
  }
  return {
    ...state,
    phase: 'connected',
    access: result.access,
    message: null,
    refreshInFlight: false,
  };
}

export function applyStudioAccessFailure(
  state: StudioAccessSession,
  result: {
    userId: string;
    generation: number;
    mode: 'initial' | 'background';
    failure: StudioAccessFailureKind;
    message: string;
  },
): StudioAccessSession {
  if (!isCurrentStudioAccessResult(state, result)) return state;

  const keepCurrent =
    result.mode === 'background' &&
    (result.failure === 'network' || result.failure === 'error') &&
    (state.phase === 'connected' ||
      state.phase === 'denied' ||
      state.phase === 'offline' ||
      state.phase === 'error');

  if (keepCurrent) {
    return { ...state, refreshInFlight: false };
  }

  if (result.failure === 'forbidden') {
    return {
      ...state,
      phase: 'denied',
      access: null,
      message: result.message || STUDIO_ACCESS_DENIED_MESSAGE,
      refreshInFlight: false,
    };
  }

  if (result.failure === 'network') {
    return {
      ...state,
      phase: 'offline',
      access: null,
      message: result.message,
      refreshInFlight: false,
    };
  }

  return {
    ...state,
    phase: 'error',
    access: null,
    message: result.message,
    refreshInFlight: false,
  };
}

export type StudioForbiddenPlan = {
  action: 'start' | 'coalesce' | 'ignore';
  replay: false;
};

/** A 403 never replays the original request. Bootstrap 403 does not refresh. */
export function planStudioForbiddenRefresh(input: {
  path: string;
  method?: string;
  refreshInFlight: boolean;
}): StudioForbiddenPlan {
  void input.method;
  if (input.path === STUDIO_BOOTSTRAP_PATH) {
    return { action: 'ignore', replay: false };
  }
  if (input.refreshInFlight) {
    return { action: 'coalesce', replay: false };
  }
  return { action: 'start', replay: false };
}

export function shouldStartFocusRefresh(input: {
  visibilityState: 'visible' | 'hidden';
  signedIn: boolean;
  refreshInFlight: boolean;
  phase: StudioCheckPhase;
}): boolean {
  if (input.visibilityState !== 'visible') return false;
  if (!input.signedIn) return false;
  if (input.refreshInFlight) return false;
  if (input.phase === 'idle' || input.phase === 'loading') return false;
  return true;
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Event) return true;
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) return true;
  if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NetworkError')) {
    return true;
  }
  return false;
}

export function classifyStudioAccessFailure(error: unknown): {
  failure: StudioAccessFailureKind;
  message: string;
} {
  if (isNetworkError(error)) {
    return {
      failure: 'network',
      message: 'Backend offline or unreachable — is Django running and CORS configured?',
    };
  }

  if (error instanceof StudioApiError) {
    if (error.status === 403) {
      return {
        failure: 'forbidden',
        message: error.message || STUDIO_ACCESS_DENIED_MESSAGE,
      };
    }
    if (error.status === 401) {
      return {
        failure: 'auth',
        message: 'Your session could not be verified. Please sign in again.',
      };
    }
    if (error.status >= 500) {
      return {
        failure: 'network',
        message: `Backend error (${error.status}) — the server may be down or misconfigured.`,
      };
    }
    return {
      failure: 'error',
      message: error.message || `Access check failed (${error.status}).`,
    };
  }

  if (error instanceof Error && error.message.trim()) {
    return { failure: 'error', message: error.message };
  }

  return { failure: 'error', message: 'Unexpected error checking access.' };
}
