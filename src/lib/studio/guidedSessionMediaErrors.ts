import { StudioApiError } from '@/lib/api/studioApiClient';
import type { PendingMediaAttach } from '@/lib/studio/guidedSessionMediaTypes';

export type MediaUploadFailureKind =
  | 'validation'
  | 'firebase'
  | 'attach'
  | 'network'
  | 'auth'
  | 'config';

export type MediaUploadErrorCode =
  | 'config'
  | 'auth'
  | 'firebase'
  | 'attachPending'
  | 'attach'
  | 'network'
  | 'noPermission'
  | 'generic';

export class MediaUploadError extends Error {
  readonly kind: MediaUploadFailureKind;
  readonly causeError: unknown;
  /** Present when Firebase upload succeeded but attach-media failed. */
  readonly pendingAttach?: PendingMediaAttach;

  constructor(
    kind: MediaUploadFailureKind,
    message: string,
    causeError: unknown = null,
    pendingAttach?: PendingMediaAttach,
  ) {
    super(message);
    this.name = 'MediaUploadError';
    this.kind = kind;
    this.causeError = causeError;
    this.pendingAttach = pendingAttach;
  }
}

function isNetworkError(error: unknown): boolean {
  return (
    error instanceof TypeError ||
    error instanceof DOMException ||
    error instanceof Event
  );
}

function isFirebaseStorageError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  const code = (error as { code?: string }).code;
  return typeof code === 'string' && code.startsWith('storage/');
}

/** Maps upload failures to a translation key under `mediaError.*`. */
export function getMediaUploadErrorCode(error: unknown): MediaUploadErrorCode {
  if (error instanceof MediaUploadError) {
    if (error.kind === 'config') return 'config';
    if (error.kind === 'auth') return 'auth';
    if (error.kind === 'firebase') return 'firebase';
    if (error.kind === 'attach') {
      return error.pendingAttach ? 'attachPending' : 'attach';
    }
    if (error.kind === 'network') return 'network';
  }

  if (error instanceof StudioApiError) {
    if (error.status === 401) return 'auth';
    if (error.status === 403) return 'noPermission';
    if (error.status >= 500) return 'attach';
    return 'attach';
  }

  if (isNetworkError(error)) return 'network';
  if (isFirebaseStorageError(error)) return 'firebase';

  return 'generic';
}

/** Returns pending attach payload when Firebase succeeded but attach-media failed. */
export function getPendingMediaAttach(error: unknown): PendingMediaAttach | undefined {
  if (error instanceof MediaUploadError && error.pendingAttach) {
    return error.pendingAttach;
  }
  return undefined;
}
