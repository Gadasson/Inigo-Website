import {
  absolutizeSessionCoverUrl,
  fetchGuidedSessionPreview,
  isValidGuidedSessionShareId,
} from '@/lib/guidedSessionPreview';
import {
  linkPreviewFallbackResponse,
  respondWithProxiedCover,
  type LinkPreviewImageOptions,
} from '@/lib/linkPreviewImage';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';

export const runtime = 'nodejs';

const GUIDED_SESSION_OG: LinkPreviewImageOptions = {
  cacheControl: 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400',
  bundledFile: 'session.jpg',
  byteCache: 'revalidate-300',
};

/**
 * Proxies the guided session cover for link-preview scrapers (e.g. WhatsApp) so `og:image`
 * stays on the public site origin with plain image/* responses.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const { id } = await context.params;

    if (!isValidGuidedSessionShareId(id)) {
      return await linkPreviewFallbackResponse(GUIDED_SESSION_OG);
    }

    const preview = await fetchGuidedSessionPreview(id);
    if (preview.kind !== 'ok') {
      return await linkPreviewFallbackResponse(GUIDED_SESSION_OG);
    }

    const site = getPublicSiteUrl();
    const upstream =
      preview.coverImageUrlResolved ?? absolutizeSessionCoverUrl(site, preview.coverImageUrl);
    return await respondWithProxiedCover(upstream, GUIDED_SESSION_OG);
  } catch {
    return await linkPreviewFallbackResponse(GUIDED_SESSION_OG);
  }
}
