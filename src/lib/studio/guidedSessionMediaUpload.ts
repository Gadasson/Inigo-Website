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
import type {
  DetectedMediaDuration,
  PendingMediaAttach,
} from '@/lib/studio/guidedSessionMediaTypes';

export type MediaUploadStage = 'firebase' | 'attach';

export type MediaUploadProgress = {
  stage: MediaUploadStage;
  percent: number;
};

export type {
  DetectedMediaDuration,
  MediaSessionUpdateMeta,
  OnGuidedSessionMediaUpdated,
  PendingMediaAttach,
} from '@/lib/studio/guidedSessionMediaTypes';

export type MediaUploadResult = {
  session: StudioGuidedSession;
  durationDetected?: DetectedMediaDuration;
};

type AttachUploadedMediaOptions = {
  sessionId: number;
  role: GuidedSessionMediaRole;
  storageUrl: string;
  storagePath: string;
  fileMetadata: Record<string, unknown>;
  detectedDuration?: DetectedMediaDuration;
  getIdToken: () => Promise<string | null>;
};

type UploadGuidedSessionMediaOptions = {
  session: StudioGuidedSession;
  role: GuidedSessionMediaRole;
  file: File;
  getIdToken: () => Promise<string | null>;
  onProgress?: (progress: MediaUploadProgress) => void;
};

type RetryAttachGuidedSessionMediaOptions = {
  pendingAttach: PendingMediaAttach;
  getIdToken: () => Promise<string | null>;
};

function isNetworkFailure(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    error instanceof DOMException ||
    error instanceof Event
  );
}

function toAttachError(cause: unknown, pendingAttach?: PendingMediaAttach): MediaUploadError {
  if (cause instanceof StudioApiError && cause.status === 401) {
    return new MediaUploadError('auth', '', cause);
  }
  if (isNetworkFailure(cause)) {
    return new MediaUploadError('network', '', cause, pendingAttach);
  }
  return new MediaUploadError('attach', '', cause, pendingAttach);
}

function toFirebaseError(cause: unknown): MediaUploadError {
  if (isNetworkFailure(cause)) {
    return new MediaUploadError('network', '', cause);
  }
  return new MediaUploadError('firebase', '', cause);
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

/** POST attach-media and optionally PATCH duration — no Firebase upload. */
export async function attachUploadedGuidedSessionMedia(
  options: AttachUploadedMediaOptions,
): Promise<MediaUploadResult> {
  const {
    sessionId,
    role,
    storageUrl,
    storagePath,
    fileMetadata,
    detectedDuration,
    getIdToken,
  } = options;

  const token = await getIdToken();
  if (!token) {
    throw new MediaUploadError('auth', '', null);
  }

  const attached = await attachGuidedSessionMedia(
    sessionId,
    {
      media_role: role,
      storage_url: storageUrl,
      storage_path: storagePath,
      file_metadata: fileMetadata,
    },
    token,
  );

  if (!detectedDuration) {
    return { session: attached };
  }

  try {
    const patched = await updateGuidedSessionDraft(
      sessionId,
      { duration: detectedDuration.durationString },
      token,
    );
    return { session: patched, durationDetected: detectedDuration };
  } catch {
    return { session: attached };
  }
}

/**
 * Retry attach-media for a file already in Firebase Storage.
 * Does not re-upload the file.
 */
export async function retryAttachGuidedSessionMedia(
  options: RetryAttachGuidedSessionMediaOptions,
): Promise<MediaUploadResult> {
  const { pendingAttach, getIdToken } = options;

  try {
    return await attachUploadedGuidedSessionMedia({
      sessionId: pendingAttach.sessionId,
      role: pendingAttach.mediaRole,
      storageUrl: pendingAttach.storageUrl,
      storagePath: pendingAttach.storagePath,
      fileMetadata: pendingAttach.fileMetadata,
      detectedDuration: pendingAttach.detectedDuration,
      getIdToken,
    });
  } catch (error) {
    throw toAttachError(error, pendingAttach);
  }
}

export async function uploadGuidedSessionMedia(
  options: UploadGuidedSessionMediaOptions,
): Promise<MediaUploadResult> {
  const { session, role, file, getIdToken, onProgress } = options;
  const ext = fileExtension(file.name);
  const storagePath = buildGuidedSessionStoragePath(session.session_id, role, ext);
  const fileMetadata = buildGuidedSessionFileMetadata(file);

  const detectedDuration = await detectDurationForRole(file, role);

  const pendingAttach: PendingMediaAttach = {
    sessionId: session.id,
    mediaRole: role,
    storageUrl: '',
    storagePath,
    fileMetadata,
    detectedDuration,
    originalFileName: file.name,
  };

  let storageUrl: string;

  try {
    const { uploadFileToFirebaseStorage } = await import('@/lib/firebase/storage');
    storageUrl = await uploadFileToFirebaseStorage(storagePath, file, (percent) => {
      onProgress?.({ stage: 'firebase', percent });
    });
  } catch (error) {
    throw toFirebaseError(error);
  }

  pendingAttach.storageUrl = storageUrl;

  onProgress?.({ stage: 'attach', percent: 100 });

  try {
    return await attachUploadedGuidedSessionMedia({
      sessionId: session.id,
      role,
      storageUrl,
      storagePath,
      fileMetadata,
      detectedDuration,
      getIdToken,
    });
  } catch (error) {
    throw toAttachError(error, pendingAttach);
  }
}
