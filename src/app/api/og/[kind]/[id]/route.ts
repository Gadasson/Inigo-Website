import { absolutizeSessionCoverUrl } from '@/lib/guidedSessionPreview';
import {
  linkPreviewFallbackResponse,
  respondWithProxiedCover,
  type LinkPreviewImageOptions,
} from '@/lib/linkPreviewImage';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';
import {
  fetchPublicContentPreview,
  isPublicContentKind,
  isValidPublicContentId,
  PUBLIC_CONTENT_OG_CACHE,
} from '@/lib/publicContentShare';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const PUBLIC_CONTENT_OG: LinkPreviewImageOptions = {
  cacheControl: PUBLIC_CONTENT_OG_CACHE,
  bundledFile: 'default.jpg',
  byteCache: 'no-store',
};

/**
 * Cover proxy for recipe and challenge link previews.
 * Unavailable, missing, and flag-off results return the generic share image
 * with `Cache-Control: no-store`, so a previous cover is not kept.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ kind: string; id: string }> },
): Promise<Response> {
  try {
    const { kind, id } = await context.params;
    if (!isPublicContentKind(kind) || !isValidPublicContentId(id)) {
      return await linkPreviewFallbackResponse(PUBLIC_CONTENT_OG);
    }

    const preview = await fetchPublicContentPreview(kind, id);
    if (preview.kind !== 'ok') {
      return await linkPreviewFallbackResponse(PUBLIC_CONTENT_OG);
    }

    const site = getPublicSiteUrl();
    const upstream =
      preview.coverImageUrlResolved ?? absolutizeSessionCoverUrl(site, preview.coverImageUrl);
    return await respondWithProxiedCover(upstream, PUBLIC_CONTENT_OG);
  } catch {
    return await linkPreviewFallbackResponse(PUBLIC_CONTENT_OG);
  }
}
