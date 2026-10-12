import { headers } from 'next/headers';
import PublicContentSharePage from '@/components/public-share/PublicContentSharePage';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';
import {
  coverSrcFromPreview,
  isValidPublicContentId,
  loadPublicContentPreview,
  publicContentMetadata,
  resolvePublicContentOpenUrl,
  sanitizeAcceptLanguage,
  type PublicContentPreviewResult,
} from '@/lib/publicContentShare';

export const dynamic = 'force-dynamic';

async function requestLanguage(): Promise<string | undefined> {
  return sanitizeAcceptLanguage((await headers()).get('accept-language'));
}

async function loadPreview(id: string, acceptLanguage?: string | null): Promise<PublicContentPreviewResult> {
  if (!isValidPublicContentId(id)) return { kind: 'unavailable' };
  return loadPublicContentPreview('challenge', id, acceptLanguage);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return publicContentMetadata('challenge', id, await requestLanguage());
}

export default async function ChallengeSharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const site = getPublicSiteUrl();
  const preview = await loadPreview(id, await requestLanguage());

  return (
    <PublicContentSharePage
      kind="challenge"
      preview={preview}
      openUrl={resolvePublicContentOpenUrl(site, 'challenge', id)}
      coverSrc={coverSrcFromPreview(site, preview)}
    />
  );
}
