import { readFile } from 'node:fs/promises';
import path from 'node:path';

import {
  absolutizeSessionCoverUrl,
  fetchGuidedSessionPreview,
  isValidGuidedSessionShareId,
} from '@/lib/guidedSessionPreview';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';

export const runtime = 'nodejs';

const CACHE_HEADER = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

function isSupportedImageContentType(ct: string): boolean {
  const base = ct.split(';')[0]?.trim().toLowerCase() ?? '';
  return (
    base === 'image/png' ||
    base === 'image/jpeg' ||
    base === 'image/jpg' ||
    base === 'image/webp' ||
    base === 'image/gif'
  );
}

async function readBundledFallback(): Promise<{ body: Buffer; contentType: string } | null> {
  const filePath = path.join(process.cwd(), 'public', 'static', 'share', 'session.jpg');
  try {
    const body = await readFile(filePath);
    return { body, contentType: 'image/jpeg' };
  } catch {
    return null;
  }
}

async function fetchUrlBytes(url: string): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  const res = await fetch(url, {
    method: 'GET',
    headers: { Accept: 'image/*,*/*' },
    redirect: 'follow',
    next: { revalidate: 300 },
  });
  if (!res.ok) return null;
  const rawCt = res.headers.get('content-type')?.split(';')[0]?.trim() ?? '';
  const contentType = isSupportedImageContentType(rawCt) ? rawCt : 'image/png';
  const body = await res.arrayBuffer();
  if (body.byteLength === 0) return null;
  return { body, contentType };
}

async function fallbackResponse(): Promise<Response> {
  const local = await readBundledFallback();
  if (local) {
    return new Response(new Uint8Array(local.body), {
      status: 200,
      headers: {
        'Content-Type': local.contentType,
        'Cache-Control': CACHE_HEADER,
      },
    });
  }
  const site = getPublicSiteUrl();
  const remote = await fetchUrlBytes(`${site}/static/share/session.jpg`);
  if (remote) {
    return new Response(remote.body, {
      status: 200,
      headers: {
        'Content-Type': remote.contentType,
        'Cache-Control': CACHE_HEADER,
      },
    });
  }
  return new Response('Not found', { status: 404 });
}

/**
 * Proxies the guided session cover for link-preview scrapers (e.g. WhatsApp) so `og:image`
 * stays on the public site origin with plain image/* responses.
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  const { id } = await context.params;

  if (!isValidGuidedSessionShareId(id)) {
    return fallbackResponse();
  }

  const preview = await fetchGuidedSessionPreview(id);
  if (preview.kind !== 'ok') {
    return fallbackResponse();
  }

  const site = getPublicSiteUrl();
  const upstream =
    preview.coverImageUrlResolved ?? absolutizeSessionCoverUrl(site, preview.coverImageUrl);
  if (!upstream) {
    return fallbackResponse();
  }

  const proxied = await fetchUrlBytes(upstream);
  if (!proxied) {
    return fallbackResponse();
  }

  return new Response(proxied.body, {
    status: 200,
    headers: {
      'Content-Type': proxied.contentType,
      'Cache-Control': CACHE_HEADER,
    },
  });
}
