import type { GuidedSessionMediaRole } from '@/lib/studio/guidedSessionMedia';
import type { PendingMediaAttach } from '@/lib/studio/guidedSessionMediaTypes';

function storageKey(sessionId: number, role: GuidedSessionMediaRole): string {
  return `studio-pending-attach:v1:${sessionId}:${role}`;
}

function isPendingMediaAttach(value: unknown): value is PendingMediaAttach {
  if (!value || typeof value !== 'object') return false;
  const record = value as Record<string, unknown>;
  return (
    typeof record.sessionId === 'number' &&
    (record.mediaRole === 'audio' ||
      record.mediaRole === 'thumbnail' ||
      record.mediaRole === 'video') &&
    typeof record.storageUrl === 'string' &&
    record.storageUrl.trim().length > 0 &&
    typeof record.storagePath === 'string' &&
    record.storagePath.trim().length > 0 &&
    typeof record.fileMetadata === 'object' &&
    record.fileMetadata !== null
  );
}

/** Persist attach-pending recovery across refresh / section remount. Browser only. */
export function savePendingMediaAttach(pending: PendingMediaAttach): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(
      storageKey(pending.sessionId, pending.mediaRole),
      JSON.stringify(pending),
    );
  } catch {
    // Quota / private mode — recovery is best-effort.
  }
}

export function loadPendingMediaAttach(
  sessionId: number,
  role: GuidedSessionMediaRole,
): PendingMediaAttach | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(storageKey(sessionId, role));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!isPendingMediaAttach(parsed)) {
      window.sessionStorage.removeItem(storageKey(sessionId, role));
      return null;
    }
    if (parsed.sessionId !== sessionId || parsed.mediaRole !== role) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingMediaAttach(
  sessionId: number,
  role: GuidedSessionMediaRole,
): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(storageKey(sessionId, role));
  } catch {
    // ignore
  }
}
