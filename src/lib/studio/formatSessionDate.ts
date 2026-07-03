export function formatSessionDate(iso: string | undefined): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

export function sessionTimestamp(session: {
  updated_at?: string;
  created_at?: string;
}): string | null {
  return formatSessionDate(session.updated_at ?? session.created_at);
}

export function sessionTimestampLabel(session: {
  updated_at?: string;
  created_at?: string;
}): string | null {
  const formatted = sessionTimestamp(session);
  if (!formatted) return null;
  return session.updated_at ? `Updated ${formatted}` : `Created ${formatted}`;
}
