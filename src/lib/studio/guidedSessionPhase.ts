/**
 * Creator-facing session phase.
 * Media replacement is not a session status — a live session stays live
 * while a proposed replacement is in review.
 */
export type StudioSessionPhase =
  | 'draft'
  | 'awaiting_approval'
  | 'live'
  | 'archived'
  | 'unknown';

export function studioSessionPhase(session: {
  status?: string | null;
  is_available?: boolean | null;
} | null | undefined): StudioSessionPhase {
  const status = session?.status;
  if (status === 'draft') return 'draft';
  if (status === 'archived') return 'archived';
  if (status === 'available') {
    return session?.is_available ? 'live' : 'awaiting_approval';
  }
  return 'unknown';
}

/** Draft metadata, draft media, and publish stay on this gate. */
export function isDraftEditorEditable(status: string | null | undefined): boolean {
  return status === 'draft';
}

export function isLiveGuidedSession(session: {
  status?: string | null;
  is_available?: boolean | null;
} | null | undefined): boolean {
  return studioSessionPhase(session) === 'live';
}
