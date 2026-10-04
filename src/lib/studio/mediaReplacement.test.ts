import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  attachGuidedSessionMedia,
  publishGuidedSession,
  retryGuidedSessionVideoOptimization,
  type StudioMediaReplacement,
} from '@/lib/api/studioGuidedSessions';
import { buildGuidedSessionStoragePath, validateGuidedSessionMediaFile } from '@/lib/studio/guidedSessionMedia';
import {
  isDraftEditorEditable,
  studioSessionPhase,
} from '@/lib/studio/guidedSessionPhase';
import { guidedSessionStatusLabel } from '@/lib/studio/guidedSessionStatus';
import {
  canContinueReservedUpload,
  canRetryFailedReplacement,
  creatorSafeReplacementError,
  fileMatchesReservedPath,
  livePrimaryMediaType,
  replacementActivity,
  replacementConflictAction,
  replacementExposesPlaybackUrl,
  retryReplacementBody,
  runLiveReplacementUpload,
  shouldPollDraftVideoOptimization,
  shouldPollMediaReplacement,
  shouldRefreshSessionAfterPromotion,
  showsVideoOptimizationCopy,
  ReplacementFlowError,
} from '@/lib/studio/mediaReplacement';
import en from '../../../messages/studio.en.json';
import he from '../../../messages/studio.he.json';

function replacement(
  overrides: Partial<StudioMediaReplacement> = {},
): StudioMediaReplacement {
  return {
    id: 9,
    generation: 'gen-1',
    media_type: 'video',
    status: 'awaiting_upload',
    error: '',
    created_at: '2026-10-04T00:00:00Z',
    ready_at: null,
    reviewed_at: null,
    rejection_reason: '',
    proposed_duration_seconds: null,
    upload_storage_path: 'guided-sessions/revisions/gen-1.mp4',
    ...overrides,
  };
}

function file(name: string, type: string): File {
  return new File([new Uint8Array([1, 2, 3])], name, { type });
}

describe('session phase', () => {
  it('keeps the draft editor editable only for drafts', () => {
    assert.equal(isDraftEditorEditable('draft'), true);
    assert.equal(isDraftEditorEditable('available'), false);
    assert.equal(isDraftEditorEditable('archived'), false);
    assert.equal(studioSessionPhase({ status: 'draft', is_available: false }), 'draft');
  });

  it('labels awaiting initial approval separately from live', () => {
    assert.equal(
      studioSessionPhase({ status: 'available', is_available: false }),
      'awaiting_approval',
    );
    assert.equal(guidedSessionStatusLabel('available', false), 'Awaiting review');
    assert.equal(en.sessions.statusAwaitingApproval, 'Awaiting review');
    assert.equal(en.status.awaitingApproval, 'Awaiting review');
  });

  it('treats an available and available session as live', () => {
    assert.equal(
      studioSessionPhase({ status: 'available', is_available: true }),
      'live',
    );
    assert.equal(guidedSessionStatusLabel('available', true), 'Live');
    assert.equal(en.sessions.statusLive, 'Live');
    assert.notEqual(en.sessions.statusLive, en.sessions.statusAwaitingApproval);
  });
});

describe('live replacement presentation', () => {
  it('shows the current video as the live primary while a replacement exists', () => {
    const role = livePrimaryMediaType({
      video_url: 'https://cdn.example/live.mp4',
      audio_url: null,
      has_video: true,
      has_audio: false,
    });
    assert.equal(role, 'video');
    assert.equal(en.replacement.currentVideo, 'Current video');
    assert.equal(en.replacement.liveBadge, 'Live');
    assert.equal(
      replacementActivity(replacement({ status: 'ready_for_review' }), role),
      'awaiting_review',
    );
  });

  it('offers Replace video for a live video session', () => {
    assert.equal(en.replacement.replaceVideo, 'Replace video');
    assert.equal(en.replacement.replaceAudio, 'Replace audio');
  });

  it('offers Replace audio for a live audio session', () => {
    assert.equal(
      livePrimaryMediaType({
        video_url: null,
        audio_url: 'https://cdn.example/live.mp3',
        has_video: false,
        has_audio: true,
      }),
      'audio',
    );
  });

  it('rejects a file that would switch media type', () => {
    const audioOnVideo = validateGuidedSessionMediaFile(file('take.mp3', 'audio/mpeg'), 'video');
    const videoOnAudio = validateGuidedSessionMediaFile(file('take.mp4', 'video/mp4'), 'audio');
    assert.equal(audioOnVideo?.code, 'videoFile');
    assert.equal(videoOnAudio?.code, 'audioFormat');
    assert.equal(replacementConflictAction('media_role_mismatch'), 'validation');
  });

  it('shows awaiting review without a proposed playback url', () => {
    const payload = replacement({
      status: 'ready_for_review',
      upload_storage_path: undefined,
      proposed_duration_seconds: 84,
    });
    assert.equal(replacementActivity(payload, 'video'), 'awaiting_review');
    assert.equal(replacementExposesPlaybackUrl(payload), false);
    assert.equal(
      en.replacement.awaitingReviewBody,
      'Your current approved version remains available until the new version is approved.',
    );
    assert.equal(en.replacement.awaitingReviewVideo, 'New video awaiting review');
    assert.doesNotMatch(JSON.stringify(en.replacement), /MediaRevision|generation|worker/i);
  });

  it('keeps a rejected replacement from looking like session rejection', () => {
    const sessionPhase = studioSessionPhase({ status: 'available', is_available: true });
    const activity = replacementActivity(
      replacement({
        status: 'rejected',
        rejection_reason: 'Use a quieter take.',
        upload_storage_path: undefined,
      }),
      'video',
    );
    assert.equal(sessionPhase, 'live');
    assert.equal(activity, 'rejected');
    assert.equal(en.replacement.rejectedTitle, 'Replacement not approved');
    assert.match(en.replacement.rejectedBody, /still live/i);
    assert.match(en.replacement.rejectedReason, /\{reason\}/);
  });

  it('hides implementation-level processing errors', () => {
    assert.equal(creatorSafeReplacementError('ffmpeg failed: traceback'), null);
    assert.equal(creatorSafeReplacementError('The source file was unreadable.'), 'The source file was unreadable.');
    assert.equal(en.replacement.failedTitle, 'Video processing failed');
  });
});

describe('replacement upload sequencing', () => {
  it('starts the replacement before upload and attaches the reserved path', async () => {
    const steps: string[] = [];
    const reserved = 'guided-sessions/revisions/gen-9.mp4';
    const draftPath = buildGuidedSessionStoragePath('session-1', 'video', 'mp4');
    let progress = 0;

    const { result, storagePath } = await runLiveReplacementUpload({
      fileName: 'session.mp4',
      mediaType: 'video',
      existing: null,
      onStep: (step) => steps.push(step),
      onProgress: (percent) => {
        progress = percent;
      },
      start: async (body) => {
        steps.push(`start:${body.extension}:${body.media_type}`);
        return replacement({
          generation: 'gen-9',
          upload_storage_path: reserved,
        });
      },
      upload: async (path, onProgress) => {
        assert.equal(path, reserved);
        assert.notEqual(path, draftPath);
        assert.equal(path.includes('.source.'), false);
        onProgress(37);
        return 'https://firebasestorage.googleapis.com/v0/b/app/o/reserved';
      },
      attach: async (body) => {
        assert.deepEqual(body, {
          generation: 'gen-9',
          storage_path: reserved,
          storage_url: 'https://firebasestorage.googleapis.com/v0/b/app/o/reserved',
        });
        return replacement({ status: 'pending', upload_storage_path: undefined, generation: 'gen-9' });
      },
    });

    assert.deepEqual(steps, ['start', 'start:mp4:video', 'upload', 'attach']);
    assert.equal(storagePath, reserved);
    assert.equal(progress, 37);
    assert.equal(result.status, 'pending');
  });

  it('does not attach when the browser upload fails, and can resume the same reservation', async () => {
    let attaches = 0;
    await assert.rejects(
      () =>
        runLiveReplacementUpload({
          fileName: 'session.mp4',
          mediaType: 'video',
          existing: null,
          start: async () =>
            replacement({
              generation: 'gen-keep',
              upload_storage_path: 'guided-sessions/revisions/gen-keep.mp4',
            }),
          upload: async () => {
            throw new Error('network');
          },
          attach: async () => {
            attaches += 1;
            return replacement();
          },
        }),
      /network/,
    );
    assert.equal(attaches, 0);

    const steps: string[] = [];
    await runLiveReplacementUpload({
      fileName: 'session.mp4',
      mediaType: 'video',
      existing: replacement({
        generation: 'gen-keep',
        status: 'awaiting_upload',
        upload_storage_path: 'guided-sessions/revisions/gen-keep.mp4',
      }),
      onStep: (step) => steps.push(step),
      start: async () => {
        throw new Error('should not start again');
      },
      upload: async (path) => {
        assert.equal(path, 'guided-sessions/revisions/gen-keep.mp4');
        return 'https://firebasestorage.googleapis.com/v0/b/app/o/kept';
      },
      attach: async (body) => {
        assert.equal(body.generation, 'gen-keep');
        assert.equal(body.storage_path, 'guided-sessions/revisions/gen-keep.mp4');
        return replacement({ status: 'pending' });
      },
    });
    assert.deepEqual(steps, ['upload', 'attach']);
    assert.equal(canContinueReservedUpload(replacement()), true);
    assert.equal(
      fileMatchesReservedPath('other.mov', 'guided-sessions/revisions/gen-keep.mp4'),
      false,
    );
  });

  it('refuses a mismatched extension against the reserved path', async () => {
    await assert.rejects(
      () =>
        runLiveReplacementUpload({
          fileName: 'other.mov',
          mediaType: 'video',
          existing: replacement(),
          start: async () => {
            throw new Error('should not start');
          },
          upload: async () => 'https://example.com/nope',
          attach: async () => replacement(),
        }),
      (error: unknown) => error instanceof ReplacementFlowError && error.code === 'extension_mismatch',
    );
  });
});

describe('replacement lifecycle', () => {
  it('polls video preparing and optimizing, including review, and stops when terminal', () => {
    assert.equal(shouldPollMediaReplacement(replacement({ status: 'pending' })), true);
    assert.equal(shouldPollMediaReplacement(replacement({ status: 'processing' })), true);
    assert.equal(shouldPollMediaReplacement(replacement({ status: 'ready_for_review' })), true);
    assert.equal(shouldPollMediaReplacement(replacement({ status: 'failed' })), false);
    assert.equal(shouldPollMediaReplacement(replacement({ status: 'rejected' })), false);
    assert.equal(shouldPollMediaReplacement(replacement({ status: 'promoted' })), false);
    assert.equal(shouldPollMediaReplacement(replacement({ status: 'awaiting_upload' })), false);
    assert.equal(replacementActivity(replacement({ status: 'pending' }), 'video'), 'preparing');
    assert.equal(replacementActivity(replacement({ status: 'processing' }), 'video'), 'optimizing');
    assert.equal(showsVideoOptimizationCopy('optimizing'), true);
  });

  it('skips optimization copy for audio', () => {
    assert.equal(replacementActivity(replacement({ status: 'pending', media_type: 'audio' }), 'audio'), 'awaiting_review');
    assert.equal(
      replacementActivity(replacement({ status: 'processing', media_type: 'audio' }), 'audio'),
      'awaiting_review',
    );
    assert.equal(
      replacementActivity(replacement({ status: 'ready_for_review', media_type: 'audio' }), 'audio'),
      'awaiting_review',
    );
    assert.equal(en.replacement.awaitingReviewAudio, 'New audio awaiting review');
    assert.equal(showsVideoOptimizationCopy('awaiting_review'), false);
    assert.doesNotMatch(en.replacement.awaitingReviewAudio, /optimiz/i);
  });

  it('retries a failed video with the same generation and no upload', () => {
    const failed = replacement({ status: 'failed', generation: 'gen-same', upload_storage_path: undefined });
    assert.equal(canRetryFailedReplacement(failed, 'video'), true);
    assert.equal(canRetryFailedReplacement(failed, 'audio'), false);
    assert.deepEqual(retryReplacementBody(failed.generation), { generation: 'gen-same' });
    assert.equal(Object.keys(retryReplacementBody(failed.generation)).join(','), 'generation');
  });

  it('refetches after promotion and after open, stale, and invalid conflicts', () => {
    assert.equal(shouldRefreshSessionAfterPromotion('ready_for_review', 'promoted'), true);
    assert.equal(shouldRefreshSessionAfterPromotion('promoted', 'promoted'), false);
    assert.equal(replacementConflictAction('replacement_already_open'), 'refetch');
    assert.equal(replacementConflictAction('stale_generation'), 'refetch');
    assert.equal(replacementConflictAction('invalid_state'), 'refetch');
    assert.equal(replacementConflictAction('validation_error'), 'validation');
    assert.equal(en.replacement.promoted, 'The new version is now live.');
  });
});

describe('draft media flow stays on the original endpoints', () => {
  it('still builds the draft video source path', () => {
    assert.equal(
      buildGuidedSessionStoragePath('session-1', 'video', 'mp4'),
      'guided-sessions/video/session-1.source.mp4',
    );
  });

  it('polls draft optimization only while the draft editor is editable', () => {
    assert.equal(shouldPollDraftVideoOptimization(true, 'optimizing'), true);
    assert.equal(shouldPollDraftVideoOptimization(false, 'optimizing'), false);
    assert.equal(shouldPollDraftVideoOptimization(true, 'ready'), false);
    assert.equal(shouldPollDraftVideoOptimization(true, 'failed'), false);
  });

  it('keeps attach-media, draft retry, and publish off the replacement API', () => {
    assert.match(attachGuidedSessionMedia.toString(), /attach-media/);
    assert.doesNotMatch(attachGuidedSessionMedia.toString(), /media-replacement/);
    assert.match(retryGuidedSessionVideoOptimization.toString(), /retry-video-optimization/);
    assert.doesNotMatch(retryGuidedSessionVideoOptimization.toString(), /media-replacement/);
    assert.match(publishGuidedSession.toString(), /\/publish\//);
    assert.doesNotMatch(publishGuidedSession.toString(), /media-replacement/);
  });
});

describe('replacement copy locales', () => {
  it('keeps Hebrew keys aligned with English', () => {
    assert.deepEqual(Object.keys(en.replacement).sort(), Object.keys(he.replacement).sort());
    assert.equal(he.sessions.statusLive, 'חי');
    assert.equal(he.sessions.statusAwaitingApproval, 'ממתין לאישור');
    assert.notEqual(he.sessions.statusLive, he.sessions.statusAwaitingApproval);
  });
});
