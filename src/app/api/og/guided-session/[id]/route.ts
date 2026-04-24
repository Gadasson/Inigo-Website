import { readFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { ImageResponse } from 'next/og';

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

const MAX_RAW_BYTES = 512 * 1024;

function imageResponse(body: Uint8Array, contentType: string): Response {
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Length': String(body.byteLength),
    'Cache-Control': CACHE_HEADER,
    'X-Content-Type-Options': 'nosniff',
  });
  return new Response(Buffer.from(body), { status: 200, headers });
}

/** Last resort: no native deps; always 200 + image/png @ 1200×630 (scrapers accept PNG for og:image). */
function syntheticBrandedOgPng(): Response {
  return new ImageResponse(
    React.createElement(
      'div',
      {
        style: {
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(145deg, #1a3d28 0%, #3d6b47 55%, #5a8f6a 100%)',
          color: '#f5faf6',
          fontSize: 52,
          fontWeight: 600,
          letterSpacing: '-0.02em',
          fontFamily:
            'ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
        },
      },
      'inigo',
    ),
    { width: OG_WIDTH, height: OG_HEIGHT },
  );
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
  try {
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
  } catch {
    return null;
  }
}

/** `sharp` is CommonJS `export =`; runtime may expose `default` or the callable itself. */
type SharpFactory = (
  input?: string | Buffer | Uint8Array,
  options?: import('sharp').SharpOptions,
) => import('sharp').Sharp;

/**
 * Resize/re-encode using sharp only via dynamic import so a broken native binary
 * never crashes route module load (avoids HTTP 500 on Vercel).
 */
async function toLinkPreviewJpeg(imageBytes: ArrayBuffer | Buffer): Promise<Uint8Array | null> {
  let sharpFactory: SharpFactory | null = null;
  try {
    const mod = (await import('sharp')) as { default?: SharpFactory };
    sharpFactory = mod.default ?? (mod as unknown as SharpFactory);
  } catch {
    return null;
  }
  if (!sharpFactory) {
    return null;
  }
  const input = Buffer.isBuffer(imageBytes) ? imageBytes : Buffer.from(imageBytes);
  try {
    const buf = await sharpFactory(input, {
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

/** Always HTTP 200 with an image body — never 404/500 for link-preview crawlers. */
async function fallbackResponse(): Promise<Response> {
  try {
    const local = await readBundledFallback();
    if (local) {
      const jpeg = await toLinkPreviewJpeg(local.body);
      if (jpeg) {
        return imageResponse(jpeg, 'image/jpeg');
      }
      if (local.body.byteLength <= MAX_RAW_BYTES) {
        return imageResponse(new Uint8Array(local.body), local.contentType);
      }
    }
  } catch {
    /* continue */
  }

  try {
    const site = getPublicSiteUrl();
    const remote = await fetchUrlBytes(`${site}/static/share/session.jpg`);
    if (remote) {
      const jpeg = await toLinkPreviewJpeg(remote.body);
      if (jpeg) {
        return imageResponse(jpeg, 'image/jpeg');
      }
      if (remote.body.byteLength <= MAX_RAW_BYTES) {
        return imageResponse(new Uint8Array(remote.body), remote.contentType);
      }
    }
  } catch {
    /* continue */
  }

  try {
    return syntheticBrandedOgPng();
  } catch {
    const png = new Uint8Array(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    );
    return imageResponse(png, 'image/png');
  }
}

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
      return await fallbackResponse();
    }

    const preview = await fetchGuidedSessionPreview(id);
    if (preview.kind !== 'ok') {
      return await fallbackResponse();
    }

    const site = getPublicSiteUrl();
    const upstream =
      preview.coverImageUrlResolved ?? absolutizeSessionCoverUrl(site, preview.coverImageUrl);
    if (!upstream) {
      return await fallbackResponse();
    }

    const proxied = await fetchUrlBytes(upstream);
    if (!proxied) {
      return await fallbackResponse();
    }

    const jpeg = await toLinkPreviewJpeg(proxied.body);
    if (jpeg) {
      return imageResponse(jpeg, 'image/jpeg');
    }

    if (proxied.body.byteLength > MAX_RAW_BYTES) {
      return await fallbackResponse();
    }

    return imageResponse(new Uint8Array(proxied.body), proxied.contentType);
  } catch {
    return await fallbackResponse();
  }
}
