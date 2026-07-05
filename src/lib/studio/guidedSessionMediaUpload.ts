import {
  attachGuidedSessionMedia,
  updateGuidedSessionDraft,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { detectMediaFileDuration } from '@/lib/studio/detectMediaDuration';
import {
  formatDurationClock,
  secondsToDurationString,
} from '@/lib/studio/formatDuration';
import {
  buildGuidedSessionFileMetadata,
  buildGuidedSessionStoragePath,
  fileExtension,
  type GuidedSessionMediaRole,
} from '@/lib/studio/guidedSessionMedia';
import { MediaUploadError } from '@/lib/studio/guidedSessionMediaErrors';
import type { DetectedMediaDuration } from '@/lib/studio/guidedSessionMediaTypes';

export type MediaUploadStage = 'firebase' | 'attach';

export type MediaUploadProgress = {
  stage: MediaUploadStage;
  percent: number;
};

export type {
  DetectedMediaDuration,
  MediaSessionUpdateMeta,
  OnGuidedSessionMediaUpdated,
} from '@/lib/studio/guidedSessionMediaTypes';

export type MediaUploadResult = {
  session: StudioGuidedSession;
  durationDetected?: DetectedMediaDuration;
};

/**
 * Guided session media upload pipeline: browser → Firebase Storage → attach-media.
 *
 * Future extension points (not implemented in V1):
 * - `cancel()` via uploadBytesResumable UploadTask
 * - `retryAttach()` when Firebase succeeded but attach-media failed
 * - Persisted resumable uploads across refresh
 */
export type MediaUploadHandle = {
  cancel?: () => void;
  retryAttach?: () => Promise<MediaUploadResult>;
};

type UploadGuidedSessionMediaOptions = {
  session: StudioGuidedSession;
  role: GuidedSessionMediaRole;
  file: File;
  getIdToken: () => Promise<string | null>;
  onProgress?: (progress: MediaUploadProgress) => void;
};

function toAttachError(cause: unknown): MediaUploadError {
  if (cause instanceof StudioApiError && cause.status === 401) {
    return new MediaUploadError('auth', '', cause);
  }
  if (isNetworkFailure(cause)) {
    return new MediaUploadError('network', '', cause);
  }
  return new MediaUploadError('attach', '', cause);
}

function toFirebaseError(cause: unknown): MediaUploadError {
  if (isNetworkFailure(cause)) {
    return new MediaUploadError('network', '', cause);
  }
  return new MediaUploadError('firebase', '', cause);
}

function isNetworkFailure(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    error instanceof DOMException ||
    error instanceof Event
  );
}

async function detectDurationForRole(
  file: File,
  role: GuidedSessionMediaRole,
): Promise<DetectedMediaDuration | undefined> {
  if (role !== 'audio' && role !== 'video') {
    return undefined;
  }

  const seconds = await detectMediaFileDuration(file, role);
  if (seconds == null) {
    return undefined;
  }

  return {
    role,
    seconds,
    durationString: secondsToDurationString(seconds),
    displayLabel: formatDurationClock(seconds),
  };
}

export async function uploadGuidedSessionMedia(
  options: UploadGuidedSessionMediaOptions,
): Promise<MediaUploadResult> {
  const { session, role, file, getIdToken, onProgress } = options;
  const ext = fileExtension(file.name);
  const storagePath = buildGuidedSessionStoragePath(session.session_id, role, ext);

  const detectedDuration = await detectDurationForRole(file, role);

  let storageUrl: string;

  try {
    const { uploadFileToFirebaseStorage } = await import('@/lib/firebase/storage');
    storageUrl = await uploadFileToFirebaseStorage(storagePath, file, (percent) => {
      onProgress?.({ stage: 'firebase', percent });
    });
  } catch (error) {
    throw toFirebaseError(error);
  }

  onProgress?.({ stage: 'attach', percent: 100 });

  try {
    const token = await getIdToken();
    if (!token) {
      throw new MediaUploadError('auth', '', null);
    }

    const attached = await attachGuidedSessionMedia(
      session.id,
      {
        media_role: role,
        storage_url: storageUrl,
        storage_path: storagePath,
        file_metadata: buildGuidedSessionFileMetadata(file),
      },
      token,
    );

    if (!detectedDuration) {
      return { session: attached };
    }

    try {
      const patched = await updateGuidedSessionDraft(
        session.id,
        { duration: detectedDuration.durationString },
        token,
      );
      return { session: patched, durationDetected: detectedDuration };
    } catch {
      return { session: attached };
    }
  } catch (error) {
    throw toAttachError(error);
  }
}
