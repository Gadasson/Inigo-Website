/** Convert whole minutes to Django DurationField JSON (HH:MM:SS). */
export function minutesToDurationString(minutes: number): string {
  const total = Math.max(1, Math.round(minutes));
  const hours = Math.floor(total / 60);
  const mins = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}:00`;
}

/** Parse API duration (HH:MM:SS) to whole minutes for the editor. */
export function durationToMinutes(duration: string | undefined, fallbackMinutes = 10): number {
  if (!duration) return fallbackMinutes;

  const match = duration.match(/^(\d+):(\d+)(?::(\d+))?/);
  if (match) {
    const hours = Number(match[1]);
    const mins = Number(match[2]);
    const total = hours * 60 + mins;
    return total > 0 ? total : fallbackMinutes;
  }

  return fallbackMinutes;
}
