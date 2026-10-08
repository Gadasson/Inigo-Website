'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  emptyStudioCapabilities,
  fetchStudioBootstrap,
  parseStudioAccess,
  type StudioCapabilities,
  type StudioPublishingLimits,
} from '@/lib/api/studioBootstrap';
import { subscribeStudioRequestForbidden } from '@/lib/api/studioForbiddenSignal';
import { useAuth } from '@/contexts/AuthContext';
import {
  applyStudioAccessFailure,
  applyStudioAccessSuccess,
  beginStudioAccessRefresh,
  classifyStudioAccessFailure,
  createStudioAccessSession,
  planStudioForbiddenRefresh,
  shouldStartFocusRefresh,
  signOutStudioAccess,
  type StudioAccessSession,
} from '@/lib/studio/studioAccessSession';

/**
 * Studio access from GET /api/me/bootstrap/.
 *
 * - `idle`      — signed out
 * - `loading`   — first check for this account; the workspace stays hidden
 * - `connected` — `studio_access.enabled === true` (or the legacy creator flag)
 * - `denied`    — signed in, but Studio entry is not granted
 * - `offline`   — the first check could not reach the backend
 * - `error`     — the first check failed authentication or unexpectedly
 *
 * A connected user may still lack a specific capability. That is not `denied`.
 * Background refresh keeps a connected workspace mounted. A failed refresh
 * does not grant access and does not treat a network error as revocation.
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
  enabled: boolean;
  capabilities: StudioCapabilities;
  publishingLimits: StudioPublishingLimits;
  refresh: () => void;
};

const StudioAccessContext = createContext<StudioAccessContextValue | undefined>(undefined);

const EMPTY_LIMITS: StudioPublishingLimits = {
  creator_publish_cooldown_hours: null,
  creator_max_live_guided_sessions: null,
};

function toPublicStatus(session: StudioAccessSession): StudioAccessState {
  switch (session.phase) {
    case 'idle':
      return { state: 'idle' };
    case 'loading':
      return { state: 'loading' };
    case 'connected':
      return { state: 'connected' };
    case 'denied':
      return { state: 'denied', message: session.message ?? '' };
    case 'offline':
      return { state: 'offline', message: session.message ?? '' };
    case 'error':
      return { state: 'error', message: session.message ?? '' };
    default: {
      const unreachable: never = session.phase;
      return unreachable;
    }
  }
}

export function StudioAccessProvider({ children }: { children: ReactNode }) {
  const { user, getIdToken } = useAuth();
  const [session, setSession] = useState<StudioAccessSession>(createStudioAccessSession);
  const sessionRef = useRef(session);
  const generationRef = useRef(0);
  const userIdRef = useRef<string | null>(null);
  const refreshLockRef = useRef(false);
  const runRefreshRef = useRef<(mode: 'initial' | 'background', userId: string) => void>(() => {});

  useEffect(() => {
    sessionRef.current = session;
  }, [session]);

  const runRefresh = useCallback(
    (mode: 'initial' | 'background', userId: string) => {
      if (mode === 'background' && refreshLockRef.current) return;
      refreshLockRef.current = true;
      const generation = ++generationRef.current;
      setSession((current) => beginStudioAccessRefresh(current, { userId, generation, mode }));

      void (async () => {
        try {
          const token = await getIdToken();
          if (generation !== generationRef.current || userId !== userIdRef.current) return;
          if (!token) {
            setSession((current) =>
              applyStudioAccessFailure(current, {
                userId,
                generation,
                mode,
                failure: 'auth',
                message: 'Could not obtain a Firebase ID token. Please sign in again.',
              }),
            );
            return;
          }

          const bootstrap = await fetchStudioBootstrap(token);
          if (generation !== generationRef.current || userId !== userIdRef.current) return;
          setSession((current) =>
            applyStudioAccessSuccess(current, {
              userId,
              generation,
              access: parseStudioAccess(bootstrap),
            }),
          );
        } catch (error) {
          if (generation !== generationRef.current || userId !== userIdRef.current) return;
          const classified = classifyStudioAccessFailure(error);
          setSession((current) =>
            applyStudioAccessFailure(current, {
              userId,
              generation,
              mode,
              failure: classified.failure,
              message: classified.message,
            }),
          );
        } finally {
          if (generation === generationRef.current) {
            refreshLockRef.current = false;
          }
        }
      })();
    },
    [getIdToken],
  );

  useEffect(() => {
    runRefreshRef.current = runRefresh;
  }, [runRefresh]);

  useEffect(() => {
    if (!user) {
      userIdRef.current = null;
      const generation = ++generationRef.current;
      refreshLockRef.current = false;
      setSession((current) => signOutStudioAccess(current, generation));
      return;
    }

    userIdRef.current = user.uid;
    runRefreshRef.current('initial', user.uid);
  }, [user]);

  const refresh = useCallback(() => {
    const userId = userIdRef.current;
    if (!userId) return;
    const mode = sessionRef.current.phase === 'connected' ? 'background' : 'initial';
    runRefreshRef.current(mode, userId);
  }, []);

  useEffect(() => {
    return subscribeStudioRequestForbidden((path) => {
      const plan = planStudioForbiddenRefresh({
        path,
        refreshInFlight: refreshLockRef.current,
      });
      if (plan.action !== 'start' || plan.replay) return;
      const userId = userIdRef.current;
      if (!userId) return;
      runRefreshRef.current('background', userId);
    });
  }, []);

  useEffect(() => {
    function onReturn() {
      const visibilityState = document.visibilityState === 'visible' ? 'visible' : 'hidden';
      if (
        !shouldStartFocusRefresh({
          visibilityState,
          signedIn: userIdRef.current != null,
          refreshInFlight: refreshLockRef.current,
          phase: sessionRef.current.phase,
        })
      ) {
        return;
      }
      const userId = userIdRef.current;
      if (!userId) return;
      runRefreshRef.current('background', userId);
    }

    window.addEventListener('focus', onReturn);
    document.addEventListener('visibilitychange', onReturn);
    return () => {
      window.removeEventListener('focus', onReturn);
      document.removeEventListener('visibilitychange', onReturn);
    };
  }, []);

  const status = toPublicStatus(session);
  const enabled = session.phase === 'connected' && session.access?.enabled === true;
  const capabilities = enabled && session.access ? session.access.capabilities : emptyStudioCapabilities();
  const publishingLimits = session.access?.publishingLimits ?? EMPTY_LIMITS;

  const value = useMemo(
    () => ({ status, enabled, capabilities, publishingLimits, refresh }),
    [status, enabled, capabilities, publishingLimits, refresh],
  );

  return <StudioAccessContext.Provider value={value}>{children}</StudioAccessContext.Provider>;
}

export function useStudioAccess(): StudioAccessContextValue {
  const context = useContext(StudioAccessContext);
  if (context === undefined) {
    throw new Error('useStudioAccess must be used within a StudioAccessProvider');
  }
  return context;
}
