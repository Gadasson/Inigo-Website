'use client';

import { useEffect, useState } from 'react';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { fetchStudioBootstrap } from '@/lib/api/studioBootstrap';
import { useAuth } from '@/contexts/AuthContext';

export type StudioBackendStatus =
  | { state: 'idle' }
  | { state: 'loading' }
  | { state: 'connected' }
  | { state: 'denied'; message: string }
  | { state: 'offline'; message: string }
  | { state: 'error'; message: string };

function formatUnknownError(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (error instanceof Event) {
    return 'Backend offline or unreachable — is Django running and CORS configured?';
  }
  if (typeof error === 'string' && error.trim()) return error.trim();
  return 'Unexpected error checking backend.';
}

function isNetworkError(error: unknown): boolean {
  if (error instanceof Event) return true;
  if (error instanceof TypeError && /fetch|network|failed/i.test(error.message)) return true;
  if (error instanceof DOMException && (error.name === 'AbortError' || error.name === 'NetworkError')) {
    return true;
  }
  return false;
}

function mapApiError(error: StudioApiError): StudioBackendStatus {
  if (error.status === 401) {
    return {
      state: 'denied',
      message: 'Authentication failed — sign in again or check your Firebase token.',
    };
  }

  if (error.status === 403) {
    return {
      state: 'denied',
      message: error.message || 'Access denied — this account is not an approved Studio creator.',
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
    message: error.message || `Backend request failed (${error.status}).`,
  };
}

export function useStudioBackendStatus(): StudioBackendStatus {
  const { user, getIdToken } = useAuth();
  const [status, setStatus] = useState<StudioBackendStatus>({ state: 'idle' });

  useEffect(() => {
    if (!user) {
      setStatus({ state: 'idle' });
      return;
    }

    let cancelled = false;

    async function checkBackend() {
      setStatus({ state: 'loading' });

      try {
        const token = await getIdToken();
        if (!token) {
          if (!cancelled) {
            setStatus({
              state: 'error',
              message: 'Could not obtain a Firebase ID token.',
            });
          }
          return;
        }

        await fetchStudioBootstrap(token);

        if (!cancelled) {
          setStatus({ state: 'connected' });
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

        setStatus({
          state: 'error',
          message: formatUnknownError(error),
        });
      }
    }

    void checkBackend().catch((error) => {
      if (cancelled) return;
      setStatus({
        state: isNetworkError(error) ? 'offline' : 'error',
        message: formatUnknownError(error),
      });
    });

    return () => {
      cancelled = true;
    };
  }, [user, getIdToken]);

  return status;
}
