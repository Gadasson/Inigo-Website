import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isPracticeStartMmSsEmpty,
  isValidPracticeStartSeconds,
  parseSessionDurationSeconds,
  practiceStartMmSsToSeconds,
  practiceStartSecondsFromPlayer,
  practiceStartSecondsToMmSsParts,
  practiceStartServerField,
} from '@/lib/studio/practiceStartOffset';
import { LIVE_SAFE_EDIT_FIELDS } from '@/lib/studio/guidedSessionCapabilities';
import en from '../../../messages/studio.en.json';
import he from '../../../messages/studio.he.json';

describe('practiceStartOffset', () => {
  it('maps media kind to the matching server field', () => {
    assert.equal(practiceStartServerField('audio'), 'practice_start_audio_seconds');
    assert.equal(practiceStartServerField('video'), 'practice_start_video_seconds');
  });

  it('treats empty mm:ss as null for save', () => {
    assert.equal(isPracticeStartMmSsEmpty('', ''), true);
    assert.equal(isPracticeStartMmSsEmpty('  ', ''), true);
    assert.equal(practiceStartMmSsToSeconds('', ''), null);
    assert.equal(practiceStartMmSsToSeconds('', '00'), 0);
    assert.equal(practiceStartMmSsToSeconds('1', '30'), 90);
  });

  it('formats whole seconds for the editor', () => {
    assert.deepEqual(practiceStartSecondsToMmSsParts(null), { mm: '', ss: '' });
    assert.deepEqual(practiceStartSecondsToMmSsParts(0), { mm: '00', ss: '00' });
    assert.deepEqual(practiceStartSecondsToMmSsParts(75), { mm: '01', ss: '15' });
  });

  it('reads the floor of the player position', () => {
    assert.equal(practiceStartSecondsFromPlayer({ currentTime: 12.9 }), 12);
    assert.equal(practiceStartSecondsFromPlayer(null), null);
  });

  it('rejects offsets at or past the session duration', () => {
    assert.equal(parseSessionDurationSeconds('00:08:00'), 480);
    assert.equal(isValidPracticeStartSeconds(null, 480), true);
    assert.equal(isValidPracticeStartSeconds(0, 480), true);
    assert.equal(isValidPracticeStartSeconds(479, 480), true);
    assert.equal(isValidPracticeStartSeconds(480, 480), false);
  });

  it('keeps practice start offsets in the live safe edit allowlist', () => {
    assert.ok(LIVE_SAFE_EDIT_FIELDS.includes('practice_start_audio_seconds'));
    assert.ok(LIVE_SAFE_EDIT_FIELDS.includes('practice_start_video_seconds'));
  });

  it('exposes Hebrew and English studio copy', () => {
    assert.equal(he.media.practiceStartLabel, 'תחילת התרגול');
    assert.equal(he.media.practiceStartFromPlayer, 'להגדיר לפי המיקום בנגן');
    assert.equal(en.media.practiceStartLabel, 'Practice start');
    assert.equal(en.media.practiceStartFromPlayer, 'Set from player position');
  });
});
