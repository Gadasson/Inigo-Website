import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  attachGuidedSessionMedia,
  publishGuidedSession,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { resolveCoverImagePreview } from '@/lib/studio/coverImagePreview';
import {
  isGuidedSessionFieldDisabled,
  LIVE_PATCH_FORBIDDEN_FIELDS,
  studioEditorCapabilities,
} from '@/lib/studio/guidedSessionCapabilities';
import {
  buildGuidedSessionPatch,
  sessionToEditorForm,
  type GuidedSessionEditorForm,
} from '@/lib/studio/guidedSessionEditorForm';
import { buildGuidedSessionStoragePath } from '@/lib/studio/guidedSessionMedia';
import {
  buildLiveGuidedSessionPatch,
  liveAutosaveDecision,
  livePatchContainsForbiddenField,
  livePatchKeysAreAllowlisted,
  livePatchPayloadKey,
} from '@/lib/studio/liveGuidedSessionPatch';
import {
  runLiveReplacementUpload,
  shouldPollMediaReplacement,
} from '@/lib/studio/mediaReplacement';
import type { StudioMediaReplacement } from '@/lib/api/studioGuidedSessions';
import en from '../../../messages/studio.en.json';
import he from '../../../messages/studio.he.json';

function form(overrides: Partial<GuidedSessionEditorForm> = {}): GuidedSessionEditorForm {
  return {
    title: 'Morning breath',
    description: 'A soft morning practice.',
    durationMm: '10',
    durationSs: '00',
    language: 'en',
    soundGender: 'neutral',
    difficulty: 'beginner',
    practice: 'breathing',
    focus: 'love',
    instructor: 'Ada',
    environment: 'indoor',
    backgroundMusic: 'ambient',
    backgroundMusicCreator: '',
    accessTier: 'free',
    tagsText: 'calm',
    timeSuitability: ['anytime'],
    ...overrides,
  };
}

function session(overrides: Partial<StudioGuidedSession> = {}): StudioGuidedSession {
  return {
    id: 4,
    session_id: 'morning-breath',
    title: 'Morning breath',
    description: 'A soft morning practice.',
    status: 'available',
    is_available: true,
    duration: '00:10:00',
    language: 'en',
    sound_gender: 'neutral',
    difficulty: 'beginner',
    primary_category: 'breathing',
    category: 'love',
    sub_categories: ['love'],
    instructor: 'Ada',
    environment: 'indoor',
    background_music: 'ambient',
    background_music_creator: '',
    access_tier: 'free',
    tags: ['calm'],
    time_suitability: ['anytime'],
    thumbnail_url: 'https://cdn.example/cover.jpg',
    ...overrides,
  };
}

function replacement(status: StudioMediaReplacement['status']): StudioMediaReplacement {
  return {
    id: 1,
    generation: 'gen-1',
    media_type: 'video',
    status,
    error: '',
    created_at: null,
    ready_at: null,
    reviewed_at: null,
    rejection_reason: '',
    proposed_duration_seconds: null,
  };
}

describe('session capabilities', () => {
  it('gives a draft full draft editing and no live replacement', () => {
    const caps = studioEditorCapabilities({ status: 'draft', is_available: false });
    assert.equal(caps.canEditDraft, true);
    assert.equal(caps.canEditLiveMetadata, false);
    assert.equal(caps.canReplaceLiveMedia, false);
    assert.equal(caps.canReplaceLiveCover, false);
    assert.equal(isGuidedSessionFieldDisabled('description', caps), false);
    assert.equal(isGuidedSessionFieldDisabled('practice', caps), false);
  });

  it('keeps awaiting initial approval read-only', () => {
    const caps = studioEditorCapabilities({ status: 'available', is_available: false });
    assert.equal(caps.canEditDraft, false);
    assert.equal(caps.canEditLiveMetadata, false);
    assert.equal(caps.canReplaceLiveMedia, false);
    assert.equal(caps.canReplaceLiveCover, false);
    assert.equal(isGuidedSessionFieldDisabled('title', caps), true);
  });

  it('lets a live session edit safe metadata and replace cover and media', () => {
    const caps = studioEditorCapabilities({ status: 'available', is_available: true });
    assert.equal(caps.canEditLiveMetadata, true);
    assert.equal(caps.canReplaceLiveMedia, true);
    assert.equal(caps.canReplaceLiveCover, true);
    assert.equal(caps.canEditDraft, false);
    assert.equal(isGuidedSessionFieldDisabled('title', caps), false);
    assert.equal(isGuidedSessionFieldDisabled('focus', caps), false);
    assert.equal(isGuidedSessionFieldDisabled('description', caps), true);
    assert.equal(isGuidedSessionFieldDisabled('duration', caps), true);
    assert.equal(isGuidedSessionFieldDisabled('language', caps), true);
    assert.equal(isGuidedSessionFieldDisabled('practice', caps), true);
  });

  it('keeps archived sessions read-only', () => {
    const caps = studioEditorCapabilities({ status: 'archived', is_available: false });
    assert.deepEqual(caps, {
      canEditDraft: false,
      canEditLiveMetadata: false,
      canReplaceLiveMedia: false,
      canReplaceLiveCover: false,
    });
  });
});

describe('live patch payload', () => {
  const baseline = form();

  it('patches title only', () => {
    const patch = buildLiveGuidedSessionPatch(form({ title: 'Evening breath' }), baseline);
    assert.deepEqual(patch, { title: 'Evening breath' });
  });

  it('sends only the safe fields that changed', () => {
    const patch = buildLiveGuidedSessionPatch(
      form({
        title: 'Evening breath',
        instructor: 'Noa',
        tagsText: 'calm, night',
        description: 'Do not send this',
      }),
      baseline,
    );
    assert.deepEqual(patch, {
      title: 'Evening breath',
      instructor: 'Noa',
      tags: ['calm', 'night'],
    });
    assert.equal(livePatchKeysAreAllowlisted(patch), true);
  });

  it('never includes read-only or identity fields', () => {
    const patch = buildLiveGuidedSessionPatch(
      form({
        title: 'Changed',
        description: 'New description',
        durationMm: '12',
        durationSs: '30',
        language: 'he',
        practice: 'movement',
        accessTier: 'premium',
        focus: 'stress-relief',
      }),
      baseline,
    );
    for (const key of LIVE_PATCH_FORBIDDEN_FIELDS) {
      assert.equal(Object.hasOwn(patch, key), false, key);
    }
    assert.equal(livePatchContainsForbiddenField(patch), false);
    assert.equal(patch.title, 'Changed');
    assert.deepEqual(patch.sub_category_codes, ['stress-relief']);
    assert.equal(patch.category, 'stress-relief');
    assert.equal(Object.hasOwn(patch, 'instructor'), false);
  });

  it('does not send unchanged safe fields', () => {
    const patch = buildLiveGuidedSessionPatch(form({ soundGender: 'female' }), baseline);
    assert.deepEqual(patch, { sound_gender: 'female' });
  });

  it('reconciles local state from the server response', () => {
    const edited = form({ title: 'Evening breath' });
    const patch = buildLiveGuidedSessionPatch(edited, baseline);
    const saved = sessionToEditorForm(session({ title: 'Evening breath' }));
    assert.equal(patch.title, 'Evening breath');
    assert.equal(saved.title, 'Evening breath');
    assert.deepEqual(buildLiveGuidedSessionPatch(saved, saved), {});
    assert.equal(liveAutosaveDecision(buildLiveGuidedSessionPatch(saved, saved), null), 'skip');
  });

  it('lets focus change without sending primary_category', () => {
    const patch = buildLiveGuidedSessionPatch(form({ focus: 'stress-relief' }), baseline);
    assert.deepEqual(patch.sub_category_codes, ['stress-relief']);
    assert.equal(patch.category, 'stress-relief');
    assert.equal(Object.hasOwn(patch, 'primary_category'), false);
  });

  it('does not send primary_category when practice differs', () => {
    const patch = buildLiveGuidedSessionPatch(form({ practice: 'movement' }), baseline);
    assert.equal(Object.hasOwn(patch, 'primary_category'), false);
    assert.deepEqual(patch, {});
  });
});

describe('live autosave decisions', () => {
  it('saves a dirty safe edit and skips a clean form', () => {
    const dirty = buildLiveGuidedSessionPatch(form({ title: 'Next' }), form());
    assert.equal(liveAutosaveDecision(dirty, null), 'save');
    assert.equal(liveAutosaveDecision({}, null), 'skip');
  });

  it('treats a successful save as clean', () => {
    const saved = sessionToEditorForm(session({ title: 'Next' }));
    assert.equal(liveAutosaveDecision(buildLiveGuidedSessionPatch(saved, saved), null), 'skip');
  });

  it('keeps a failed save recoverable', () => {
    const patch = buildLiveGuidedSessionPatch(form({ title: 'Next' }), form());
    assert.equal(liveAutosaveDecision(patch, null), 'save');
    assert.equal(liveAutosaveDecision(patch, 'some-other-payload'), 'save');
  });

  it('does not retry a live_field_read_only payload', () => {
    const patch = buildLiveGuidedSessionPatch(form({ title: 'Next' }), form());
    const blocked = livePatchPayloadKey(patch);
    assert.equal(liveAutosaveDecision(patch, blocked), 'blocked');
    const next = buildLiveGuidedSessionPatch(form({ title: 'After' }), form());
    assert.equal(liveAutosaveDecision(next, blocked), 'save');
  });
});

describe('live cover', () => {
  it('offers replace cover only on a live session', () => {
    assert.equal(
      studioEditorCapabilities({ status: 'available', is_available: true }).canReplaceLiveCover,
      true,
    );
    assert.equal(
      studioEditorCapabilities({ status: 'available', is_available: false }).canReplaceLiveCover,
      false,
    );
    assert.equal(
      studioEditorCapabilities({ status: 'archived', is_available: true }).canReplaceLiveCover,
      false,
    );
    assert.equal(en.media.buttonReplaceCover, 'Replace cover');
    assert.equal(he.media.buttonReplaceCover, 'החלפת תמונת שער');
    assert.equal(en.editor.liveDetailsNote, "Some session details can't be changed after publishing.");
  });

  it('uses thumbnail attach-media and not media replacement', () => {
    assert.equal(
      buildGuidedSessionStoragePath('morning-breath', 'thumbnail', 'jpg'),
      'guided-sessions/thumbnails/morning-breath.jpg',
    );
    assert.match(attachGuidedSessionMedia.toString(), /attach-media/);
    assert.doesNotMatch(attachGuidedSessionMedia.toString(), /media-replacement/);
    assert.doesNotMatch(
      buildGuidedSessionStoragePath('morning-breath', 'thumbnail', 'jpg'),
      /revisions/,
    );
  });

  it('keeps the current cover during upload and after a failed attach', () => {
    const duringUpload = resolveCoverImagePreview({
      persistedUrl: 'https://cdn.example/cover.jpg',
      localObjectUrl: 'blob:local-file',
      hasPendingAttach: false,
      isUploading: true,
      preservePersistedCover: true,
    });
    assert.equal(duringUpload.kind, 'persisted');
    assert.equal(duringUpload.src, 'https://cdn.example/cover.jpg');

    const failed = resolveCoverImagePreview({
      persistedUrl: 'https://cdn.example/cover.jpg',
      localObjectUrl: 'blob:local-file',
      hasPendingAttach: true,
      isUploading: false,
      preservePersistedCover: true,
    });
    assert.equal(failed.src, 'https://cdn.example/cover.jpg');
  });

  it('shows the new cover after the server reports it', () => {
    const ready = resolveCoverImagePreview({
      persistedUrl: 'https://cdn.example/cover-v2.jpg',
      localObjectUrl: null,
      hasPendingAttach: false,
      isUploading: false,
      preservePersistedCover: true,
    });
    assert.equal(ready.kind, 'persisted');
    assert.equal(ready.src, 'https://cdn.example/cover-v2.jpg');
  });
});

describe('draft and replacement regressions', () => {
  it('still lets a draft patch include description and duration', () => {
    const patch = buildGuidedSessionPatch(
      form({ description: 'Updated', durationMm: '11', durationSs: '05' }),
      form(),
    );
    assert.equal(patch.description, 'Updated');
    assert.equal(patch.duration, '00:11:05');
  });

  it('keeps publish and draft attach on their existing endpoints', () => {
    assert.match(publishGuidedSession.toString(), /\/publish\//);
    assert.match(attachGuidedSessionMedia.toString(), /attach-media/);
    assert.doesNotMatch(publishGuidedSession.toString(), /media-replacement/);
  });

  it('keeps live video and audio replacement on the reserved-path flow', async () => {
    const steps: string[] = [];
    await runLiveReplacementUpload({
      fileName: 'take.mp4',
      mediaType: 'video',
      existing: null,
      onStep: (step) => steps.push(step),
      start: async () => ({
        ...replacement('awaiting_upload'),
        upload_storage_path: 'guided-sessions/revisions/gen-1.mp4',
      }),
      upload: async (path) => {
        assert.equal(path, 'guided-sessions/revisions/gen-1.mp4');
        return 'https://firebasestorage.googleapis.com/v0/b/app/o/reserved';
      },
      attach: async (body) => {
        assert.equal(body.storage_path, 'guided-sessions/revisions/gen-1.mp4');
        return replacement('pending');
      },
    });
    assert.deepEqual(steps, ['start', 'upload', 'attach']);

    const audioSteps: string[] = [];
    await runLiveReplacementUpload({
      fileName: 'take.mp3',
      mediaType: 'audio',
      existing: null,
      onStep: (step) => audioSteps.push(step),
      start: async (body) => {
        assert.equal(body.media_type, 'audio');
        return {
          ...replacement('awaiting_upload'),
          media_type: 'audio',
          upload_storage_path: 'guided-sessions/revisions/gen-1.mp3',
        };
      },
      upload: async () => 'https://firebasestorage.googleapis.com/v0/b/app/o/audio',
      attach: async () => ({ ...replacement('ready_for_review'), media_type: 'audio' }),
    });
    assert.deepEqual(audioSteps, ['start', 'upload', 'attach']);
  });

  it('lets metadata autosave and replacement polling happen together', () => {
    const patch = buildLiveGuidedSessionPatch(form({ title: 'Next' }), form());
    assert.equal(liveAutosaveDecision(patch, null), 'save');
    assert.equal(shouldPollMediaReplacement(replacement('processing')), true);
    assert.equal(shouldPollMediaReplacement(replacement('ready_for_review')), true);
    assert.equal(JSON.stringify(patch).includes('media_replacement'), false);
    assert.equal(JSON.stringify(patch).includes('video_url'), false);
  });
});
