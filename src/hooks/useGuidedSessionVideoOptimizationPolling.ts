'use client';

import { useEffect, useRef } from 'react';
import {
  getGuidedSession,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { getVideoOptimizationDisplayStatus } from '@/lib/studio/guidedSessionMedia';

/** Calm poll while display_status is optimizing (5–10s band). */
export const VIDEO_OPTIMIZATION_POLL_INTERVAL_MS = 7_000;

type Options = {
  session: StudioGuidedSession | null;
  enabled?: boolean;
  getIdToken: () => Promise<string | null>;
  onSessionUpdated: (session: StudioGuidedSession) => void;
};

/**
 * Polls session detail while video_optimization_display_status === 'optimizing'.
 * Lives above Media tab so creators can keep editing while optimization runs.
 * Stops on ready / failed / null, unmount, or when enabled becomes false.
 */
export function useGuidedSessionVideoOptimizationPolling({
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
  const shouldPoll =
    enabled &&
    sessionId != null &&
    getVideoOptimizationDisplayStatus(session!) === 'optimizing';

  useEffect(() => {
    if (!shouldPoll || sessionId == null) return;

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      timeoutId = setTimeout(() => {
        void pollOnce();
      }, VIDEO_OPTIMIZATION_POLL_INTERVAL_MS);
    };

    const pollOnce = async () => {
      if (cancelled) return;
      try {
        const token = await getIdTokenRef.current();
        const updated = await getGuidedSession(sessionId, token);
        if (cancelled) return;
        onSessionUpdatedRef.current(updated);
        if (getVideoOptimizationDisplayStatus(updated) === 'optimizing') {
          schedule();
        }
      } catch {
        if (!cancelled) {
          schedule();
        }
      }
    };

    schedule();

    return () => {
      cancelled = true;
      if (timeoutId != null) clearTimeout(timeoutId);
    };
  }, [shouldPoll, sessionId]);
}
