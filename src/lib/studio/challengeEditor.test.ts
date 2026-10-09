import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { CHALLENGES_CAPABILITY, parseStudioAccess } from '@/lib/api/studioBootstrap';
import { shouldLoadStudioArea, studioHomeView } from '@/lib/studio/studioAreas';
import {
  addChallengeStep,
  buildChallengeDetailsBody,
  buildChallengeStepsBody,
  buildSessionOptionsPath,
  canReviseApprovedChallenge,
  challengeFormFromServer,
  challengeFormSummary,
  challengeRevisionSaveMethods,
  challengeSaveOutcome,
  challengeSavePlan,
  emptyChallengeForm,
  guidedChallengeStep,
  isChallengeDraftEditable,
  isChallengePendingReview,
  moveChallengeStep,
  removeChallengeStep,
  shouldSaveChallengeSteps,
  silentChallengeStep,
  validateChallengeForm,
} from '@/lib/studio/challengeEditor';

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
