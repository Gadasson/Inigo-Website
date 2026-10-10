import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { describe, it } from 'node:test';
import { CHALLENGES_CAPABILITY, parseStudioAccess } from '@/lib/api/studioBootstrap';
import { shouldLoadStudioArea, studioAreaManageHref, studioHomeView, resolveStudioHomeTab } from '@/lib/studio/studioAreas';
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
  applyChallengeCoverResponse,
  canSubmitChallenge,
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
