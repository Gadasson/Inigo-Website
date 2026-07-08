export function formatSessionDate(iso: string | undefined, locale?: string): string | null {
  if (!iso) return null;

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  const intlLocale = locale === 'he' ? 'he-IL' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
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
