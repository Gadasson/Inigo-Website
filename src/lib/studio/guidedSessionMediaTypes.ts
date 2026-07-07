import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionMediaRole } from '@/lib/studio/guidedSessionMedia';

export type DetectedMediaDuration = {
  role: 'audio' | 'video';
  seconds: number;
  durationString: string;
  displayLabel: string;
};

/**
 * Firebase upload succeeded but attach-media has not completed yet.
 * Stored in the media slot so the creator can retry attach without re-uploading.
 */
export type PendingMediaAttach = {
  sessionId: number;
  mediaRole: GuidedSessionMediaRole;
  storageUrl: string;
  storagePath: string;
  fileMetadata: Record<string, unknown>;
  detectedDuration?: DetectedMediaDuration;
  originalFileName?: string;
};

export type MediaSessionUpdateMeta = {
  durationDetected?: DetectedMediaDuration;
};

export type OnGuidedSessionMediaUpdated = (
  session: StudioGuidedSession,
  meta?: MediaSessionUpdateMeta,
) => void;
