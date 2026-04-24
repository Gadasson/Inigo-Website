import type { Metadata } from 'next';
import Link from 'next/link';
import { APP_STORE_URL, PLAY_STORE_URL } from '@/lib/appLinks';
import {
  fetchGuidedSessionPreview,
  isValidGuidedSessionShareId,
  type GuidedSessionPreviewResult,
} from '@/lib/guidedSessionPreview';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';
import '../guided-session-share.css';

const FALLBACK_OG_PATH = '/static/share/session.jpg';

function absoluteUrl(site: string, pathOrUrl: string): string {
  if (/^https?:\/\//i.test(pathOrUrl)) {
    try {
      return new URL(pathOrUrl).toString();
    } catch {
      /* fall through */
    }
  }
  const base = site.endsWith('/') ? site : `${site}/`;
  const path = pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`;
  return new URL(path, base).toString();
}

function pickOgImage(site: string, preview: GuidedSessionPreviewResult): string {
  if (preview.kind === 'ok' && preview.coverImageUrl) {
    try {
      const u = new URL(preview.coverImageUrl);
      if (u.protocol === 'https:') return u.toString();
    } catch {
      /* ignore */
    }
  }
  return absoluteUrl(site, FALLBACK_OG_PATH);
}

function metaTitle(preview: GuidedSessionPreviewResult): string {
  if (preview.kind === 'ok') return `${preview.title} — Inigo`;
  if (preview.kind === 'not_found') return 'Session not found — Inigo';
  if (preview.kind === 'unavailable') return 'Session unavailable — Inigo';
  return 'Inigo — Guided session';
}

function metaDescription(site: string, preview: GuidedSessionPreviewResult): string {
  if (preview.kind === 'ok') {
    const line =
      preview.shortDescription?.slice(0, 200) ||
      (preview.durationLabel
        ? `About ${preview.durationLabel} of guided presence in Inigo.`
        : 'Open this guided session in Inigo.');
    return line;
  }
  if (preview.kind === 'not_found') {
    return 'This link may be incomplete, or the session is no longer here. You can still find calm in the Inigo app.';
  }
  if (preview.kind === 'unavailable') {
    return 'This guided session is not available to open right now. Inigo is still here when you are ready.';
  }
  return `Something did not load as expected. Open the Inigo app, or get it from the App Store: ${site}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const site = getPublicSiteUrl();
  const canonicalPath = `/guided-session/${id}`;
  const canonical = new URL(canonicalPath, `${site}/`).toString();

  const preview = isValidGuidedSessionShareId(id)
    ? await fetchGuidedSessionPreview(id)
    : { kind: 'not_found' as const };

  const title = metaTitle(preview);
  const description = metaDescription(site, preview);
  const ogImage = pickOgImage(site, preview);

  return {
    metadataBase: new URL(site),
    title,
    description,
    alternates: { canonical: canonicalPath },
    robots: {
      index: preview.kind === 'ok',
      follow: true,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: 'Inigo',
      type: 'website',
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  };
}

export const revalidate = 60;

function SessionMeta({ preview }: { preview: Extract<GuidedSessionPreviewResult, { kind: 'ok' }> }) {
  const parts: string[] = [];
  if (preview.durationLabel) parts.push(preview.durationLabel);
  if (preview.instructor) parts.push(preview.instructor);
  if (preview.language) parts.push(preview.language);
  if (parts.length === 0) return null;
  return <p className="gss__meta">{parts.join(' · ')}</p>;
}

export default async function GuidedSessionSharePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const site = getPublicSiteUrl();
  const openUrl = new URL(`/guided-session/${id}`, `${site}/`).toString();

  const preview = isValidGuidedSessionShareId(id)
    ? await fetchGuidedSessionPreview(id)
    : { kind: 'not_found' as const };

  const showCover = preview.kind === 'ok' && Boolean(preview.coverImageUrl);
  const coverSrc = preview.kind === 'ok' ? preview.coverImageUrl : undefined;

  return (
    <main className="gss">
      <div className="gss__card">
        {preview.kind === 'ok' && (
          <div className="gss__media" aria-hidden={!showCover}>
            {showCover && coverSrc ? (
              // eslint-disable-next-line @next/next/no-img-element -- remote session art from API; unknown hostnames
              <img src={coverSrc} alt="" width={1200} height={750} decoding="async" />
            ) : (
              <div className="gss__empty-media" aria-hidden>
                <span>🌿</span>
              </div>
            )}
          </div>
        )}

        <div className="gss__body">
          {preview.kind === 'not_found' && (
            <>
              <h1 className="gss__title">This session is not here</h1>
              <p className="gss__desc">
                The link may be incomplete, or this session may have moved. Nothing is wrong on your side.
              </p>
            </>
          )}

          {preview.kind === 'unavailable' && (
            <>
              <h1 className="gss__title">This session is resting</h1>
              <p className="gss__desc">
                {preview.message ||
                  'It is not available to open right now. You are still welcome in Inigo whenever you are ready.'}
              </p>
            </>
          )}

          {preview.kind === 'error' && (
            <>
              <h1 className="gss__title">Something did not load</h1>
              <p className="gss__desc">
                We could not reach the details for this session just now. You can try again in a little while, or open
                Inigo directly.
              </p>
            </>
          )}

          {preview.kind === 'ok' && (
            <>
              <h1 className="gss__title">{preview.title}</h1>
              <SessionMeta preview={preview} />
              {preview.shortDescription ? <p className="gss__desc">{preview.shortDescription}</p> : null}
              {!preview.playable ? (
                <p className="gss__notice" role="status">
                  {preview.unplayableReason ||
                    'This session is not open for playback in the app right now. You can still browse Inigo for something that fits today.'}
                </p>
              ) : null}
            </>
          )}

          <div className="gss__actions">
            <a className="gss__btn gss__btn--primary" href={openUrl}>
              Open in Inigo
            </a>
            <div className="gss__stores">
              <a className="gss__store" href={APP_STORE_URL} target="_blank" rel="noopener noreferrer">
                App Store
              </a>
              <a className="gss__store" href={PLAY_STORE_URL} target="_blank" rel="noopener noreferrer">
                Google Play
              </a>
            </div>
            <p className="gss__lede" style={{ marginTop: '0.75rem', marginBottom: 0, maxWidth: 'none' }}>
              If the app is already installed, the button above should gently hand you over. Otherwise, download Inigo
              and come back to this link.
            </p>
          </div>
        </div>
      </div>

      <div className="gss__brand">
        <Link href="/en">inigo.now</Link>
      </div>
    </main>
  );
}
