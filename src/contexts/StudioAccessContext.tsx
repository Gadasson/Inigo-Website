'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { StudioApiError } from '@/lib/api/studioApiClient';
import {
  fetchStudioBootstrap,
  isApprovedStudioCreator,
} from '@/lib/api/studioBootstrap';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Studio access state, derived from the Django `/api/me/bootstrap/` call.
 *
 * - `idle`      — no signed-in user yet; no access check performed
 * - `loading`   — bootstrap in flight; do NOT render the Studio workspace
 * - `connected` — approved Studio creator (`studio_access.is_studio_creator === true`)
 * - `denied`    — signed in but not an approved creator — show access notice
 * - `offline`   — backend unreachable / network error — show retry
 * - `error`     — auth/token or unexpected backend failure — show retry
 *
 * Access is determined by the `studio_access.is_studio_creator` field in the
 * bootstrap payload — NOT by HTTP status. Bootstrap returns 200 for every
 * authenticated user, so a 200 with `is_studio_creator: false` is `denied`.
 *
 * The backend remains authoritative; this only gates the UI so approved
 * creators enter Studio and everyone else gets a clear, calm screen instead
 * of a workspace that fails later with 403/404.
 */
export type StudioAccessState =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'connected' }
  | { state: 'denied'; message: string }
  | { state: 'offline'; message: string }
  | { state: 'error'; message: string };

type StudioAccessContextValue = {
  status: StudioAccessState;
  retry: () => void;
};

const StudioAccessContext = createContext<StudioAccessContextValue | undefined>(undefined);

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error instanceof Event) {
    return 'Backend offline or unreachable — is Django running and CORS configured?';
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Unexpected error checking access.';
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Event) return true;
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) return true;
  if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NetworkError')) {
    return true;
  }
  return false;
}

function mapApiError(error: StudioApiError): StudioAccessState {
  if (error.status === 403) {
    return {
      state: 'denied',
      message: error.message || 'This account is not an approved Studio creator.',
    };
  }

  if (error.status === 401) {
    return {
      state: 'error',
      message: 'Your session could not be verified. Please sign in again.',
    };
  }

  if (error.status >= 500) {
    return {
      state: 'offline',
      message: `Backend error (${error.status}) — the server may be down or misconfigured.`,
    };
  }

  return {
    state: 'error',
    message: error.message || `Access check failed (${error.status}).`,
  };
}

export function StudioAccessProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken } = useAuth();
  const [status, setStatus] = useState<StudioAccessState>({ state: 'idle' });
  const [reloadToken, setReloadToken] = useState(0);

  const retry = useCallback(() => {
    setReloadToken((token) => token + 1);
  }, []);

  useEffect(() => {
    if (!user) {
      setStatus({ state: 'idle' });
      return;
    }

    let cancelled = false;

    async function checkAccess() {
      setStatus({ state: 'loading' });

      try {
        const token = await getIdToken();
        if (!token) {
          if (!cancelled) {
            setStatus({
              state: 'error',
              message: 'Could not obtain a Firebase ID token. Please sign in again.',
            });
          }
          return;
        }

        const bootstrap = await fetchStudioBootstrap(token);

        if (!cancelled) {
          setStatus(
            isApprovedStudioCreator(bootstrap)
              ? { state: 'connected' }
              : {
                  state: 'denied',
                  message: 'This account is not an approved Studio creator.',
                },
          );
        }
      } catch (error) {
        if (cancelled) return;

        if (isNetworkError(error)) {
          setStatus({
            state: 'offline',
            message: 'Backend offline or unreachable — is Django running and CORS configured?',
          });
          return;
        }

        if (error instanceof StudioApiError) {
          setStatus(mapApiError(error));
          return;
        }

        setStatus({ state: 'error', message: formatUnknownError(error) });
      }
    }

    void checkAccess();

    return () => {
      cancelled = true;
    };
  }, [user, getIdToken, reloadToken]);

  const value = useMemo(() => ({ status, retry }), [status, retry]);

  return <StudioAccessContext.Provider value={value}>{children}</StudioAccessContext.Provider>;
}

export function useStudioAccess(): StudioAccessContextValue {
  const context = useContext(StudioAccessContext);
  if (context === undefined) {
    throw new Error('useStudioAccess must be used within a StudioAccessProvider');
  }
  return context;
}
