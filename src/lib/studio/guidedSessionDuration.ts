import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import {
  formatDurationClock,
  formatDurationFromApiString,
  mmSsPartsToTotalSeconds,
} from '@/lib/studio/formatDuration';
import {
  guidedSessionMediaUrl,
  hasGuidedSessionPrimaryMedia,
} from '@/lib/studio/guidedSessionMedia';

export type GuidedSessionDurationMediaSource = 'audio' | 'video';

/**
 * When primary media exists and the session has a duration, treat it as media-sourced.
 * Future media removal can clear this by dropping media URLs from the session.
 */
export function guidedSessionDurationMediaSource(
  session: StudioGuidedSession,
): GuidedSessionDurationMediaSource | null {
  if (!hasGuidedSessionPrimaryMedia(session)) {
    return null;
  }

  if (!session.duration?.trim()) {
    return null;
  }

  if (guidedSessionMediaUrl(session, 'audio')) {
    return 'audio';
  }

  if (guidedSessionMediaUrl(session, 'video')) {
    return 'video';
  }

  return null;
}

export function isGuidedSessionDurationFromMedia(session: StudioGuidedSession): boolean {
  return guidedSessionDurationMediaSource(session) !== null;
}

export function guidedSessionDurationDisplayLabel(
  session: StudioGuidedSession,
  form: GuidedSessionEditorForm,
): string {
  const mediaSource = guidedSessionDurationMediaSource(session);
  if (mediaSource && session.duration) {
    const detected = formatDurationFromApiString(session.duration);
    if (detected) return detected;
  }

  const totalSeconds = mmSsPartsToTotalSeconds(form.durationMm, form.durationSs);
  if (totalSeconds <= 0) return '—';

  return formatDurationClock(totalSeconds);
}

export function guidedSessionDurationDetectedMessage(
  source: GuidedSessionDurationMediaSource,
): string {
  return `✓ Automatically detected from ${source}`;
}
