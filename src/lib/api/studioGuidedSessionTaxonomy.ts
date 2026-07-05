import { studioFetch } from '@/lib/api/studioApiClient';
import {
  normalizeGuidedSessionTaxonomy,
  type GuidedSessionTaxonomy,
} from '@/lib/studio/guidedSessionTaxonomy';

const TAXONOMY_PATH = '/api/studio/guided-session-taxonomy/';

export async function getGuidedSessionTaxonomy(
  token: string | null,
): Promise<GuidedSessionTaxonomy> {
  if (!token) {
    return { practices: [], globalFocuses: [] };
  }

  const data = await studioFetch<unknown>(TAXONOMY_PATH, {
    method: 'GET',
    token,
  });

  return normalizeGuidedSessionTaxonomy(data);
}
