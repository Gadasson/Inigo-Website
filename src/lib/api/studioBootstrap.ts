import { studioFetch } from '@/lib/api/studioApiClient';

/** Django bootstrap endpoint — verifies Firebase token + reports Studio access. */
export const STUDIO_BOOTSTRAP_PATH = '/api/me/bootstrap/';

export type StudioAccessInfo = {
  is_studio_creator?: boolean;
};

/**
 * Bootstrap returns 200 for every authenticated user. Studio access is carried
 * explicitly in `studio_access.is_studio_creator` — not the HTTP status.
 */
export type StudioBootstrapResponse = {
  studio_access?: StudioAccessInfo;
} & Record<string, unknown>;

export async function fetchStudioBootstrap(token: string): Promise<StudioBootstrapResponse> {
  return studioFetch<StudioBootstrapResponse>(STUDIO_BOOTSTRAP_PATH, { token });
}

/**
 * True only when the backend explicitly grants Studio creator access.
 * Fails closed: a missing or malformed `studio_access` block is treated as no access.
 */
export function isApprovedStudioCreator(bootstrap: StudioBootstrapResponse | null | undefined): boolean {
  return bootstrap?.studio_access?.is_studio_creator === true;
}
