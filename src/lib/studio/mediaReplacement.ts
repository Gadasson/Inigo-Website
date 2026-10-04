import type {
  MediaReplacementStatus,
  StudioGuidedSession,
  StudioMediaReplacement,
} from '@/lib/api/studioGuidedSessions';
import { fileExtension } from '@/lib/studio/guidedSessionMedia';

/** Server marks a creator discard with this exact reason. */
export const CREATOR_CANCELLED_REPLACEMENT_REASON = 'Cancelled by creator.';

export const MEDIA_REPLACEMENT_POLL_INTERVAL_MS = 7_000;

const POLL_STATUSES = new Set<MediaReplacementStatus>([
  'pending',
  'processing',
  'ready_for_review',
]);

export type ReplacementActivity =
  | 'idle'
  | 'awaiting_upload'
  | 'preparing'
  | 'optimizing'
  | 'awaiting_review'
  | 'failed'
  | 'rejected'
  | 'cancelled'
  | 'promoted';

export type LivePrimaryMediaType = 'audio' | 'video';

export function shouldPollMediaReplacement(
  replacement: StudioMediaReplacement | null | undefined,
): boolean {
  return Boolean(replacement && POLL_STATUSES.has(replacement.status));
}

export function shouldPollDraftVideoOptimization(
  isDraftEditable: boolean,
  displayStatus: string | null | undefined,
): boolean {
  return isDraftEditable && displayStatus === 'optimizing';
}

export function isCreatorCancelledReplacement(
  replacement: StudioMediaReplacement | null | undefined,
): boolean {
  return (
    replacement?.status === 'rejected' &&
    (replacement.rejection_reason || '').trim() === CREATOR_CANCELLED_REPLACEMENT_REASON
  );
}

export function livePrimaryMediaType(
  session: Pick<StudioGuidedSession, 'video_url' | 'audio_url' | 'has_video' | 'has_audio'>,
): LivePrimaryMediaType | null {
  if (session.video_url || session.has_video) return 'video';
  if (session.audio_url || session.has_audio) return 'audio';
  return null;
}

/**
 * Creator-facing replacement activity.
 * Audio never maps to preparing/optimizing — the server skips transcode.
 */
export function replacementActivity(
  replacement: StudioMediaReplacement | null | undefined,
  mediaType: LivePrimaryMediaType | null,
): ReplacementActivity {
  if (!replacement) return 'idle';
  switch (replacement.status) {
    case 'awaiting_upload':
      return 'awaiting_upload';
    case 'pending':
      return mediaType === 'video' ? 'preparing' : 'awaiting_review';
    case 'processing':
      return mediaType === 'video' ? 'optimizing' : 'awaiting_review';
    case 'ready_for_review':
      return 'awaiting_review';
    case 'failed':
      return 'failed';
    case 'rejected':
      return isCreatorCancelledReplacement(replacement) ? 'cancelled' : 'rejected';
    case 'promoted':
      return 'promoted';
    default:
      return 'idle';
  }
}

export function showsVideoOptimizationCopy(activity: ReplacementActivity): boolean {
  return activity === 'preparing' || activity === 'optimizing';
}

export function canContinueReservedUpload(
  replacement: StudioMediaReplacement | null | undefined,
): boolean {
  return (
    replacement?.status === 'awaiting_upload' &&
    Boolean(replacement.generation) &&
    Boolean(replacement.upload_storage_path)
  );
}

export function canStartNewReplacement(
  replacement: StudioMediaReplacement | null | undefined,
): boolean {
  if (!replacement) return true;
  return (
    replacement.status === 'rejected' ||
    replacement.status === 'promoted' ||
    replacement.status === 'failed'
  );
}

export function canDiscardReplacement(
  replacement: StudioMediaReplacement | null | undefined,
): boolean {
  if (!replacement) return false;
  return (
    replacement.status === 'awaiting_upload' ||
    replacement.status === 'ready_for_review'
  );
}

export function canRetryFailedReplacement(
  replacement: StudioMediaReplacement | null | undefined,
  mediaType: LivePrimaryMediaType | null,
): boolean {
  return mediaType === 'video' && replacement?.status === 'failed' && Boolean(replacement.generation);
}

export function reservedPathExtension(storagePath: string): string {
  const name = storagePath.split('/').pop() ?? storagePath;
  return fileExtension(name);
}

export function fileMatchesReservedPath(fileName: string, storagePath: string): boolean {
  return fileExtension(fileName) === reservedPathExtension(storagePath);
}

export type ReplacementConflictAction = 'refetch' | 'validation' | 'none';

export function replacementConflictAction(code: string | null | undefined): ReplacementConflictAction {
  if (
    code === 'replacement_already_open' ||
    code === 'stale_generation' ||
    code === 'invalid_state'
  ) {
    return 'refetch';
  }
  if (code === 'media_role_mismatch' || code === 'validation_error') {
    return 'validation';
  }
  return 'none';
}

/** Retry re-queues the same generation. It does not upload or start a new revision. */
export function retryReplacementBody(generation: string): { generation: string } {
  return { generation };
}

export function creatorSafeReplacementError(error: string | null | undefined): string | null {
  const text = (error || '').trim();
  if (!text) return null;
  if (
    /traceback|ffmpeg|exception|runtimeerror|errno|storage_path|guided-sessions\//i.test(text)
  ) {
    return null;
  }
  if (text.length > 180) return null;
  return text;
}

export function shouldRefreshSessionAfterPromotion(
  previous: MediaReplacementStatus | null | undefined,
  next: MediaReplacementStatus | null | undefined,
): boolean {
  return previous !== 'promoted' && next === 'promoted';
}

const PLAYBACK_KEYS = [
  'video_url',
  'audio_url',
  'processed_url',
  'source_url',
  'playback_url',
  'preview_url',
  'storage_url',
] as const;

/** Studio must not assume a playback URL for the proposed file. */
export function replacementExposesPlaybackUrl(payload: object | null | undefined): boolean {
  if (!payload) return false;
  const record = payload as Record<string, unknown>;
  return PLAYBACK_KEYS.some((key) => typeof record[key] === 'string' && record[key]);
}

export type ReplacementUploadStep = 'start' | 'upload' | 'attach';

export class ReplacementFlowError extends Error {
  readonly code: 'extension_mismatch' | 'missing_reservation';

  constructor(code: 'extension_mismatch' | 'missing_reservation') {
    super(code);
    this.name = 'ReplacementFlowError';
    this.code = code;
  }
}

type RunLiveReplacementUploadOptions<T> = {
  fileName: string;
  mediaType: LivePrimaryMediaType;
  existing: StudioMediaReplacement | null | undefined;
  start: (body: { extension: string; media_type: LivePrimaryMediaType }) => Promise<StudioMediaReplacement>;
  upload: (storagePath: string, onProgress: (percent: number) => void) => Promise<string>;
  attach: (body: {
    generation: string;
    storage_path: string;
    storage_url: string;
  }) => Promise<T>;
  onReserved?: (replacement: StudioMediaReplacement) => void;
  onProgress?: (percent: number) => void;
  onStep?: (step: ReplacementUploadStep) => void;
};

/**
 * Start (or reuse an awaiting upload) before Firebase, then attach the
 * server-reserved path. Never invents a storage path.
 */
export async function runLiveReplacementUpload<T>(
  options: RunLiveReplacementUploadOptions<T>,
): Promise<{ result: T; steps: ReplacementUploadStep[]; storagePath: string }> {
  const steps: ReplacementUploadStep[] = [];
  const extension = fileExtension(options.fileName);
  let generation: string;
  let storagePath: string;

  const existing = options.existing;
  if (canContinueReservedUpload(existing)) {
    storagePath = existing!.upload_storage_path!;
    if (!fileMatchesReservedPath(options.fileName, storagePath)) {
      throw new ReplacementFlowError('extension_mismatch');
    }
    generation = existing!.generation;
    options.onReserved?.(existing!);
  } else {
    steps.push('start');
    options.onStep?.('start');
    const started = await options.start({
      extension,
      media_type: options.mediaType,
    });
    if (!started.upload_storage_path || !started.generation) {
      throw new ReplacementFlowError('missing_reservation');
    }
    generation = started.generation;
    storagePath = started.upload_storage_path;
    options.onReserved?.(started);
  }

  steps.push('upload');
  options.onStep?.('upload');
  const storageUrl = await options.upload(storagePath, (percent) => {
    options.onProgress?.(percent);
  });

  steps.push('attach');
  options.onStep?.('attach');
  const result = await options.attach({
    generation,
    storage_path: storagePath,
    storage_url: storageUrl,
  });

  return { result, steps, storagePath };
}
