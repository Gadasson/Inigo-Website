const DEFAULT_API_BASE = 'https://api2.inigo.now';

/** Static env access so Next.js inlines values in the client bundle (Studio shell). */
export function getInigoApiBase(): string {
  const raw =
    process.env.NEXT_PUBLIC_INIGO_API_BASE?.trim() ||
    process.env.INIGO_API_BASE?.trim() ||
    DEFAULT_API_BASE;
  return raw.replace(/\/$/, '');
}
