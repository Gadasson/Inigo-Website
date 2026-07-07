/**
 * Formats the next-available publish time for creator-facing copy.
 */
export function formatPublishAvailableAt(date: Date, locale: string): string {
  const intlLocale = locale === 'he' ? 'he-IL' : 'en-US';
  return new Intl.DateTimeFormat(intlLocale, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}
