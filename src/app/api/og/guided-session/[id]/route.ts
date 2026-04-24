import { readFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

import {
  absolutizeSessionCoverUrl,
  fetchGuidedSessionPreview,
  isValidGuidedSessionShareId,
} from '@/lib/guidedSessionPreview';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';

export const runtime = 'nodejs';

const CACHE_HEADER = 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;

function imageResponse(body: Uint8Array, contentType: string): Response {
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Length': String(body.byteLength),
    'Cache-Control': CACHE_HEADER,
    'X-Content-Type-Options': 'nosniff',
  });
  return new Response(Buffer.from(body), { status: 200, headers });
}

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

/** Re-encode for link previews: small JPEG at 1200×630 (WhatsApp rejects multi‑MB originals). */
async function toLinkPreviewJpeg(imageBytes: ArrayBuffer): Promise<Uint8Array | null> {
  try {
    const buf = await sharp(Buffer.from(imageBytes), {
      failOn: 'none',
      limitInputPixels: false,
    })
      .rotate()
      .resize(OG_WIDTH, OG_HEIGHT, { fit: 'cover', position: 'centre' })
      .jpeg({ quality: 80, mozjpeg: true, chromaSubsampling: '4:2:0' })
      .toBuffer();
    return new Uint8Array(buf);
  } catch {
    return null;
  }
}

async function fallbackResponse(): Promise<Response> {
  const local = await readBundledFallback();
  if (local) {
    const body = new Uint8Array(local.body);
    return imageResponse(body, local.contentType);
  }
  const site = getPublicSiteUrl();
  const remote = await fetchUrlBytes(`${site}/static/share/session.jpg`);
  if (remote) {
    const jpeg = await toLinkPreviewJpeg(remote.body);
    if (jpeg) {
      return imageResponse(jpeg, 'image/jpeg');
    }
    return imageResponse(new Uint8Array(remote.body), remote.contentType);
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

  const jpeg = await toLinkPreviewJpeg(proxied.body);
  if (jpeg) {
    return imageResponse(jpeg, 'image/jpeg');
  }

  /** Never return multi‑MB originals to link-preview crawlers (WhatsApp drops them). */
  const maxRawBytes = 512 * 1024;
  if (proxied.body.byteLength > maxRawBytes) {
    return fallbackResponse();
  }

  return imageResponse(new Uint8Array(proxied.body), proxied.contentType);
}
