import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { CHALLENGES_CAPABILITY, parseStudioAccess, serverSupportsGratitudeChallengeStep } from '@/lib/api/studioBootstrap';
import { shouldLoadStudioArea, studioAreaManageHref, studioHomeView, resolveStudioHomeTab } from '@/lib/studio/studioAreas';
import {
  addChallengeStep,
  CHALLENGE_PRACTICE_TYPES,
  CHALLENGE_SILENT_MINUTES_MAX,
  CHALLENGE_SILENT_MINUTES_MIN,
  buildChallengeDetailsBody,
  buildChallengeStepsBody,
  buildSessionOptionsPath,
  canReviseApprovedChallenge,
  challengeFormFromServer,
  challengeFormSummary,
  challengeRevisionSaveMethods,
  challengeStepsDirty,
  challengeSaveOutcome,
  challengeSavePlan,
  emptyChallengeForm,
  gratitudeChallengeStep,
  guidedChallengeStep,
  isChallengeDraftEditable,
  isChallengePendingReview,
  moveChallengeStep,
  removeChallengeStep,
  shouldSaveChallengeSteps,
  silentChallengeStep,
  validateChallengeForm,
  applyChallengeActivity,
  applyChallengeCoverResponse,
  canSubmitChallenge,
  challengeSubmitPlan,
  challengeActivity,
  challengeActivitySwitchNeedsConfirm,
  challengeStepsWrite,
  gratitudeEditingBlocked,
  challengeCoverErrorKey,
  challengeCoverFailureKeepsDraft,
  challengeCoverFormData,
  challengeCoverPhase,
  markChallengeCoverRetry,
  patchChallengeDraftVersion,
  takeChallengeCoverRetry,
} from '@/lib/studio/challengeEditor';
import { RECIPE_COVER_MAX_BYTES, validateRecipeCoverMeta } from '@/lib/studio/recipeEditor';

describe('challenge permissions', () => {
  it('opens the challenges area only when enabled and challenges is true', () => {
    const granted = parseStudioAccess({
      studio_access: {
        enabled: true,
        is_studio_creator: false,
        capabilities: { guided_sessions: false, challenges: true },
      },
    });
    assert.equal(shouldLoadStudioArea(CHALLENGES_CAPABILITY, granted), true);
    assert.equal(studioHomeView(granted).showChallengeList, true);
    assert.equal(studioHomeView(granted).showSessionList, false);
    assert.equal(studioHomeView(granted).showNeutralEmpty, false);
    assert.equal(studioHomeView(granted).areas[0]?.createHref, '/studio/challenges/new');
    assert.equal(studioAreaManageHref(CHALLENGES_CAPABILITY), '/studio?tab=challenges');
  });

  it('opens the challenges home tab from the URL for challenges-only and for both capabilities', () => {
    const challengesOnly = parseStudioAccess({
      studio_access: {
        enabled: true,
        capabilities: { guided_sessions: false, challenges: true },
      },
    });
    assert.equal(resolveStudioHomeTab('challenges', challengesOnly), 'challenges');
    assert.equal(resolveStudioHomeTab('sessions', challengesOnly), 'create');
    assert.equal(resolveStudioHomeTab(null, challengesOnly), 'create');

    const both = parseStudioAccess({
      studio_access: {
        enabled: true,
        capabilities: { guided_sessions: true, challenges: true },
      },
    });
    assert.equal(resolveStudioHomeTab('challenges', both), 'challenges');
    assert.equal(resolveStudioHomeTab('sessions', both), 'sessions');
    assert.equal(resolveStudioHomeTab('recipes', both), 'create');

    const sessionsOnly = parseStudioAccess({
      studio_access: {
        enabled: true,
        capabilities: { guided_sessions: true, challenges: false },
      },
    });
    assert.equal(resolveStudioHomeTab('challenges', sessionsOnly), 'create');
    assert.notEqual(studioAreaManageHref(CHALLENGES_CAPABILITY), '/studio/challenges');
  });

  it('does not open challenges from guided sessions, the creator flag, or a legacy server', () => {
    const sessionsOnly = parseStudioAccess({
      studio_access: {
        enabled: true,
        is_studio_creator: true,
        capabilities: { guided_sessions: true, challenges: false },
      },
    });
    assert.equal(shouldLoadStudioArea(CHALLENGES_CAPABILITY, sessionsOnly), false);

    const legacy = parseStudioAccess({
      studio_access: { is_studio_creator: true },
    });
    assert.equal(legacy.contract, 'legacy');
    assert.equal(legacy.capabilities.challenges, false);
    assert.equal(shouldLoadStudioArea(CHALLENGES_CAPABILITY, legacy), false);

    const closed = parseStudioAccess({
      studio_access: {
        enabled: false,
        capabilities: { challenges: true },
      },
    });
    assert.equal(shouldLoadStudioArea(CHALLENGES_CAPABILITY, closed), false);
  });
});

describe('challenge version states', () => {
  it('lets only a draft be edited, and revises an approved version through the existing save calls', () => {
    assert.equal(isChallengeDraftEditable('draft'), true);
    assert.equal(isChallengeDraftEditable('pending_review'), false);
    assert.equal(isChallengePendingReview('pending_review'), true);
    assert.equal(isChallengeDraftEditable('approved'), false);
    assert.equal(canReviseApprovedChallenge('approved'), true);
    assert.equal(canReviseApprovedChallenge('pending_review'), false);
    assert.deepEqual(challengeRevisionSaveMethods(), ['PATCH', 'PUT']);
  });
});

describe('challenge steps and save errors', () => {
  it('requires one title, a valid schedule, and one to five ordered steps', () => {
    const form = emptyChallengeForm();
    assert.equal(validateChallengeForm(form), 'title');
    form.titleHe = 'בוקר';
    form.schedule = 'fixed_weeks';
    form.weekCount = '0';
    assert.equal(validateChallengeForm(form), 'week_count');
    form.weekCount = '2';
    assert.equal(validateChallengeForm(form), null);
    const body = buildChallengeDetailsBody(form);
    assert.equal(body.week_count, 2);
    form.schedule = 'ongoing';
    assert.equal(buildChallengeDetailsBody(form).week_count, null);

    const guided = guidedChallengeStep('g1');
    const withGuided = { ...form, steps: [guided] };
    assert.equal(validateChallengeForm(withGuided), 'guided_session');
    guided.guidedTemplateId = 4;
    assert.equal(validateChallengeForm(withGuided), null);
    assert.deepEqual(buildChallengeStepsBody(withGuided).steps, [
      { kind: 'guided', guided_template_id: 4 },
    ]);
  });

  it('adds, removes, and reorders steps without exceeding five', () => {
    let steps = [silentChallengeStep('a')];
    steps = addChallengeStep(steps, silentChallengeStep('b'));
    steps = addChallengeStep(steps, guidedChallengeStep('c'));
    steps = moveChallengeStep(steps, 2, -1);
    assert.deepEqual(steps.map((step) => step.id), ['a', 'c', 'b']);
    steps = removeChallengeStep(steps, 1);
    assert.deepEqual(steps.map((step) => step.id), ['a', 'b']);
    assert.equal(removeChallengeStep([silentChallengeStep('only')], 0).length, 1);
    let full = [silentChallengeStep('1')];
    for (let index = 2; index <= 6; index += 1) {
      full = addChallengeStep(full, silentChallengeStep(String(index)));
    }
    assert.equal(full.length, 5);
  });

  it('keeps the local edit when only part of the save succeeds', () => {
    const detailsFailed = challengeSaveOutcome({
      detailsDirty: true,
      stepsDirty: true,
      detailsFailed: true,
      stepsFailed: false,
    });
    assert.equal(detailsFailed.complete, false);
    assert.equal(detailsFailed.canSubmit, false);
    assert.equal(detailsFailed.failedPart, 'details');
    assert.equal(
      shouldSaveChallengeSteps({ detailsAttempted: true, detailsFailed: true, stepsDirty: true }),
      false,
    );

    const stepsFailed = challengeSaveOutcome({
      detailsDirty: true,
      stepsDirty: true,
      detailsFailed: false,
      stepsFailed: true,
    });
    assert.equal(stepsFailed.failedPart, 'steps');
    assert.equal(stepsFailed.canSubmit, false);

    const saved = challengeSaveOutcome({
      detailsDirty: true,
      stepsDirty: true,
      detailsFailed: false,
      stepsFailed: false,
    });
    assert.equal(saved.complete, true);
    assert.equal(saved.canSubmit, true);

    const revision = challengeSavePlan({
      mode: 'edit',
      revisingApproved: true,
      detailsDirty: false,
      stepsDirty: false,
    });
    assert.deepEqual(revision, { sendDetails: true, sendSteps: false });
    assert.equal(
      shouldSaveChallengeSteps({ detailsAttempted: true, detailsFailed: true, stepsDirty: true }),
      false,
    );
    assert.equal(
      challengeSaveOutcome({
        detailsDirty: false,
        stepsDirty: false,
        detailsFailed: true,
        stepsFailed: false,
        detailsAttempted: true,
      }).complete,
      false,
    );
  });

  it('rebuilds an editor form from the draft the server still returns after review', () => {
    const form = challengeFormFromServer({
      draft: {
        title_en: 'Morning',
        title_he: 'בוקר',
        description_en: '',
        description_he: '',
        days_per_week: 3,
        schedule: 'fixed_weeks',
        week_count: 2,
      },
      steps: [
        {
          kind: 'guided',
          practice_type: null,
          duration_minutes: null,
          guided_template_id: 1,
          title: 'Morning Sit',
          duration_seconds: 240,
        },
      ],
    });
    assert.equal(form.steps[0]?.guidedTemplateId, 1);
    assert.equal(form.weekCount, '2');
    assert.equal(
      buildSessionOptionsPath({ q: 'Morning', ownerKind: 'platform' }),
      '/api/studio/challenges/session-options/?q=Morning&owner_kind=platform',
    );
  });

  it('summarizes only durations the form already has, in step order', () => {
    const form = emptyChallengeForm();
    form.daysPerWeek = 3;
    form.schedule = 'fixed_weeks';
    form.weekCount = '2';
    form.steps = [
      { ...silentChallengeStep('quiet'), practiceType: 'breathing', durationMinutes: '5' },
      {
        ...guidedChallengeStep('guided'),
        guidedTemplateId: 1,
        guidedTitle: 'Morning Sit',
        guidedDurationSeconds: 600,
      },
      { ...guidedChallengeStep('missing'), guidedTitle: '' },
    ];
    const summary = challengeFormSummary(form);
    assert.deepEqual(summary.practices, [
      { kind: 'silent', practiceType: 'breathing', minutes: 5 },
      { kind: 'guided', title: 'Morning Sit', seconds: 600 },
      { kind: 'guided', title: '', seconds: null },
    ]);
    assert.equal(summary.weekCount, 2);
    const partial = challengeFormSummary({
      ...form,
      steps: [{ ...guidedChallengeStep('partial'), guidedTitle: 'Sit', guidedDurationSeconds: 90 }],
    });
    assert.equal(partial.practices[0]?.kind === 'guided' ? partial.practices[0].seconds : null, 90);

    form.schedule = 'ongoing';
    form.weekCount = '2';
    form.steps[0] = { ...form.steps[0], durationMinutes: '' };
    const ongoing = challengeFormSummary(form);
    assert.equal(ongoing.weekCount, null);
    assert.equal(ongoing.practices[0]?.kind === 'silent' ? ongoing.practices[0].minutes : null, null);
  });
});

describe('dance timer steps', () => {
  const draft = {
    title_en: 'Dance',
    title_he: 'ריקוד',
    description_en: '',
    description_he: '',
    days_per_week: 3,
    schedule: 'ongoing' as const,
    week_count: null,
  };

  function danceForm() {
    const form = emptyChallengeForm();
    form.titleEn = 'Dance';
    form.titleHe = 'ריקוד';
    form.steps = [
      { ...silentChallengeStep('dance'), practiceType: 'dance', durationMinutes: '12' },
    ];
    return form;
  }

  it('keeps dance on the shared timer list and the same 1–180 minute bounds', () => {
    assert.equal(CHALLENGE_SILENT_MINUTES_MIN, 1);
    assert.equal(CHALLENGE_SILENT_MINUTES_MAX, 180);
    assert.ok(CHALLENGE_PRACTICE_TYPES.includes('dance'));
    assert.equal(
      readFileSync('src/components/studio/challenges/ChallengeEditor.tsx', 'utf8').includes(
        'CHALLENGE_PRACTICE_TYPES.map',
      ),
      true,
    );

    const form = danceForm();
    assert.equal(validateChallengeForm(form), null);
    assert.deepEqual(buildChallengeStepsBody(form).steps, [
      { kind: 'silent', practice_type: 'dance', duration_minutes: 12 },
    ]);

    form.steps[0] = { ...form.steps[0], durationMinutes: '1' };
    assert.equal(validateChallengeForm(form), null);
    form.steps[0] = { ...form.steps[0], durationMinutes: '180' };
    assert.equal(validateChallengeForm(form), null);
    assert.deepEqual(buildChallengeStepsBody(form).steps, [
      { kind: 'silent', practice_type: 'dance', duration_minutes: 180 },
    ]);

    const meditation = danceForm();
    meditation.steps[0] = { ...meditation.steps[0], practiceType: 'meditation', durationMinutes: '180' };
    assert.equal(validateChallengeForm(meditation), null);

    for (const minutes of ['0', '181', '']) {
      form.steps[0] = { ...form.steps[0], practiceType: 'dance', durationMinutes: minutes };
      assert.equal(validateChallengeForm(form), 'duration_minutes');
    }
  });

  it('saves, edits, and reloads a single dance step without turning it into meditation', () => {
    const created = danceForm();
    const saved = challengeFormFromServer({
      draft,
      steps: [
        {
          kind: 'silent',
          practice_type: 'dance',
          duration_minutes: 12,
          guided_template_id: null,
          title: null,
          duration_seconds: null,
        },
      ],
    });
    assert.equal(saved.steps[0]?.kind, 'silent');
    assert.equal(saved.steps[0]?.practiceType, 'dance');
    assert.notEqual(saved.steps[0]?.practiceType, 'meditation');
    assert.equal(saved.steps[0]?.durationMinutes, '12');
    assert.equal(validateChallengeForm(saved), null);
    assert.deepEqual(buildChallengeStepsBody(saved).steps, buildChallengeStepsBody(created).steps);
    assert.deepEqual(challengeFormSummary(saved).practices, [
      { kind: 'silent', practiceType: 'dance', minutes: 12 },
    ]);

    const edited = {
      ...saved,
      steps: saved.steps.map((step) => ({ ...step, durationMinutes: '20' })),
    };
    assert.equal(challengeStepsDirty(edited, saved), true);
    assert.deepEqual(buildChallengeStepsBody(edited).steps, [
      { kind: 'silent', practice_type: 'dance', duration_minutes: 20 },
    ]);

    const unknown = challengeFormFromServer({
      draft,
      steps: [
        {
          kind: 'silent',
          practice_type: 'yoga',
          duration_minutes: 5,
          guided_template_id: null,
          title: null,
          duration_seconds: null,
        },
      ],
    });
    assert.equal(unknown.steps[0]?.practiceType, '');
    assert.notEqual(unknown.steps[0]?.practiceType, 'meditation');
    assert.notEqual(unknown.steps[0]?.practiceType, 'dance');
  });

  it('keeps dance inside a mixed step sequence on save and reload', () => {
    const form = danceForm();
    form.steps = [
      { ...silentChallengeStep('dance'), practiceType: 'dance', durationMinutes: '8' },
      { ...silentChallengeStep('breath'), practiceType: 'breathing', durationMinutes: '5' },
      {
        ...guidedChallengeStep('guided'),
        guidedTemplateId: 4,
        guidedTitle: 'Morning Sit',
        guidedDurationSeconds: 600,
      },
    ];
    assert.equal(validateChallengeForm(form), null);
    assert.deepEqual(buildChallengeStepsBody(form).steps, [
      { kind: 'silent', practice_type: 'dance', duration_minutes: 8 },
      { kind: 'silent', practice_type: 'breathing', duration_minutes: 5 },
      { kind: 'guided', guided_template_id: 4 },
    ]);

    const reloaded = challengeFormFromServer({
      draft,
      steps: [
        {
          kind: 'silent',
          practice_type: 'dance',
          duration_minutes: 8,
          guided_template_id: null,
          title: null,
          duration_seconds: null,
        },
        {
          kind: 'silent',
          practice_type: 'breathing',
          duration_minutes: 5,
          guided_template_id: null,
          title: null,
          duration_seconds: null,
        },
        {
          kind: 'guided',
          practice_type: null,
          duration_minutes: null,
          guided_template_id: 4,
          title: 'Morning Sit',
          duration_seconds: 600,
        },
      ],
    });
    assert.deepEqual(
      reloaded.steps.map((step) =>
        step.kind === 'silent'
          ? { kind: step.kind, practiceType: step.practiceType, durationMinutes: step.durationMinutes }
          : { kind: step.kind, guidedTemplateId: step.guidedTemplateId },
      ),
      [
        { kind: 'silent', practiceType: 'dance', durationMinutes: '8' },
        { kind: 'silent', practiceType: 'breathing', durationMinutes: '5' },
        { kind: 'guided', guidedTemplateId: 4 },
      ],
    );
    assert.equal(reloaded.steps[0]?.practiceType, 'dance');
    assert.notEqual(reloaded.steps[0]?.practiceType, 'meditation');
    assert.deepEqual(buildChallengeStepsBody(reloaded).steps, buildChallengeStepsBody(form).steps);
  });

  it('names dance in Hebrew and English on the quiet-step control', () => {
    const he = JSON.parse(readFileSync('messages/studio.he.json', 'utf8')) as {
      challenges: { kindSilentLede: string; practice: Record<string, string> };
    };
    const en = JSON.parse(readFileSync('messages/studio.en.json', 'utf8')) as {
      challenges: { kindSilentLede: string; practice: Record<string, string> };
    };
    assert.equal(he.challenges.practice.dance, 'ריקוד');
    assert.equal(en.challenges.practice.dance, 'Dance');
    assert.match(he.challenges.kindSilentLede, /ריקוד/);
    assert.match(en.challenges.kindSilentLede, /dance/);
    for (const practice of CHALLENGE_PRACTICE_TYPES) {
      assert.ok(he.challenges.practice[practice]);
      assert.ok(en.challenges.practice[practice]);
    }
  });
});

describe('gratitude writing challenges', () => {
  const draft = {
    title_en: 'Thanks',
    title_he: 'הודיה',
    description_en: 'A note',
    description_he: 'הערה',
    days_per_week: 4,
    schedule: 'fixed_weeks' as const,
    week_count: 3,
  };

  function gratitudeForm() {
    const form = applyChallengeActivity(
      {
        ...emptyChallengeForm(),
        titleEn: 'Thanks',
        titleHe: 'הודיה',
        descriptionEn: 'A note',
        descriptionHe: 'הערה',
        daysPerWeek: 4,
        schedule: 'fixed_weeks',
        weekCount: '3',
      },
      'gratitude',
    );
    return form;
  }

  function serverGratitudeStep(durationMinutes: number | null = null, durationSeconds: number | null = null) {
    return {
      kind: 'gratitude' as const,
      practice_type: null,
      duration_minutes: durationMinutes,
      guided_template_id: null,
      title: null,
      duration_seconds: durationSeconds,
    };
  }

  it('saves one gratitude step and keeps the existing day and schedule fields', () => {
    const form = gratitudeForm();
    assert.equal(challengeActivity(form), 'gratitude');
    assert.equal(form.daysPerWeek, 4);
    assert.equal(form.schedule, 'fixed_weeks');
    assert.equal(form.weekCount, '3');
    assert.equal(validateChallengeForm(form), null);
    assert.deepEqual(buildChallengeDetailsBody(form), {
      title_en: 'Thanks',
      title_he: 'הודיה',
      description_en: 'A note',
      description_he: 'הערה',
      days_per_week: 4,
      schedule: 'fixed_weeks',
      week_count: 3,
    });
    assert.deepEqual(buildChallengeStepsBody(form).steps, [{ kind: 'gratitude' }]);
    assert.deepEqual(Object.keys(buildChallengeStepsBody(form).steps[0] ?? {}), ['kind']);
    assert.deepEqual(challengeFormSummary(form).practices, [{ kind: 'gratitude' }]);
  });

  it('does not send practice fields or a zero duration, even if those inputs were filled locally', () => {
    const form = gratitudeForm();
    form.steps[0] = {
      ...form.steps[0],
      practiceType: 'dance',
      durationMinutes: '0',
      guidedTemplateId: 9,
      guidedDurationSeconds: 0,
    };
    assert.equal(validateChallengeForm(form), null);
    assert.equal(JSON.stringify(buildChallengeStepsBody(form).steps[0]), '{"kind":"gratitude"}');
    assert.deepEqual(challengeFormSummary(form).practices, [{ kind: 'gratitude' }]);
    assert.equal('minutes' in (challengeFormSummary(form).practices[0] ?? {}), false);
  });

  it('creates, reloads, edits, and saves a gratitude challenge without turning it into a practice', () => {
    const created = gratitudeForm();
    const loaded = challengeFormFromServer({
      draft,
      steps: [serverGratitudeStep(0, 0)],
    });
    assert.equal(challengeActivity(loaded), 'gratitude');
    assert.equal(loaded.steps[0]?.kind, 'gratitude');
    assert.equal(loaded.steps[0]?.durationMinutes, '');
    assert.equal(loaded.steps[0]?.practiceType, '');
    assert.equal(loaded.steps[0]?.guidedTemplateId, null);
    assert.equal(loaded.daysPerWeek, 4);
    assert.equal(loaded.weekCount, '3');
    assert.equal(validateChallengeForm(loaded), null);
    assert.deepEqual(buildChallengeStepsBody(loaded).steps, buildChallengeStepsBody(created).steps);

    const edited = { ...loaded, titleHe: 'הודיה חדשה', daysPerWeek: 2, weekCount: '6' };
    assert.equal(challengeStepsDirty(edited, loaded), false);
    assert.equal(validateChallengeForm(edited), null);
    assert.deepEqual(buildChallengeStepsBody(edited).steps, [{ kind: 'gratitude' }]);

    const reloaded = challengeFormFromServer({
      draft: { ...draft, title_he: 'הודיה חדשה', days_per_week: 2, week_count: 6 },
      steps: [serverGratitudeStep()],
    });
    assert.equal(reloaded.titleHe, 'הודיה חדשה');
    assert.equal(reloaded.daysPerWeek, 2);
    assert.equal(reloaded.weekCount, '6');
    assert.equal(challengeActivity(reloaded), 'gratitude');
    assert.notEqual(reloaded.steps[0]?.kind, 'silent');
    assert.notEqual(reloaded.steps[0]?.practiceType, 'meditation');
    assert.deepEqual(buildChallengeStepsBody(reloaded).steps, [{ kind: 'gratitude' }]);
  });

  it('rejects a gratitude step mixed with silent or guided steps, including dance', () => {
    const withDance = gratitudeForm();
    withDance.steps = [
      gratitudeChallengeStep('thanks'),
      { ...silentChallengeStep('dance'), practiceType: 'dance', durationMinutes: '8' },
    ];
    assert.equal(validateChallengeForm(withDance), 'gratitude_steps');

    const withGuided = gratitudeForm();
    withGuided.steps = [
      gratitudeChallengeStep('thanks'),
      { ...guidedChallengeStep('guided'), guidedTemplateId: 4 },
    ];
    assert.equal(validateChallengeForm(withGuided), 'gratitude_steps');

    const two = gratitudeForm();
    two.steps = [gratitudeChallengeStep('a'), gratitudeChallengeStep('b')];
    assert.equal(validateChallengeForm(two), 'gratitude_steps');

    const danceOnly = emptyChallengeForm();
    danceOnly.titleHe = 'ריקוד';
    danceOnly.steps = [{ ...silentChallengeStep('dance'), practiceType: 'dance', durationMinutes: '8' }];
    assert.equal(validateChallengeForm(danceOnly), null);
    assert.deepEqual(buildChallengeStepsBody(danceOnly).steps, [
      { kind: 'silent', practice_type: 'dance', duration_minutes: 8 },
    ]);
  });

  it('asks before replacing edited or saved steps, and keeps them until the switch is applied', () => {
    const untouched = emptyChallengeForm();
    untouched.titleHe = 'בוקר';
    assert.equal(
      challengeActivitySwitchNeedsConfirm({ form: untouched, baseline: emptyChallengeForm(), persisted: false }),
      false,
    );
    const toGratitude = applyChallengeActivity(untouched, 'gratitude');
    assert.equal(toGratitude.titleHe, 'בוקר');
    assert.equal(toGratitude.daysPerWeek, untouched.daysPerWeek);
    assert.deepEqual(buildChallengeStepsBody(toGratitude).steps, [{ kind: 'gratitude' }]);
    assert.equal(
      challengeActivitySwitchNeedsConfirm({ form: toGratitude, baseline: untouched, persisted: false }),
      true,
    );

    const edited = emptyChallengeForm();
    edited.steps = [{ ...silentChallengeStep('dance'), practiceType: 'dance', durationMinutes: '12' }];
    assert.equal(
      challengeActivitySwitchNeedsConfirm({ form: edited, baseline: emptyChallengeForm(), persisted: false }),
      true,
    );
    assert.equal(edited.steps[0]?.practiceType, 'dance');
    assert.deepEqual(buildChallengeStepsBody(edited).steps, [
      { kind: 'silent', practice_type: 'dance', duration_minutes: 12 },
    ]);

    const saved = challengeFormFromServer({
      draft,
      steps: [
        {
          kind: 'silent',
          practice_type: 'dance',
          duration_minutes: 12,
          guided_template_id: null,
          title: null,
          duration_seconds: null,
        },
      ],
    });
    assert.equal(challengeActivitySwitchNeedsConfirm({ form: saved, baseline: saved, persisted: true }), true);
    assert.equal(saved.steps[0]?.practiceType, 'dance');
    const replaced = applyChallengeActivity(saved, 'gratitude');
    assert.equal(saved.steps[0]?.practiceType, 'dance');
    assert.equal(replaced.daysPerWeek, saved.daysPerWeek);
    assert.equal(replaced.weekCount, saved.weekCount);
    assert.deepEqual(buildChallengeStepsBody(replaced).steps, [{ kind: 'gratitude' }]);
    assert.equal(
      challengeActivitySwitchNeedsConfirm({ form: replaced, baseline: replaced, persisted: true }),
      true,
    );
  });

  it('withholds gratitude when the step-kind field is missing, and still saves a practice', () => {
    const bootstrap = {
      studio_access: { enabled: true, capabilities: { guided_sessions: true, challenges: true, recipes: false } },
    };
    assert.equal(serverSupportsGratitudeChallengeStep(bootstrap), false);
    assert.equal(parseStudioAccess(bootstrap).capabilities.challenges, true);
    assert.equal(shouldLoadStudioArea(CHALLENGES_CAPABILITY, parseStudioAccess(bootstrap)), true);

    const loaded = challengeFormFromServer({ draft, steps: [serverGratitudeStep(0, 0)] });
    const before = structuredClone(loaded);
    assert.equal(gratitudeEditingBlocked(loaded, false), true);
    assert.deepEqual(challengeStepsWrite(loaded, false), { ok: false, reason: 'gratitude_unsupported' });
    assert.deepEqual(loaded, before);
    assert.equal(loaded.steps[0]?.kind, 'gratitude');
    assert.equal(loaded.titleHe, 'הודיה');
    assert.notEqual(challengeActivity(loaded), 'practice');

    const dance = emptyChallengeForm();
    dance.titleHe = 'ריקוד';
    dance.steps = [{ ...silentChallengeStep('dance'), practiceType: 'dance', durationMinutes: '12' }];
    assert.deepEqual(challengeStepsWrite(dance, false), {
      ok: true,
      steps: [{ kind: 'silent', practice_type: 'dance', duration_minutes: 12 }],
    });
  });

  it('withholds gratitude when the step-kind field is malformed', () => {
    const studioAccess = { enabled: true, capabilities: { challenges: true } };
    const malformed = [
      { studio_access: studioAccess, challenge_capabilities: null },
      { studio_access: studioAccess, challenge_capabilities: 'gratitude' },
      { studio_access: studioAccess, challenge_capabilities: [] },
      { studio_access: studioAccess, challenge_capabilities: { supported_step_kinds: 'gratitude' } },
      { studio_access: studioAccess, challenge_capabilities: { supported_step_kinds: null } },
      { studio_access: studioAccess, challenge_capabilities: { supported_step_kinds: ['silent', 1, 'gratitude'] } },
      { studio_access: studioAccess, challenge_capabilities: { supported_step_kinds: [true] } },
    ];
    for (const bootstrap of malformed) {
      assert.equal(serverSupportsGratitudeChallengeStep(bootstrap), false);
      assert.equal(parseStudioAccess(bootstrap).capabilities.challenges, true);
    }

    const loaded = challengeFormFromServer({ draft, steps: [serverGratitudeStep()] });
    assert.equal(challengeStepsWrite(loaded, false).ok, false);
    assert.equal(loaded.steps[0]?.kind, 'gratitude');
    assert.equal(loaded.descriptionHe, 'הערה');
    assert.equal(loaded.daysPerWeek, 4);
    const practice = emptyChallengeForm();
    practice.titleHe = 'בוקר';
    assert.equal(validateChallengeForm(practice), null);
    assert.equal(challengeStepsWrite(practice, false).ok, true);
  });

  it('withholds gratitude when the supported list has no gratitude kind', () => {
    const bootstrap = {
      studio_access: { enabled: true, capabilities: { challenges: true } },
      challenge_capabilities: { supported_step_kinds: ['silent', 'guided'] },
    };
    assert.equal(serverSupportsGratitudeChallengeStep(bootstrap), false);
    assert.equal(parseStudioAccess(bootstrap).capabilities.challenges, true);

    const loaded = challengeFormFromServer({ draft, steps: [serverGratitudeStep()] });
    assert.equal(gratitudeEditingBlocked(loaded, false), true);
    assert.deepEqual(challengeStepsWrite(loaded, false), { ok: false, reason: 'gratitude_unsupported' });
    assert.equal(loaded.steps[0]?.kind, 'gratitude');
    assert.equal(loaded.weekCount, '3');

    const practice = emptyChallengeForm();
    practice.titleEn = 'Morning';
    practice.steps = [
      { ...silentChallengeStep('breath'), practiceType: 'breathing', durationMinutes: '5' },
      { ...guidedChallengeStep('guided'), guidedTemplateId: 4 },
    ];
    assert.deepEqual(challengeStepsWrite(practice, false), {
      ok: true,
      steps: [
        { kind: 'silent', practice_type: 'breathing', duration_minutes: 5 },
        { kind: 'guided', guided_template_id: 4 },
      ],
    });
  });

  it('allows a gratitude draft when the server lists gratitude, even if the exposure gate is closed', () => {
    const bootstrap = {
      studio_access: { enabled: true, capabilities: { guided_sessions: false, challenges: true } },
      challenge_capabilities: { supported_step_kinds: ['silent', 'guided', 'gratitude'] },
      remote_config: {
        feature_gates: {
          gratitude_challenge_enabled: { enabled: false, required_tier: 'free', paywall_mode: 'none' },
        },
      },
    };
    assert.equal(serverSupportsGratitudeChallengeStep(bootstrap), true);
    const access = parseStudioAccess(bootstrap);
    assert.equal(access.enabled, true);
    assert.equal(access.capabilities.challenges, true);
    assert.equal(shouldLoadStudioArea(CHALLENGES_CAPABILITY, access), true);
    assert.equal(Object.hasOwn(access.capabilities, 'gratitude'), false);

    const withoutStudio = {
      challenge_capabilities: { supported_step_kinds: ['gratitude'] },
      remote_config: { feature_gates: { gratitude_challenge_enabled: { enabled: true } } },
    };
    assert.equal(serverSupportsGratitudeChallengeStep(withoutStudio), true);
    assert.equal(parseStudioAccess(withoutStudio).enabled, false);
    assert.equal(parseStudioAccess(withoutStudio).capabilities.challenges, false);
    assert.equal(shouldLoadStudioArea(CHALLENGES_CAPABILITY, parseStudioAccess(withoutStudio)), false);

    const ready = {
      mode: 'edit' as const,
      status: 'draft',
      dirty: false,
      coverPending: false,
      coverUploading: false,
      coverFailed: false,
    };
    assert.equal(challengeSubmitPlan({ ...ready, gratitudeBlocked: true }).send, false);
    assert.equal(challengeSubmitPlan({ ...ready, gratitudeBlocked: false }).send, true);
    assert.equal(challengeSubmitPlan({ ...ready, dirty: true, gratitudeBlocked: false }).send, false);
    assert.equal(challengeSubmitPlan({ ...ready, coverPending: true, gratitudeBlocked: false }).send, false);
    assert.equal(challengeSubmitPlan({ ...ready, status: 'pending_review', gratitudeBlocked: false }).send, false);
    assert.equal(
      challengeSubmitPlan({ ...ready, mode: 'create', gratitudeBlocked: false }).send,
      false,
    );
    const editorSource = readFileSync('src/components/studio/challenges/ChallengeEditor.tsx', 'utf8');
    const guardAt = editorSource.indexOf('if (busyRef.current || !submitPlan.send) return;');
    const requestAt = editorSource.indexOf('submitStudioChallenge(');
    assert.ok(guardAt >= 0 && requestAt > guardAt);
    assert.match(editorSource, /disabled=\{busy \|\| !submitPlan\.send\}/);
    assert.match(editorSource, /id="challenge-gratitude-unsupported"/);

    const form = gratitudeForm();
    assert.equal(gratitudeEditingBlocked(form, true), false);
    const write = challengeStepsWrite(form, true);
    assert.deepEqual(write, { ok: true, steps: [{ kind: 'gratitude' }] });
    assert.equal(write.ok ? JSON.stringify(write.steps[0]) : '', '{"kind":"gratitude"}');
  });

  it('names gratitude writing in Hebrew and English and keeps dance on the quiet step', () => {
    const he = JSON.parse(readFileSync('messages/studio.he.json', 'utf8')) as {
      challenges: Record<string, string> & { practice: Record<string, string>; issue: Record<string, string> };
    };
    const en = JSON.parse(readFileSync('messages/studio.en.json', 'utf8')) as {
      challenges: Record<string, string> & { practice: Record<string, string>; issue: Record<string, string> };
    };
    assert.equal(he.challenges.activityGratitude, 'כתיבת הודיה');
    assert.equal(en.challenges.activityGratitude, 'Gratitude writing');
    assert.equal(
      he.challenges.gratitudeLede,
      'כתיבת הודיה באיניגו מזכה יום באתגר. אין צורך לשתף אותה בקהילה.',
    );
    assert.match(en.challenges.gratitudeLede, /Writing gratitude in Inigo/);
    assert.equal(he.challenges.issue.gratitude_steps.length > 0, true);
    assert.equal(en.challenges.issue.gratitude_steps.length > 0, true);
    assert.equal(he.challenges.gratitudeUnsupported, 'השרת אינו תומך בעריכת אתגר כתיבת הודיה.');
    assert.equal(en.challenges.gratitudeUnsupported, 'This server does not support editing a gratitude-writing challenge.');
    assert.equal(he.challenges.practice.dance, 'ריקוד');
    assert.equal(en.challenges.practice.dance, 'Dance');

    const editor = readFileSync('src/components/studio/challenges/ChallengeEditor.tsx', 'utf8');
    assert.match(editor, /id="challenge-activity-gratitude"/);
    assert.match(editor, /aria-describedby="challenge-activity-gratitude-lede"/);
    assert.match(editor, /practice\.kind === 'gratitude'/);
    assert.match(editor, /challengeActivitySwitchNeedsConfirm/);
    assert.match(editor, /gratitudeStepSupported/);
    assert.match(editor, /challengeStepsWrite/);
    assert.match(editor, /gratitudeUnsupported/);
    assert.match(editor, /CHALLENGE_PRACTICE_TYPES\.map/);
  });
});

describe('challenge cover', () => {
  it('keeps a cover optional and out of the regular write body', () => {
    const form = emptyChallengeForm();
    form.titleHe = 'בוקר';
    assert.equal(validateChallengeForm(form), null);
    const body = buildChallengeDetailsBody(form);
    assert.equal('cover_url' in body, false);
    assert.equal('cover_storage_path' in body, false);
    assert.equal(
      canSubmitChallenge({
        status: 'draft',
        dirty: false,
        coverPending: false,
        coverUploading: false,
        coverFailed: false,
      }),
      true,
    );
  });

  it('posts the image as multipart and leaves content type to the browser', () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'cover.jpg', { type: 'image/jpeg' });
    const body = challengeCoverFormData(file);
    assert.equal(body.get('image'), file);
    assert.equal(body.has('cover_url'), false);
    assert.equal(body.has('cover_storage_path'), false);
    assert.equal(validateRecipeCoverMeta({ mimeType: 'image/jpeg', sizeBytes: RECIPE_COVER_MAX_BYTES + 1 }), 'size');
  });

  it('keeps the new challenge id when the cover upload fails', () => {
    const retry = challengeCoverFailureKeepsDraft(41);
    assert.equal(retry.challengeId, 41);
    assert.equal(retry.createAnother, false);
    const storage = new Map<string, string>();
    const memory = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
    };
    markChallengeCoverRetry(41, memory);
    assert.equal(takeChallengeCoverRetry(41, memory), true);
    assert.equal(takeChallengeCoverRetry(41, memory), false);
    assert.equal(
      canSubmitChallenge({
        status: 'draft',
        dirty: false,
        coverPending: false,
        coverUploading: false,
        coverFailed: true,
      }),
      false,
    );
  });

  it('keeps local edits and adopts the draft opened by a cover upload', () => {
    const local = emptyChallengeForm();
    local.titleHe = 'עריכה שעוד לא נשמרה';
    local.steps = [silentChallengeStep('local-step')];
    const applied = applyChallengeCoverResponse(local, {
      id: 9,
      version_number: 2,
      status: 'draft',
      cover_url: 'https://storage.example/cover.jpg',
      cover_storage_path: 'challenges/4/covers/a.jpg',
    });
    assert.equal(applied.form.titleHe, 'עריכה שעוד לא נשמרה');
    assert.equal(applied.form.steps[0]?.id, 'local-step');
    assert.equal(applied.version.versionId, 9);
    assert.equal(applied.version.versionNumber, 2);
    assert.equal(applied.version.status, 'draft');
    assert.equal(applied.version.coverUrl, 'https://storage.example/cover.jpg');

    const patched = patchChallengeDraftVersion(
      {
        id: 3,
        version_number: 1,
        status: 'approved' as const,
        title_he: 'ישן',
        cover_url: null,
        cover_storage_path: null,
      },
      {
        id: 9,
        version_number: 2,
        status: 'draft',
        cover_url: 'https://storage.example/cover.jpg',
        cover_storage_path: 'challenges/4/covers/a.jpg',
      },
    );
    assert.equal(patched.title_he, 'ישן');
    assert.equal(patched.id, 9);
    assert.equal(patched.version_number, 2);
    assert.equal(patched.status, 'draft');
    assert.equal(patched.cover_storage_path, 'challenges/4/covers/a.jpg');
  });

  it('blocks submit while a cover is uploading, pending, or failed, and locks review', () => {
    assert.equal(isChallengePendingReview('pending_review'), true);
    assert.equal(isChallengeDraftEditable('pending_review'), false);
    assert.equal(canReviseApprovedChallenge('pending_review'), false);
    assert.equal(
      canSubmitChallenge({
        status: 'pending_review',
        dirty: false,
        coverPending: false,
        coverUploading: false,
        coverFailed: false,
      }),
      false,
    );
    assert.equal(
      canSubmitChallenge({
        status: 'draft',
        dirty: false,
        coverPending: true,
        coverUploading: false,
        coverFailed: false,
      }),
      false,
    );
    assert.equal(
      canSubmitChallenge({
        status: 'draft',
        dirty: false,
        coverPending: false,
        coverUploading: true,
        coverFailed: false,
      }),
      false,
    );
    assert.equal(challengeCoverPhase({ hasLocalFile: true, uploading: false, failed: false, hasCoverUrl: true }), 'pending');
    assert.equal(challengeCoverPhase({ hasLocalFile: true, uploading: true, failed: false, hasCoverUrl: false }), 'uploading');
    assert.equal(challengeCoverPhase({ hasLocalFile: false, uploading: false, failed: false, hasCoverUrl: true }), 'uploaded');
    assert.equal(challengeCoverPhase({ hasLocalFile: true, uploading: false, failed: true, hasCoverUrl: false }), 'failed');
    assert.equal(challengeCoverErrorKey({ reasonCode: 'cover_upload_failed', field: null }), 'coverUpload');
    assert.equal(challengeCoverErrorKey({ reasonCode: 'validation_failed', field: 'image' }), 'image');
    assert.equal(challengeCoverErrorKey({ reasonCode: 'version_not_editable', field: null }), 'versionNotEditable');
    assert.equal(challengeCoverErrorKey({ reasonCode: 'not_owner', field: null }), 'permission');
    const untouched = challengeSavePlan({
      mode: 'edit',
      revisingApproved: false,
      detailsDirty: false,
      stepsDirty: false,
    });
    assert.deepEqual(untouched, { sendDetails: false, sendSteps: false });
    assert.equal(challengeCoverErrorKey({ reasonCode: 'permission_denied', field: null }), 'permission');
  });

  it('explains the optional cover in Hebrew and English', () => {
    const he = JSON.parse(readFileSync('messages/studio.he.json', 'utf8')) as {
      challenges: { coverLede: string; coverPhase: Record<string, string>; coverPublicNote: string };
    };
    const en = JSON.parse(readFileSync('messages/studio.en.json', 'utf8')) as {
      challenges: { coverLede: string; coverPhase: Record<string, string>; coverPublicNote: string };
    };
    assert.equal(he.challenges.coverLede, 'אפשר להוסיף תמונה שתיתן לאתגר אופי. בלי תמונה, איניגו תציג איור מתאים.');
    assert.equal(
      en.challenges.coverLede,
      'You can add an image that gives the challenge a character. Without an image, Inigo will show a suitable illustration.',
    );
    assert.deepEqual(Object.values(he.challenges.coverPhase), ['טרם הועלה', 'מעלה', 'הועלה', 'העלאה נכשלה']);
    assert.equal(en.challenges.coverPhase.pending, 'Not uploaded yet');
    assert.equal(en.challenges.coverPhase.failed, 'Upload failed');
    assert.match(he.challenges.coverPublicNote, /אחרי אישור הגרסה החדשה/);
    assert.match(en.challenges.coverPublicNote, /after the new version is approved/);
  });
});
