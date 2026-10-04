'use client';

import { useEffect, useRef } from 'react';
import {
  getGuidedSession,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import {
  MEDIA_REPLACEMENT_POLL_INTERVAL_MS,
  shouldPollMediaReplacement,
  shouldRefreshSessionAfterPromotion,
} from '@/lib/studio/mediaReplacement';

type Options = {
  session: StudioGuidedSession | null;
  enabled?: boolean;
  getIdToken: () => Promise<string | null>;
  onSessionUpdated: (session: StudioGuidedSession) => void;
};

/**
 * Polls session detail while a live replacement is preparing, optimizing,
 * or waiting for review (so promotion can update the public media URL).
 * Independent of draft editability.
 */
export function useLiveMediaReplacementPolling({
  session,
  enabled = true,
  getIdToken,
  onSessionUpdated,
}: Options): void {
  const getIdTokenRef = useRef(getIdToken);
  const onSessionUpdatedRef = useRef(onSessionUpdated);
  getIdTokenRef.current = getIdToken;
  onSessionUpdatedRef.current = onSessionUpdated;

  const sessionId = session?.id ?? null;
  const replacementStatus = session?.media_replacement?.status ?? null;
  const shouldPoll = enabled && sessionId != null && shouldPollMediaReplacement(session?.media_replacement);

  useEffect(() => {
    if (!shouldPoll || sessionId == null) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let previousStatus = replacementStatus;

    const schedule = () => {
      timeoutId = setTimeout(() => {
        void pollOnce();
      }, MEDIA_REPLACEMENT_POLL_INTERVAL_MS);
    };

    const pollOnce = async () => {
      if (cancelled) return;
      try {
        const token = await getIdTokenRef.current();
        const updated = await getGuidedSession(sessionId, token);
        if (cancelled) return;
        const nextStatus = updated.media_replacement?.status ?? null;
        onSessionUpdatedRef.current(updated);
        if (
          shouldRefreshSessionAfterPromotion(previousStatus, nextStatus) ||
          shouldPollMediaReplacement(updated.media_replacement)
        ) {
          previousStatus = nextStatus;
          if (shouldPollMediaReplacement(updated.media_replacement)) {
            schedule();
          }
        }
      } catch {
        if (!cancelled) schedule();
      }
    };

    schedule();

    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [shouldPoll, sessionId, replacementStatus]);
}
