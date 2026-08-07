import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { StudioApiError } from '@/lib/api/studioApiClient';
import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import {
  buildGuidedSessionPatch,
  createDefaultGuidedSessionForm,
  sessionToEditorForm,
  type GuidedSessionEditorForm,
} from '@/lib/studio/guidedSessionEditorForm';
import { getStudioApiFieldErrors } from '@/lib/studio/parseStudioApiError';
import {
  defaultTimeSuitability,
  normalizeTimeSuitability,
  TIME_SUITABILITY_ORDER,
  timeSuitabilityEqual,
  toggleTimeSuitabilityValue,
} from '@/lib/studio/timeSuitability';
import en from '../../../messages/studio.en.json';
import he from '../../../messages/studio.he.json';

function baseSession(overrides: Partial<StudioGuidedSession> = {}): StudioGuidedSession {
  return {
    id: 1,
    session_id: 'session-test',
    title: 'Test',
    status: 'draft',
    is_available: false,
    description: 'A soft morning practice for the body.',
    duration: '00:10:00',
    language: 'en',
    sound_gender: 'neutral',
    difficulty: 'beginner',
    primary_category: 'breathing',
    sub_categories: ['breath-awareness'],
    instructor: 'Creator',
    environment: 'indoor',
    background_music: 'ambient',
    access_tier: 'free',
    tags: [],
    ...overrides,
  };
}

function baseForm(overrides: Partial<GuidedSessionEditorForm> = {}): GuidedSessionEditorForm {
  return {
    ...createDefaultGuidedSessionForm('Creator'),
    title: 'Morning breath',
    description: 'A soft morning practice for the body.',
    practice: 'breathing',
    focus: 'breath-awareness',
    ...overrides,
  };
}

describe('normalizeTimeSuitability', () => {
  it('defaults new / missing values to Anytime', () => {
    assert.deepEqual(normalizeTimeSuitability(undefined), ['anytime']);
    assert.deepEqual(normalizeTimeSuitability(null), ['anytime']);
    assert.deepEqual(normalizeTimeSuitability([]), ['anytime']);
    assert.deepEqual(normalizeTimeSuitability('morning'), ['anytime']);
  });

  it('keeps canonical specific windows in order and drops duplicates', () => {
    assert.deepEqual(
      normalizeTimeSuitability(['evening', 'morning', 'morning', 'late_night']),
      ['morning', 'evening', 'late_night'],
    );
  });

  it('collapses anytime with specifics to anytime only', () => {
    assert.deepEqual(
      normalizeTimeSuitability(['morning', 'anytime', 'evening']),
      ['anytime'],
    );
  });

  it('drops malformed values safely', () => {
    assert.deepEqual(
      normalizeTimeSuitability(['morning', 12, 'nope', null, 'midday']),
      ['morning', 'midday'],
    );
    assert.deepEqual(normalizeTimeSuitability(['bogus']), ['anytime']);
  });

  it('preserves canonical option order for rendering', () => {
    assert.deepEqual([...TIME_SUITABILITY_ORDER], [
      'anytime',
      'morning',
      'midday',
      'evening',
      'late_night',
    ]);
  });
});

describe('toggleTimeSuitabilityValue', () => {
  it('selecting Anytime clears specifics', () => {
    assert.deepEqual(
      toggleTimeSuitabilityValue(['morning', 'evening'], 'anytime'),
      ['anytime'],
    );
  });

  it('selecting a specific window clears Anytime', () => {
    assert.deepEqual(toggleTimeSuitabilityValue(['anytime'], 'morning'), ['morning']);
  });

  it('allows multiple specific windows', () => {
    assert.deepEqual(
      toggleTimeSuitabilityValue(['morning'], 'evening'),
      ['morning', 'evening'],
    );
  });

  it('restores Anytime when the last specific window is removed', () => {
    assert.deepEqual(toggleTimeSuitabilityValue(['morning'], 'morning'), ['anytime']);
  });

  it('never returns an empty array', () => {
    assert.deepEqual(toggleTimeSuitabilityValue([], 'anytime'), ['anytime']);
    assert.notEqual(toggleTimeSuitabilityValue(['midday'], 'midday').length, 0);
  });
});

describe('guided session form integration', () => {
  it('new session defaults to Anytime', () => {
    const form = createDefaultGuidedSessionForm();
    assert.deepEqual(form.timeSuitability, defaultTimeSuitability());
  });

  it('existing API value initializes correctly', () => {
    const form = sessionToEditorForm(
      baseSession({ time_suitability: ['evening', 'morning'] }),
    );
    assert.deepEqual(form.timeSuitability, ['morning', 'evening']);
  });

  it('missing legacy API value displays Anytime', () => {
    const form = sessionToEditorForm(baseSession({ time_suitability: undefined }));
    assert.deepEqual(form.timeSuitability, ['anytime']);
  });

  it('create/edit patch sends normalized time_suitability when changed', () => {
    const baseline = baseForm({ timeSuitability: ['anytime'] });
    const form = baseForm({ timeSuitability: ['morning', 'midday'] });
    const patch = buildGuidedSessionPatch(form, baseline);
    assert.deepEqual(patch.time_suitability, ['morning', 'midday']);
  });

  it('unrelated partial form changes do not reset time_suitability', () => {
    const baseline = baseForm({
      title: 'Morning breath',
      timeSuitability: ['morning', 'evening'],
    });
    const form = baseForm({
      title: 'Morning breath updated',
      timeSuitability: ['morning', 'evening'],
    });
    const patch = buildGuidedSessionPatch(form, baseline);
    assert.equal(patch.time_suitability, undefined);
    assert.equal(patch.title, 'Morning breath updated');
    assert.ok(timeSuitabilityEqual(form.timeSuitability, baseline.timeSuitability));
  });

  it('server-normalized response is reflected via sessionToEditorForm', () => {
    const form = sessionToEditorForm(
      baseSession({ time_suitability: ['anytime', 'morning'] }),
    );
    assert.deepEqual(form.timeSuitability, ['anytime']);
  });

  it('field validation errors render locally for time_suitability', () => {
    const error = new StudioApiError('Bad request', 400, {
      time_suitability: ['Invalid time_suitability value(s): "noon".'],
    });
    const fieldErrors = getStudioApiFieldErrors(error);
    assert.equal(
      fieldErrors.time_suitability,
      'Invalid time_suitability value(s): "noon".',
    );
    assert.equal(fieldErrors.title, undefined);
  });
});

describe('time suitability localization', () => {
  it('English labels render correctly', () => {
    assert.equal(en.fields.timeSuitability, 'Suitable times');
    assert.match(en.fields.timeSuitabilityHelper, /invitation during the day/);
    assert.equal(en.options.timeSuitabilityAnytime, 'Anytime');
    assert.equal(en.options.timeSuitabilityMorning, 'Morning');
    assert.equal(en.options.timeSuitabilityMidday, 'Midday');
    assert.equal(en.options.timeSuitabilityEvening, 'Evening');
    assert.equal(en.options.timeSuitabilityLateNight, 'Late night');
  });

  it('Hebrew labels are present for RTL Studio', () => {
    assert.equal(he.fields.timeSuitability, 'זמנים מתאימים');
    assert.match(he.fields.timeSuitabilityHelper, /הזמנה רלוונטית/);
    assert.equal(he.options.timeSuitabilityAnytime, 'בכל זמן');
    assert.equal(he.options.timeSuitabilityMorning, 'בוקר');
    assert.equal(he.options.timeSuitabilityMidday, 'אמצע היום');
    assert.equal(he.options.timeSuitabilityEvening, 'ערב');
    assert.equal(he.options.timeSuitabilityLateNight, 'לילה מאוחר');
  });
});
