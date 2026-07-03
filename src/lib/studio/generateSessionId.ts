function slugifyTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize('NFKD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 80) || 'session'
  );
}

function randomSuffix(length = 4): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let out = '';
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}

/** Slug from title + short random suffix (e.g. morning-breath-4f2a). */
export function generateSessionId(title: string): string {
  return `${slugifyTitle(title)}-${randomSuffix()}`;
}
