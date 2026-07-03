import { studioFetch } from '@/lib/api/studioApiClient';

/** Django bootstrap endpoint — verifies Firebase token + creator access. */
export const STUDIO_BOOTSTRAP_PATH = '/api/me/bootstrap/';

export type StudioBootstrapResponse = Record<string, unknown>;

export async function fetchStudioBootstrap(token: string): Promise<StudioBootstrapResponse> {
  return studioFetch<StudioBootstrapResponse>(STUDIO_BOOTSTRAP_PATH, { token });
}
