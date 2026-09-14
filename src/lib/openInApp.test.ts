import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { PLAY_STORE_URL } from './appLinks';
import {
  ANDROID_APP_PACKAGE,
  APP_CUSTOM_SCHEME,
  buildAndroidAppLinkIntentUrl,
  buildInigoCustomSchemeUrl,
  resolveOpenInAppHref,
} from './openInApp';

const SESSION_HTTPS = 'https://inigo.now/guided-session/morning-meditation-1';

const ANDROID_UA =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36';

const IOS_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

describe('buildAndroidAppLinkIntentUrl', () => {
  it('targets https App Link host/path with package and Play fallback', () => {
    const intent = buildAndroidAppLinkIntentUrl(SESSION_HTTPS);

    assert.equal(
      intent,
      `intent://inigo.now/guided-session/morning-meditation-1#Intent;scheme=https;package=${ANDROID_APP_PACKAGE};S.browser_fallback_url=${encodeURIComponent(PLAY_STORE_URL)};end`,
    );
  });

  it('preserves query string and allows a custom fallback', () => {
    const intent = buildAndroidAppLinkIntentUrl(
      'https://inigo.now/guided-session/abc?ref=wa',
      'https://example.com/fallback',
    );

    assert.match(intent, /^intent:\/\/inigo\.now\/guided-session\/abc\?ref=wa#Intent;/);
    assert.match(intent, /S\.browser_fallback_url=https%3A%2F%2Fexample\.com%2Ffallback;end$/);
  });
});

describe('buildInigoCustomSchemeUrl', () => {
  it('builds from a site path', () => {
    assert.equal(
      buildInigoCustomSchemeUrl('/guided-session/abc'),
      `${APP_CUSTOM_SCHEME}://guided-session/abc`,
    );
  });

  it('builds from an https URL', () => {
    assert.equal(
      buildInigoCustomSchemeUrl(SESSION_HTTPS),
      `${APP_CUSTOM_SCHEME}://guided-session/morning-meditation-1`,
    );
  });
});

describe('resolveOpenInAppHref', () => {
  it('returns an Intent URL on Android', () => {
    const href = resolveOpenInAppHref(SESSION_HTTPS, ANDROID_UA);
    assert.ok(href.startsWith('intent://'));
    assert.match(href, new RegExp(`package=${ANDROID_APP_PACKAGE}`));
  });

  it('keeps https Universal Links on iOS', () => {
    assert.equal(resolveOpenInAppHref(SESSION_HTTPS, IOS_UA), SESSION_HTTPS);
  });

  it('keeps https for desktop / unknown agents', () => {
    assert.equal(resolveOpenInAppHref(SESSION_HTTPS, null), SESSION_HTTPS);
    assert.equal(
      resolveOpenInAppHref(
        SESSION_HTTPS,
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36',
      ),
      SESSION_HTTPS,
    );
  });
});
