export const MAX_GUIDED_SESSION_DURATION_SECONDS = 180 * 60;

/** Convert whole minutes to Django DurationField JSON (HH:MM:SS). */
export function minutesToDurationString(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  return secondsToDurationString(total * 60);
}

/** Convert seconds to Django DurationField JSON (HH:MM:SS). */
export function secondsToDurationString(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

/** Convert MM + SS parts to Django DurationField JSON (HH:MM:SS). */
export function mmSsToDurationString(minutesPart: number, secondsPart: number): string {
  return secondsToDurationString(mmSsPartsToTotalSeconds(minutesPart, secondsPart));
}

export function mmSsPartsToTotalSeconds(
  minutesPart: string | number,
  secondsPart: string | number,
): number {
  const minutes = Number(minutesPart);
  const seconds = Number(secondsPart);
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds)) {
    return 0;
  }
  return Math.max(0, Math.round(minutes) * 60 + Math.round(seconds));
}

export function totalSecondsToMmSsParts(totalSeconds: number): {
  mm: string;
  ss: string;
} {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return {
    mm: String(minutes).padStart(2, '0'),
    ss: String(secs).padStart(2, '0'),
  };
}

export function parseApiDurationToMmSsParts(duration: string | undefined): {
  mm: string;
  ss: string;
} {
  if (!duration) {
    return { mm: '10', ss: '00' };
  }

  const match = duration.match(/^(\d+):(\d+):(\d+)$/);
  if (!match) {
    return { mm: '10', ss: '00' };
  }

  const hours = Number(match[1]);
  const mins = Number(match[2]);
  const secs = Number(match[3]);
  const totalSeconds = hours * 3600 + mins * 60 + secs;

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return { mm: '10', ss: '00' };
  }

  return totalSecondsToMmSsParts(totalSeconds);
}

export function isValidEstimatedDurationMmSs(
  minutesPart: string,
  secondsPart: string,
): boolean {
  const totalSeconds = mmSsPartsToTotalSeconds(minutesPart, secondsPart);
  return totalSeconds >= 1 && totalSeconds <= MAX_GUIDED_SESSION_DURATION_SECONDS;
}

/** Creator-facing clock label, e.g. 5:17 or 1:05:17. */
export function formatDurationClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds));
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return `${mins}:${String(secs).padStart(2, '0')}`;
}

/** Parse API duration (HH:MM:SS) to a creator-facing clock label. */
export function formatDurationFromApiString(duration: string | undefined): string | null {
  if (!duration) return null;

  const match = duration.match(/^(\d+):(\d+):(\d+)$/);
  if (!match) return null;

  const hours = Number(match[1]);
  const mins = Number(match[2]);
  const secs = Number(match[3]);
  const totalSeconds = hours * 3600 + mins * 60 + secs;

  if (!Number.isFinite(totalSeconds) || totalSeconds <= 0) {
    return null;
  }

  return formatDurationClock(totalSeconds);
}

/** @deprecated Prefer parseApiDurationToMmSsParts for editor fields. */
export function durationToMinutes(duration: string | undefined, fallbackMinutes = 10): number {
  const { mm, ss } = parseApiDurationToMmSsParts(duration);
  const totalSeconds = mmSsPartsToTotalSeconds(mm, ss);
  const totalMinutes = Math.round(totalSeconds / 60);
  return totalMinutes > 0 ? totalMinutes : fallbackMinutes;
}

export function formatMmSsInput(value: string, max: number): string {
  const digits = value.replace(/\D/g, '').slice(0, 3);
  if (!digits) return '';
  const parsed = Math.min(Number(digits), max);
  return String(parsed);
}

export function padMmSsPart(value: string, max: number): string {
  const digits = value.replace(/\D/g, '');
  if (!digits) return '00';
  const parsed = Math.min(Number(digits), max);
  return String(parsed).padStart(2, '0');
}
