import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  detectAppDownloadPlatform,
  getAppDownloadRedirectUrl,
  resolveAppDownloadRedirect,
} from './appDownloadRedirect';
import { APP_STORE_URL, PLAY_STORE_URL } from './appLinks';

describe('detectAppDownloadPlatform', () => {
  it('detects iPhone Safari', () => {
    assert.equal(
      detectAppDownloadPlatform(
        'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
      'ios',
    );
  });

  it('detects iPad', () => {
    assert.equal(
      detectAppDownloadPlatform(
        'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      ),
      'ios',
    );
  });

  it('detects Android Chrome', () => {
    assert.equal(
      detectAppDownloadPlatform(
        'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
      ),
      'android',
    );
  });

  it('falls back to other for desktop Chrome', () => {
    assert.equal(
      detectAppDownloadPlatform(
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ),
      'other',
    );
  });

  it('falls back to other when User-Agent is missing', () => {
    assert.equal(detectAppDownloadPlatform(null), 'other');
    assert.equal(detectAppDownloadPlatform(undefined), 'other');
    assert.equal(detectAppDownloadPlatform(''), 'other');
  });
});

describe('getAppDownloadRedirectUrl', () => {
  const siteOrigin = 'https://inigo.now';

  it('redirects iOS to the App Store', () => {
    assert.equal(getAppDownloadRedirectUrl('ios', siteOrigin), APP_STORE_URL);
  });

  it('redirects Android to Google Play', () => {
    assert.equal(getAppDownloadRedirectUrl('android', siteOrigin), PLAY_STORE_URL);
  });

  it('redirects desktop to the homepage store section', () => {
    assert.equal(
      getAppDownloadRedirectUrl('other', siteOrigin),
      'https://inigo.now/en#final-store',
    );
  });

  it('normalizes trailing slash on site origin', () => {
    assert.equal(
      getAppDownloadRedirectUrl('other', 'https://inigo.now/'),
      'https://inigo.now/en#final-store',
    );
  });
});

describe('resolveAppDownloadRedirect', () => {
  it('combines detection and destination resolution', () => {
    assert.equal(
      resolveAppDownloadRedirect(
        'Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 Chrome/120.0.0.0 Mobile Safari/537.36',
        'https://inigo.now',
      ),
      PLAY_STORE_URL,
    );
  });
});
