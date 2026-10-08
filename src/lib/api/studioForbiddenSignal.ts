/**
 * Studio requests report a 403 here. Bootstrap 403 is ignored so an access
 * check cannot refresh itself. Listeners coalesce parallel 403s into one refresh.
 */
type ForbiddenListener = (path: string) => void;

let listener: ForbiddenListener | null = null;

export function subscribeStudioRequestForbidden(next: ForbiddenListener): () => void {
  listener = next;
  return () => {
    if (listener === next) listener = null;
  };
}

export function notifyStudioRequestForbidden(path: string): void {
  listener?.(path);
}
