export type GuidedSessionStatusFilter = 'all' | 'draft' | 'published' | 'archived';

export const GUIDED_SESSION_STATUS_FILTERS: {
  id: GuidedSessionStatusFilter;
  label: string;
}[] = [
  { id: 'all', label: 'All' },
  { id: 'draft', label: 'Drafts' },
  { id: 'published', label: 'Published' },
  { id: 'archived', label: 'Archived' },
];

/** Backend uses `available` for both awaiting-approval and live sessions. */
export function matchesStatusFilter(
  status: string,
  filter: GuidedSessionStatusFilter,
): boolean {
  if (filter === 'all') return true;
  if (filter === 'draft') return status === 'draft';
  if (filter === 'published') return status === 'available';
  if (filter === 'archived') return status === 'archived';
  return true;
}

/**
 * Creator-facing label.
 * `available` + is_available distinguishes awaiting initial approval from live.
 * When availability is unknown, available stays unlabeled as a single "Published".
 */
export function guidedSessionStatusLabel(
  status: string,
  isAvailable?: boolean,
): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'available':
      if (isAvailable === true) return 'Live';
      if (isAvailable === false) return 'Awaiting review';
      return 'Published';
    case 'archived':
      return 'Archived';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
