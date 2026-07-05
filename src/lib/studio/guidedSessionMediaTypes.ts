import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';

export type DetectedMediaDuration = {
  role: 'audio' | 'video';
  seconds: number;
  durationString: string;
  displayLabel: string;
};

export type MediaSessionUpdateMeta = {
  durationDetected?: DetectedMediaDuration;
};

export type OnGuidedSessionMediaUpdated = (
  session: StudioGuidedSession,
  meta?: MediaSessionUpdateMeta,
) => void;
