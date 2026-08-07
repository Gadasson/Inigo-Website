import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { resolveCoverImagePreview } from '@/lib/studio/coverImagePreview';
import {
  hasGuidedSessionCover,
  isGuidedSessionCoverReady,
  isGuidedSessionMediaBlockingPublish,
  mergeGuidedSessionMediaActivity,
} from '@/lib/studio/guidedSessionMedia';
import { buildGuidedSessionWorkspaceReadiness } from '@/lib/studio/workspaceReadiness';
import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { buildAttachMediaUploadError } from '@/lib/studio/guidedSessionMediaUpload';
import type { PendingMediaAttach } from '@/lib/studio/guidedSessionMediaTypes';

function baseSession(overrides: Partial<StudioGuidedSession> = {}): StudioGuidedSession {
  return {
    id: 1,
    session_id: 'session-test',
    title: 'Test',
    status: 'draft',
    is_available: false,
    ...overrides,
  };
}

function baseForm(overrides: Partial<GuidedSessionEditorForm> = {}): GuidedSessionEditorForm {
  return {
    title: 'Morning breath',
    description: 'A soft morning practice for the body.',
    durationMm: '10',
    durationSs: '00',
    practice: 'breathing',
    focus: 'breath-awareness',
    instructor: 'Creator',
    environment: 'indoor',
    backgroundMusic: 'ambient',
    backgroundMusicCreator: '',
    difficulty: 'beginner',
    language: 'he',
    soundGender: 'female',
    accessTier: 'free',
    tagsText: '',
    timeSuitability: ['anytime'],
    ...overrides,
  };
}

describe('resolveCoverImagePreview', () => {
  it('prefers local pending preview while uploading', () => {
    const preview = resolveCoverImagePreview({
      persistedUrl: 'https://example.com/old.jpg',
      localObjectUrl: 'blob:https://studio/pending',
      hasPendingAttach: false,
      isUploading: true,
    });
    assert.equal(preview.kind, 'local_pending');
    assert.equal(preview.src, 'blob:https://studio/pending');
  });

  it('hides persisted cover when attach is pending without local preview', () => {
    const preview = resolveCoverImagePreview({
      persistedUrl: 'https://example.com/old.jpg',
      localObjectUrl: null,
      hasPendingAttach: true,
      isUploading: false,
    });
    assert.equal(preview.kind, 'none');
    assert.equal(preview.src, null);
  });

  it('shows persisted cover when idle', () => {
    const preview = resolveCoverImagePreview({
      persistedUrl: 'https://example.com/ready.jpg',
      localObjectUrl: null,
      hasPendingAttach: false,
      isUploading: false,
    });
    assert.equal(preview.kind, 'persisted');
    assert.equal(preview.src, 'https://example.com/ready.jpg');
  });
});

describe('cover readiness', () => {
  it('requires thumbnail_optimization_status=ready', () => {
    assert.equal(
      isGuidedSessionCoverReady(
        baseSession({
          thumbnail_url: 'https://example.com/a.jpg',
          thumbnail_optimization_status: null,
        }),
      ),
      false,
    );
    assert.equal(
      hasGuidedSessionCover(
        baseSession({
          thumbnail_url: 'https://example.com/a.jpg',
          thumbnail_optimization_status: 'ready',
        }),
      ),
      true,
    );
  });
});

describe('workspace readiness media gate', () => {
  it('blocks publish while attach is pending even if prior cover is ready', () => {
    const session = baseSession({
      thumbnail_url: 'https://example.com/a.jpg',
      thumbnail_display_url: 'https://example.com/a.display.jpg',
      thumbnail_optimization_status: 'ready',
      audio_url: 'https://example.com/a.mp3',
    });
    const ready = buildGuidedSessionWorkspaceReadiness(session, baseForm());
    assert.equal(ready.publishable, true);

    const blocked = buildGuidedSessionWorkspaceReadiness(session, baseForm(), {
      mediaActivity: { uploading: false, attachPending: true },
    });
    assert.equal(blocked.publishable, false);
    assert.equal(blocked.items.find((item) => item.id === 'cover')?.state, 'waiting');
  });

  it('merges slot activity', () => {
    const merged = mergeGuidedSessionMediaActivity([
      { uploading: true, attachPending: false },
      { uploading: false, attachPending: true },
    ]);
    assert.deepEqual(merged, { uploading: true, attachPending: true });
    assert.equal(isGuidedSessionMediaBlockingPublish(merged), true);
  });
});

describe('attach error pending recovery', () => {
  it('preserves pendingAttach on 401', () => {
    const pending: PendingMediaAttach = {
      sessionId: 12,
      mediaRole: 'thumbnail',
      storageUrl: 'https://firebasestorage.googleapis.com/v0/b/bucket/o/x',
      storagePath: 'guided-sessions/thumbnails/session-test.jpg',
      fileMetadata: { original_filename: 'cover.jpg' },
      originalFileName: 'cover.jpg',
    };
    const err = buildAttachMediaUploadError(new StudioApiError('auth', 401, null), pending);
    assert.equal(err.kind, 'auth');
    assert.equal(err.pendingAttach, pending);
  });
});
