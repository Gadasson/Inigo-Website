import {
  attachGuidedSessionMediaReplacement,
  getGuidedSession,
  startGuidedSessionMediaReplacement,
  type StudioGuidedSession,
  type StudioMediaReplacement,
} from '@/lib/api/studioGuidedSessions';
import { uploadFileToFirebaseStorage } from '@/lib/firebase/storage';
import { getStudioApiErrorCode } from '@/lib/studio/parseStudioApiError';
import {
  replacementConflictAction,
  runLiveReplacementUpload,
  type LivePrimaryMediaType,
} from '@/lib/studio/mediaReplacement';

export type LiveReplacementUploadOutcome =
  | { kind: 'uploaded'; session: StudioGuidedSession }
  | { kind: 'conflict'; code: string; session: StudioGuidedSession };

type Options = {
  session: StudioGuidedSession;
  file: File;
  mediaType: LivePrimaryMediaType;
  getIdToken: () => Promise<string | null>;
  onProgress?: (percent: number) => void;
  onReserved?: (replacement: StudioMediaReplacement) => void;
};

/**
 * Reserves a server path, uploads to that path, then attaches.
 * Known conflicts refetch the session so the UI can leave the uploading state.
 */
export async function uploadLiveMediaReplacement(
  options: Options,
): Promise<LiveReplacementUploadOutcome> {
  const token = await options.getIdToken();
  try {
    const { result } = await runLiveReplacementUpload({
      fileName: options.file.name,
      mediaType: options.mediaType,
      existing: options.session.media_replacement,
      onReserved: options.onReserved,
      onProgress: options.onProgress,
      start: (body) =>
        startGuidedSessionMediaReplacement(options.session.id, body, token),
      upload: (storagePath, onProgress) =>
        uploadFileToFirebaseStorage(storagePath, options.file, onProgress),
      attach: (body) =>
        attachGuidedSessionMediaReplacement(options.session.id, body, token),
    });
    return {
      kind: 'uploaded',
      session: { ...options.session, media_replacement: result },
    };
  } catch (error) {
    const code = getStudioApiErrorCode(error);
    if (replacementConflictAction(code) === 'refetch') {
      const freshToken = await options.getIdToken();
      const session = await getGuidedSession(options.session.id, freshToken);
      return { kind: 'conflict', code: code ?? 'invalid_state', session };
    }
    throw error;
  }
}
