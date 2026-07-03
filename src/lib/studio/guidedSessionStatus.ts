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

/** Backend uses `available` for published sessions. */
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

export function guidedSessionStatusLabel(status: string): string {
  switch (status) {
    case 'draft':
      return 'Draft';
    case 'available':
      return 'Published';
    case 'archived':
      return 'Archived';
    default:
      return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }
}
