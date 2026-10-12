import { readFile } from 'node:fs/promises';
import path from 'node:path';
import React from 'react';
import { ImageResponse } from 'next/og';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';

const OG_WIDTH = 1200;
const OG_HEIGHT = 630;
const MAX_RAW_BYTES = 512 * 1024;

const BUNDLED_FILES = new Set(['session.jpg', 'default.jpg']);

export type LinkPreviewBundledFile = 'session.jpg' | 'default.jpg';

export type LinkPreviewImageOptions = {
  cacheControl: string;
  bundledFile: LinkPreviewBundledFile;
  /** Guided-session covers keep the existing 300s data cache. New share covers do not. */
  byteCache: 'revalidate-300' | 'no-store';
};

type SharpFactory = (
  input?: string | Buffer | Uint8Array,
  options?: import('sharp').SharpOptions,
) => import('sharp').Sharp;

function imageResponse(body: Uint8Array, contentType: string, cacheControl: string): Response {
  const headers = new Headers({
    'Content-Type': contentType,
    'Content-Length': String(body.byteLength),
    'Cache-Control': cacheControl,
    'X-Content-Type-Options': 'nosniff',
  });
  return new Response(Buffer.from(body), { status: 200, headers });
}

/** Last resort: no native deps; always 200 + image/png @ 1200×630 (scrapers accept PNG for og:image). */
function syntheticBrandedOgPng(cacheControl: string): Response {
  const response = new ImageResponse(
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
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', cacheControl);
  headers.set('X-Content-Type-Options', 'nosniff');
  return new Response(response.body, { status: 200, headers });
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

async function readBundledFallback(
  bundledFile: LinkPreviewBundledFile,
): Promise<{ body: Buffer; contentType: string } | null> {
  if (!BUNDLED_FILES.has(bundledFile)) return null;
  const filePath = path.join(process.cwd(), 'public', 'static', 'share', bundledFile);
  try {
    const body = await readFile(filePath);
    return { body, contentType: 'image/jpeg' };
  } catch {
    return null;
  }
}

async function fetchUrlBytes(
  url: string,
  byteCache: LinkPreviewImageOptions['byteCache'],
): Promise<{ body: ArrayBuffer; contentType: string } | null> {
  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: { Accept: 'image/*,*/*' },
      redirect: 'follow',
      ...(byteCache === 'no-store' ? { cache: 'no-store' as const } : { next: { revalidate: 300 } }),
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
  if (!sharpFactory) return null;
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
export async function linkPreviewFallbackResponse(options: LinkPreviewImageOptions): Promise<Response> {
  const { cacheControl, bundledFile, byteCache } = options;
  try {
    const local = await readBundledFallback(bundledFile);
    if (local) {
      const jpeg = await toLinkPreviewJpeg(local.body);
      if (jpeg) return imageResponse(jpeg, 'image/jpeg', cacheControl);
      if (local.body.byteLength <= MAX_RAW_BYTES) {
        return imageResponse(new Uint8Array(local.body), local.contentType, cacheControl);
      }
    }
  } catch {
    /* continue */
  }

  try {
    const site = getPublicSiteUrl();
    const remote = await fetchUrlBytes(`${site}/static/share/${bundledFile}`, byteCache);
    if (remote) {
      const jpeg = await toLinkPreviewJpeg(remote.body);
      if (jpeg) return imageResponse(jpeg, 'image/jpeg', cacheControl);
      if (remote.body.byteLength <= MAX_RAW_BYTES) {
        return imageResponse(new Uint8Array(remote.body), remote.contentType, cacheControl);
      }
    }
  } catch {
    /* continue */
  }

  try {
    return syntheticBrandedOgPng(cacheControl);
  } catch {
    const png = new Uint8Array(
      Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
        'base64',
      ),
    );
    return imageResponse(png, 'image/png', cacheControl);
  }
}

export async function respondWithProxiedCover(
  upstream: string | undefined,
  options: LinkPreviewImageOptions,
): Promise<Response> {
  if (!upstream) return linkPreviewFallbackResponse(options);
  const proxied = await fetchUrlBytes(upstream, options.byteCache);
  if (!proxied) return linkPreviewFallbackResponse(options);
  const jpeg = await toLinkPreviewJpeg(proxied.body);
  if (jpeg) return imageResponse(jpeg, 'image/jpeg', options.cacheControl);
  if (proxied.body.byteLength > MAX_RAW_BYTES) return linkPreviewFallbackResponse(options);
  return imageResponse(new Uint8Array(proxied.body), proxied.contentType, options.cacheControl);
}
