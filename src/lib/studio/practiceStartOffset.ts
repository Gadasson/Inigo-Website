import {
  formatMmSsInput,
  mmSsPartsToTotalSeconds,
  padMmSsPart,
  totalSecondsToMmSsParts,
} from '@/lib/studio/formatDuration';

export type PracticeStartMediaKind = 'audio' | 'video';

export type PracticeStartServerField =
  | 'practice_start_audio_seconds'
  | 'practice_start_video_seconds';

export function practiceStartServerField(
  kind: PracticeStartMediaKind,
): PracticeStartServerField {
  return kind === 'audio'
    ? 'practice_start_audio_seconds'
    : 'practice_start_video_seconds';
}

/** Display parts for an optional whole-second offset. Empty means unset (null). */
export function practiceStartSecondsToMmSsParts(
  totalSeconds: number | null | undefined,
): { mm: string; ss: string } {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return { mm: '', ss: '' };
  }
  return totalSecondsToMmSsParts(Math.floor(totalSeconds));
}

/**
 * Empty / incomplete draft → null.
 * Otherwise whole seconds from mm:ss parts.
 */
export function practiceStartMmSsToSeconds(
  minutesPart: string,
  secondsPart: string,
): number | null {
  const mm = minutesPart.trim();
  const ss = secondsPart.trim();
  if (!mm && !ss) return null;
  return mmSsPartsToTotalSeconds(mm || '0', ss || '0');
}

export function isPracticeStartMmSsEmpty(minutesPart: string, secondsPart: string): boolean {
  return !minutesPart.trim() && !secondsPart.trim();
}

export function formatPracticeStartMmInput(value: string): string {
  return formatMmSsInput(value, 180);
}

export function formatPracticeStartSsInput(value: string): string {
  return formatMmSsInput(value, 59);
}

export function padPracticeStartMm(value: string): string {
  if (!value.trim()) return '';
  return padMmSsPart(value, 180);
}

export function padPracticeStartSs(value: string): string {
  if (!value.trim()) return '';
  return padMmSsPart(value, 59);
}

/** Player currentTime → whole seconds (floor). */
export function practiceStartSecondsFromPlayer(
  media: Pick<HTMLMediaElement, 'currentTime'> | null | undefined,
): number | null {
  if (!media) return null;
  const seconds = Math.floor(media.currentTime);
  if (!Number.isFinite(seconds) || seconds < 0) return null;
  return seconds;
}

export function parseSessionDurationSeconds(
  duration: string | undefined,
): number | null {
  if (!duration) return null;
  const match = duration.match(/^(\d+):(\d+):(\d+)$/);
  if (!match) return null;
  const hours = Number(match[1]);
  const mins = Number(match[2]);
  const secs = Number(match[3]);
  const total = hours * 3600 + mins * 60 + secs;
  if (!Number.isFinite(total) || total <= 0) return null;
  return total;
}

/** Offset must be strictly before session duration when duration is known. */
export function isValidPracticeStartSeconds(
  totalSeconds: number | null,
  durationSeconds: number | null,
): boolean {
  if (totalSeconds == null) return true;
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return false;
  if (durationSeconds == null) return true;
  return totalSeconds < durationSeconds;
}
