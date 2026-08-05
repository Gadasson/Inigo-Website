/**
 * Cover image preview resolution for Studio media slots.
 * Local/object URLs are never treated as persisted server media.
 */

export type CoverImagePreviewKind = 'persisted' | 'local_pending' | 'none';

export type CoverImagePreview = {
  kind: CoverImagePreviewKind;
  /** URI for <img src>. Local pending uses blob: / object URLs only. */
  src: string | null;
};

/**
 * Prefer a local pending preview while upload/attach is in flight or failed.
 * Never invent a storage path; never treat local URI as persisted.
 */
export function resolveCoverImagePreview(options: {
  persistedUrl: string | null;
  localObjectUrl: string | null;
  hasPendingAttach: boolean;
  isUploading: boolean;
}): CoverImagePreview {
  const local = options.localObjectUrl?.trim() || null;
  if (local && (options.hasPendingAttach || options.isUploading)) {
    return { kind: 'local_pending', src: local };
  }
  if (options.hasPendingAttach) {
    // Attach failed after Firebase; hide stale persisted cover so replace isn't mistaken for success.
    return { kind: 'none', src: null };
  }
  const persisted = options.persistedUrl?.trim() || null;
  if (persisted) {
    return { kind: 'persisted', src: persisted };
  }
  return { kind: 'none', src: null };
}
