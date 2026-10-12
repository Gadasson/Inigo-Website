import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { mock } from 'node:test';
import { describe, it } from 'node:test';
import { APP_STORE_URL, PLAY_STORE_URL } from './appLinks';
import { shouldBypassLocale } from './localeBypass';
import { ANDROID_APP_PACKAGE, resolveOpenInAppHref } from './openInApp';
import {
  buildPublicContentMetadata,
  classifyPublicContentResponse,
  CONTENT_UNAVAILABLE_NOW_TITLE,
  fetchPublicContentPreview,
  GENERIC_SHARE_DESCRIPTION,
  GENERIC_SHARE_TITLE,
  PUBLIC_CONTENT_OG_CACHE,
  PUBLIC_CONTENT_PREVIEW_TIMEOUT_MS,
  PUBLIC_SHARE_INSTALL_NOTE,
  publicContentPreviewEndpoint,
  publicContentPreviewRequestInit,
  publicContentShareCopy,
  resolvePublicContentOpenUrl,
  sanitizeAcceptLanguage,
} from './publicContentShare';

const SITE = 'https://inigo.now';
const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const EXISTING_AASA_PATHS = [
  '/e/*',
  '/s/*',
  '/event/*',
  '/spot/*',
  '/guided-session/*',
  '/guided-sessions/*',
  '/m/*',
  '/moment/*',
  '/i/*',
];

function jsonResponse(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('public content ids and open targets', () => {
  it('accepts positive integer ids and rejects slugs, zero, and junk', () => {
    assert.equal(resolvePublicContentOpenUrl(SITE, 'recipe', '42'), 'https://inigo.now/recipe/42');
    assert.equal(resolvePublicContentOpenUrl(SITE, 'challenge', '7'), 'https://inigo.now/challenge/7');
    assert.equal(resolvePublicContentOpenUrl(SITE, 'recipe', '0'), 'https://inigo.now/en');
    assert.equal(resolvePublicContentOpenUrl(SITE, 'recipe', '01'), 'https://inigo.now/en');
    assert.equal(resolvePublicContentOpenUrl(SITE, 'challenge', 'morning-oats'), 'https://inigo.now/en');
    assert.equal(resolvePublicContentOpenUrl(SITE, 'challenge', '../studio'), 'https://inigo.now/en');
  });

  it('keeps the existing https universal link on iOS and the shared Android intent on Android', () => {
    const recipe = 'https://inigo.now/recipe/42';
    const challenge = 'https://inigo.now/challenge/7';
    assert.equal(resolveOpenInAppHref(recipe, IOS_UA), recipe);
    assert.equal(resolveOpenInAppHref(challenge, IOS_UA), challenge);
    const intent = resolveOpenInAppHref(recipe, ANDROID_UA);
    assert.match(intent, /^intent:\/\/inigo\.now\/recipe\/42#Intent;/);
    assert.match(intent, new RegExp(`package=${ANDROID_APP_PACKAGE}`));
  });
});

describe('classifyPublicContentResponse', () => {
  it('shows an approved recipe title, description, and cover', () => {
    const result = classifyPublicContentResponse('recipe', 200, 'application/json', {
      title: 'Morning oats',
      short_description: 'A quiet bowl.\nServes two.',
      cover_image_url: 'https://cdn.example/oats.jpg',
      status: 'approved',
    });
    assert.equal(result.kind, 'ok');
    if (result.kind !== 'ok') return;
    assert.equal(result.title, 'Morning oats');
    assert.equal(result.shortDescription, 'A quiet bowl.\nServes two.');
    assert.equal(result.coverImageUrl, 'https://cdn.example/oats.jpg');
  });

  it('accepts a wrapped public preview', () => {
    const result = classifyPublicContentResponse('challenge', 200, 'application/json', {
      challenge: {
        name: 'Seven quiet mornings',
        description: 'A week of short sits.',
        status: 'published',
      },
    });
    assert.equal(result.kind, 'ok');
    if (result.kind !== 'ok') return;
    assert.equal(result.title, 'Seven quiet mornings');
    assert.equal(result.shortDescription, 'A week of short sits.');
  });

  it('treats JSON 404, 403, and 410 as unavailable and drops any title', () => {
    for (const status of [404, 403, 410]) {
      const result = classifyPublicContentResponse('recipe', status, 'application/json', {
        title: 'Secret draft',
        error: 'not_found',
      });
      assert.equal(result.kind, 'unavailable');
      assert.equal(JSON.stringify(result).includes('Secret draft'), false);
    }
  });

  it('treats an HTML 404 as a finished unavailable state and drops any embedded title', () => {
    const result = classifyPublicContentResponse(
      'recipe',
      404,
      'text/html; charset=utf-8',
      '<html><title>Secret draft</title></html>',
    );
    assert.equal(result.kind, 'error');
    assert.equal(JSON.stringify(result).includes('Secret draft'), false);
    const copy = publicContentShareCopy('recipe', result);
    assert.equal(copy.title, CONTENT_UNAVAILABLE_NOW_TITLE);
    assert.equal(/did not load|try again|loading/i.test(`${copy.title} ${copy.description}`), false);

    const htmlOk = classifyPublicContentResponse(
      'recipe',
      200,
      'text/html',
      { title: 'Secret draft' },
    );
    assert.equal(htmlOk.kind, 'error');
    assert.equal(JSON.stringify(htmlOk).includes('Secret draft'), false);
  });

  it('reads the public preview shape and ignores a null cover', () => {
    const result = classifyPublicContentResponse('recipe', 200, 'application/json', {
      type: 'recipe',
      id: 1,
      title: 'Warm oats',
      description: 'A short breakfast.',
      display_language: 'he',
      image_url: 'https://cdn.example/oats.jpg',
      cover_image_url: null,
      canonical_url: 'https://inigo.now/recipe/1',
    });
    assert.equal(result.kind, 'ok');
    if (result.kind !== 'ok') return;
    assert.equal(result.coverImageUrl, 'https://cdn.example/oats.jpg');
    assert.equal(result.displayLanguage, 'he');
  });

  it('hides a closed gate and an archived row without their titles', () => {
    const closed = classifyPublicContentResponse('recipe', 403, 'application/json', {
      error: 'feature_disabled',
      title: 'Secret draft',
    });
    const archived = classifyPublicContentResponse('challenge', 404, 'application/json', {
      error: 'archived',
      title: 'Old challenge',
    });
    assert.equal(closed.kind, 'unavailable');
    assert.equal(archived.kind, 'unavailable');
    assert.equal(JSON.stringify(closed).includes('Secret'), false);
    assert.equal(JSON.stringify(archived).includes('Old challenge'), false);
  });

  it('hides drafts, archived rows, flag-off payloads, and studio documents', () => {
    const cases = [
      { title: 'Secret draft', status: 'draft' },
      { title: 'Waiting', status: 'pending_review' },
      { title: 'Old soup', status: 'approved', archived_at: '2026-01-01T00:00:00Z' },
      { title: 'Hidden', status: 'approved', feature_enabled: false },
      { title: 'Off', sharing_enabled: false },
      { id: 4, draft: { title_en: 'Secret draft' }, published: null, published_version_id: null },
    ];
    for (const body of cases) {
      const result = classifyPublicContentResponse('recipe', 200, 'application/json', body);
      assert.equal(result.kind, 'unavailable');
      assert.equal(JSON.stringify(result).includes('Secret'), false);
      assert.equal(JSON.stringify(result).includes('Hidden'), false);
      assert.equal(JSON.stringify(result).includes('Old soup'), false);
    }
  });
});

describe('fetchPublicContentPreview', () => {
  it('does not call the network for an invalid id', async () => {
    mock.method(globalThis, 'fetch', () => {
      throw new Error('fetch should not be called');
    });
    try {
      const result = await fetchPublicContentPreview('challenge', 'not-an-id');
      assert.deepEqual(result, { kind: 'unavailable' });
    } finally {
      mock.restoreAll();
    }
  });

  it('calls the public preview route without credentials and without storing the response', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    mock.method(globalThis, 'fetch', async (url: string | URL, init?: RequestInit) => {
      calls.push({ url: String(url), init });
      return jsonResponse(404, { error: 'not_found', title: 'Secret draft' });
    });
    try {
      const result = await fetchPublicContentPreview('recipe', '42');
      assert.equal(result.kind, 'unavailable');
      assert.equal(JSON.stringify(result).includes('Secret'), false);
      assert.equal(calls.length, 1);
      assert.equal(calls[0]?.url, publicContentPreviewEndpoint('recipe', '42'));
      assert.equal(calls[0]?.url.includes('/api/studio/'), false);
      assert.equal(calls[0]?.init?.cache, 'no-store');
      assert.equal(calls[0]?.init?.credentials, 'omit');
      const headers = calls[0]?.init?.headers as Record<string, string>;
      assert.deepEqual(headers, { Accept: 'application/json' });
      assert.equal(publicContentPreviewRequestInit().cache, 'no-store');
      assert.equal(sanitizeAcceptLanguage('he-IL,he;q=0.9'), 'he-IL,he;q=0.9');
      assert.equal(sanitizeAcceptLanguage('he\r\nX-Injected: 1'), undefined);
      assert.equal(
        (publicContentPreviewRequestInit('he').headers as Record<string, string>)['Accept-Language'],
        'he',
      );
    } finally {
      mock.restoreAll();
    }
  });

  it('forwards Accept-Language and still omits credentials', async () => {
    let seen: RequestInit | undefined;
    mock.method(globalThis, 'fetch', async (_url: string | URL, init?: RequestInit) => {
      seen = init;
      return jsonResponse(200, {
        type: 'recipe',
        id: 1,
        title: 'בדיקה',
        description: 'תיאור',
        display_language: 'he',
        image_url: 'https://cdn.example/oats.jpg',
        cover_image_url: null,
      });
    });
    try {
      const result = await fetchPublicContentPreview('recipe', '1', 'he-IL,he;q=0.9');
      assert.equal(result.kind, 'ok');
      if (result.kind === 'ok') assert.equal(result.displayLanguage, 'he');
      const headers = seen?.headers as Record<string, string>;
      assert.equal(headers['Accept-Language'], 'he-IL,he;q=0.9');
      assert.equal(headers.Authorization, undefined);
      assert.equal(seen?.credentials, 'omit');
      assert.equal(seen?.cache, 'no-store');
    } finally {
      mock.restoreAll();
    }
  });
});

describe('share metadata', () => {
  it('emits title, description, canonical URL, and cover proxy for available content', () => {
    const meta = buildPublicContentMetadata(SITE, 'recipe', '42', {
      kind: 'ok',
      title: 'Morning oats',
      shortDescription: 'A quiet bowl.\nServes two.',
      coverImageUrl: 'https://cdn.example/oats.jpg',
    });
    assert.equal(meta.title, 'Morning oats — Inigo');
    assert.equal(meta.description, 'A quiet bowl. Serves two.');
    assert.equal(meta.alternates?.canonical, 'https://inigo.now/recipe/42');
    assert.equal(meta.openGraph?.url, 'https://inigo.now/recipe/42');
    const images = meta.openGraph?.images as { url: string }[];
    assert.equal(images[0]?.url, 'https://inigo.now/api/og/recipe/42');
    assert.equal(meta.robots && typeof meta.robots === 'object' && 'index' in meta.robots && meta.robots.index, true);
  });

  it('uses generic metadata when content is missing, archived, or the flag is off', () => {
    const meta = buildPublicContentMetadata(SITE, 'challenge', '9', { kind: 'unavailable' });
    const serialized = JSON.stringify(meta);
    assert.equal(meta.title, GENERIC_SHARE_TITLE);
    assert.equal(meta.description, GENERIC_SHARE_DESCRIPTION);
    assert.equal(serialized.includes('Secret draft'), false);
    const images = meta.openGraph?.images as { url: string }[];
    assert.equal(images[0]?.url, 'https://inigo.now/static/share/default.jpg');
    assert.equal(meta.robots && typeof meta.robots === 'object' && 'index' in meta.robots && meta.robots.index, false);
    assert.equal(PUBLIC_CONTENT_OG_CACHE, 'no-store');
  });

  it('uses generic metadata when the preview cannot be loaded', () => {
    const meta = buildPublicContentMetadata(SITE, 'recipe', '42', { kind: 'error' });
    const serialized = JSON.stringify(meta);
    assert.equal(meta.title, GENERIC_SHARE_TITLE);
    assert.equal(meta.description, GENERIC_SHARE_DESCRIPTION);
    assert.equal(serialized.includes('Secret draft'), false);
    assert.equal(serialized.includes('Morning oats'), false);
    const images = meta.openGraph?.images as { url: string }[];
    assert.equal(images[0]?.url, 'https://inigo.now/static/share/default.jpg');
  });

  it('uses the public default image when an available preview has no cover', () => {
    const meta = buildPublicContentMetadata(SITE, 'challenge', '8', {
      kind: 'ok',
      title: 'A quiet week',
      shortDescription: 'Short sits.',
    });
    const images = meta.openGraph?.images as { url: string }[];
    assert.equal(images[0]?.url, 'https://inigo.now/static/share/default.jpg');
  });
});

describe('preview transport failures', () => {
  it('finishes non-JSON, HTTP failure, and timeout as content unavailable now', async () => {
    const secret = 'Secret draft title';

    mock.method(globalThis, 'fetch', async () => {
      return new Response(`<html><title>${secret}</title><h1>${secret}</h1></html>`, {
        status: 404,
        headers: { 'content-type': 'text/html; charset=utf-8' },
      });
    });
    try {
      const htmlMiss = await fetchPublicContentPreview('recipe', '42');
      assert.equal(htmlMiss.kind, 'error');
      assert.equal(JSON.stringify(htmlMiss).includes(secret), false);
      const htmlMeta = buildPublicContentMetadata(SITE, 'recipe', '42', htmlMiss);
      assert.equal(JSON.stringify(htmlMeta).includes(secret), false);
      assert.equal(
        (htmlMeta.openGraph?.images as { url: string }[])[0]?.url,
        'https://inigo.now/static/share/default.jpg',
      );
      assert.equal(publicContentShareCopy('recipe', htmlMiss).title, CONTENT_UNAVAILABLE_NOW_TITLE);
    } finally {
      mock.restoreAll();
    }

    mock.method(globalThis, 'fetch', async (_url: string | URL, init?: RequestInit) => {
      assert.ok(init?.signal);
      assert.equal(init?.signal?.aborted, false);
      assert.equal(PUBLIC_CONTENT_PREVIEW_TIMEOUT_MS > 0, true);
      return new Response('upstream blew up', {
        status: 502,
        headers: { 'content-type': 'text/plain' },
      });
    });
    try {
      const httpFailure = await fetchPublicContentPreview('challenge', '7');
      assert.equal(httpFailure.kind, 'error');
      assert.equal(publicContentShareCopy('challenge', httpFailure).title, CONTENT_UNAVAILABLE_NOW_TITLE);
      const meta = buildPublicContentMetadata(SITE, 'challenge', '7', httpFailure);
      assert.equal(meta.title, GENERIC_SHARE_TITLE);
      assert.equal(
        (meta.openGraph?.images as { url: string }[])[0]?.url,
        'https://inigo.now/static/share/default.jpg',
      );
    } finally {
      mock.restoreAll();
    }

    mock.method(globalThis, 'fetch', async () => {
      throw Object.assign(new Error('The operation was aborted due to timeout'), { name: 'TimeoutError' });
    });
    try {
      const timedOut = await fetchPublicContentPreview('recipe', '1');
      assert.equal(timedOut.kind, 'error');
      assert.equal(JSON.stringify(timedOut).includes(secret), false);
      assert.equal(publicContentShareCopy('recipe', timedOut).title, CONTENT_UNAVAILABLE_NOW_TITLE);
      const meta = buildPublicContentMetadata(SITE, 'recipe', '1', timedOut);
      assert.equal(meta.title, GENERIC_SHARE_TITLE);
      assert.equal(meta.description, GENERIC_SHARE_DESCRIPTION);
      assert.equal(JSON.stringify(meta).includes(secret), false);
      assert.equal(
        (meta.openGraph?.images as { url: string }[])[0]?.url,
        'https://inigo.now/static/share/default.jpg',
      );
    } finally {
      mock.restoreAll();
    }
  });
});

describe('default share image', () => {
  it('ships /static/share/default.jpg as a JPEG the metadata can name', () => {
    const bytes = readFileSync('public/static/share/default.jpg');
    assert.ok(bytes.byteLength > 32);
    assert.equal(bytes[0], 0xff);
    assert.equal(bytes[1], 0xd8);
    assert.equal(bytes[2], 0xff);
  });
});

describe('share page copy', () => {
  it('names available content and keeps the existing install note', () => {
    const copy = publicContentShareCopy('recipe', {
      kind: 'ok',
      title: 'Morning oats',
      shortDescription: 'A quiet bowl.',
    });
    assert.equal(copy.title, 'Morning oats');
    assert.equal(copy.description, 'A quiet bowl.');
    assert.match(PUBLIC_SHARE_INSTALL_NOTE, /return to this link/);
    assert.equal(/after you install|saved for later|join this|start (the )?(practice|session)/i.test(PUBLIC_SHARE_INSTALL_NOTE), false);
    assert.equal(APP_STORE_URL.includes('apps.apple.com'), true);
    assert.equal(PLAY_STORE_URL.includes('id=now.inigo.app'), true);
  });

  it('uses an unavailable message and does not invent a title', () => {
    const copy = publicContentShareCopy('challenge', { kind: 'unavailable' });
    assert.equal(copy.title, 'This challenge is not available');
    assert.equal(copy.description.includes('Secret'), false);
  });
});

describe('locale bypass and association files', () => {
  it('keeps existing share paths and adds recipe and challenge', () => {
    for (const path of ['/e/78', '/s/1', '/event/2', '/spot/3', '/m/4', '/moment/4', '/i/code', '/guided-session/abc', '/guided-sessions/abc']) {
      assert.equal(shouldBypassLocale(path), true, path);
    }
    assert.equal(shouldBypassLocale('/recipe/42'), true);
    assert.equal(shouldBypassLocale('/challenge/7'), true);
    assert.equal(shouldBypassLocale('/about'), false);
    assert.equal(shouldBypassLocale('/studio/recipes'), true);
  });

  it('adds recipe and challenge to the website AASA without changing the app id or older paths', () => {
    const wellKnown = JSON.parse(readFileSync('public/.well-known/apple-app-site-association', 'utf8'));
    const legacy = JSON.parse(readFileSync('public/apple-app-site-association', 'utf8'));
    assert.deepEqual(wellKnown, legacy);
    const detail = wellKnown.applinks.details[0];
    assert.deepEqual(detail.appIDs, ['5D7CFYURW8.now.inigo.app']);
    for (const path of [...EXISTING_AASA_PATHS, '/recipe/*', '/challenge/*']) {
      assert.equal(detail.paths.includes(path), true, path);
    }
  });

  it('leaves assetlinks on domain-wide handle_all_urls', () => {
    const assetlinks = JSON.parse(readFileSync('public/.well-known/assetlinks.json', 'utf8'));
    assert.equal(assetlinks.length, 1);
    assert.deepEqual(assetlinks[0].relation, ['delegate_permission/common.handle_all_urls']);
    assert.equal(assetlinks[0].target.namespace, 'android_app');
    assert.equal(assetlinks[0].target.package_name, 'now.inigo.app');
    assert.equal(Array.isArray(assetlinks[0].target.sha256_cert_fingerprints), true);
    assert.equal(JSON.stringify(assetlinks).includes('/recipe/'), false);
  });
});
