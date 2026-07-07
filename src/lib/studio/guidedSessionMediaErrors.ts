import { StudioApiError } from '@/lib/api/studioApiClient';
import type { PendingMediaAttach } from '@/lib/studio/guidedSessionMediaTypes';

export type MediaUploadFailureKind =
  | 'validation'
  | 'firebase'
  | 'attach'
  | 'network'
  | 'auth'
  | 'config';

export const ATTACH_PENDING_ERROR_MESSAGE =
  'Upload completed, but attaching it to the session failed.';

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

/** Maps upload failures to creator-friendly copy. Never exposes raw technical errors. */
export function formatMediaUploadError(error: unknown): string {
  if (error instanceof MediaUploadError) {
    if (error.kind === 'validation') {
      return error.message;
    }
    if (error.kind === 'config') {
      return 'File uploads are not configured yet. Contact your Studio admin.';
    }
    if (error.kind === 'auth') {
      return 'Your session expired. Please sign in again and try again.';
    }
    if (error.kind === 'firebase') {
      return 'Upload failed.\nPlease try again.';
    }
    if (error.kind === 'attach') {
      if (error.pendingAttach) {
        return ATTACH_PENDING_ERROR_MESSAGE;
      }
      return (
        'The media uploaded successfully, but could not be attached to this session.\n\n' +
        'Please try again.'
      );
    }
    if (error.kind === 'network') {
      return 'Could not connect. Check your connection and try again.';
    }
  }

  if (error instanceof StudioApiError) {
    if (error.status === 401) {
      return 'Your session expired. Please sign in again and try again.';
    }
    if (error.status === 403) {
      return 'You do not have permission to upload media for this session.';
    }
    if (error.status >= 500) {
      return (
        'The media uploaded successfully, but could not be attached to this session.\n\n' +
        'Please try again.'
      );
    }
    return (
      'The media uploaded successfully, but could not be attached to this session.\n\n' +
      'Please try again.'
    );
  }

  if (isNetworkError(error)) {
    return 'Could not connect. Check your connection and try again.';
  }

  if (isFirebaseStorageError(error)) {
    return 'Upload failed.\nPlease try again.';
  }

  return 'Upload failed.\nPlease try again.';
}

/** Returns pending attach payload when Firebase succeeded but attach-media failed. */
export function getPendingMediaAttach(error: unknown): PendingMediaAttach | undefined {
  if (error instanceof MediaUploadError && error.pendingAttach) {
    return error.pendingAttach;
  }
  return undefined;
}
