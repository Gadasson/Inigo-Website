import type {
  StudioGuidedSession,
  VideoOptimizationDisplayStatus,
} from '@/lib/api/studioGuidedSessions';

export type GuidedSessionMediaRole = 'audio' | 'thumbnail' | 'video';

export type GuidedSessionMediaSlotId = 'audio' | 'cover' | 'video';

export type GuidedSessionMediaFormatGuidance = {
  formats: string;
  maxSize: string;
};

export type GuidedSessionMediaSlotConfig = {
  id: GuidedSessionMediaSlotId;
  role: GuidedSessionMediaRole;
  label: string;
  accept: string;
  emptyHint: string;
  formatGuidance: GuidedSessionMediaFormatGuidance;
};

/** Matches backend STUDIO_VIDEO_SOURCE_MAX_BYTES (2 GiB). Audio/cover unchanged. */
export const GUIDED_SESSION_VIDEO_MAX_BYTES = 2 * 1024 * 1024 * 1024;

const MAX_FILE_BYTES: Record<GuidedSessionMediaRole, number> = {
  audio: 50 * 1024 * 1024,
  thumbnail: 10 * 1024 * 1024,
  video: GUIDED_SESSION_VIDEO_MAX_BYTES,
};

const ALLOWED_AUDIO_EXTENSIONS = new Set(['mp3', 'm4a']);

const ALLOWED_AUDIO_MIME_TYPES = new Set([
  'audio/mpeg',
  'audio/mp3',
  'audio/mp4',
  'audio/x-m4a',
  'audio/m4a',
  'audio/aac',
]);

const REJECTED_AUDIO_MIME_TYPES = new Set([
  'audio/wav',
  'audio/x-wav',
  'audio/wave',
  'audio/flac',
  'audio/x-flac',
  'audio/ogg',
  'audio/aiff',
  'audio/x-aiff',
]);

const ALLOWED_VIDEO_EXTENSIONS = new Set(['mp4', 'mov']);

const ALLOWED_VIDEO_MIME_TYPES = new Set([
  'video/mp4',
  'video/quicktime',
  'video/x-m4v',
]);

export const GUIDED_SESSION_MEDIA_SLOTS: GuidedSessionMediaSlotConfig[] = [
  {
    id: 'audio',
    role: 'audio',
    label: 'Audio',
    accept: '.mp3,.m4a,audio/mpeg,audio/mp4,audio/x-m4a',
    emptyHint: 'Add the guided audio for this session.',
    formatGuidance: {
      formats: 'MP3 or M4A',
      maxSize: 'Maximum size: 50 MB',
    },
  },
  {
    id: 'video',
    role: 'video',
    label: 'Video',
    accept: '.mp4,.mov,video/mp4,video/quicktime',
    emptyHint: 'Add video instead of audio.',
    formatGuidance: {
      formats: 'MP4 or MOV',
      maxSize: 'Maximum upload size: 2 GB',
    },
  },
  {
    id: 'cover',
    role: 'thumbnail',
    label: 'Cover image',
    accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    emptyHint: 'Add a cover image before publishing.',
    formatGuidance: {
      formats: 'JPEG, PNG or WebP',
      maxSize: 'Maximum size: 10 MB',
    },
  },
];

const ROLE_TO_URL_FIELD: Record<GuidedSessionMediaRole, keyof StudioGuidedSession> = {
  audio: 'audio_url',
  thumbnail: 'thumbnail_url',
  video: 'video_url',
};

export function guidedSessionMediaUrl(
  session: StudioGuidedSession,
  role: GuidedSessionMediaRole,
): string | null {
  const value = session[ROLE_TO_URL_FIELD[role]];
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

export function guidedSessionMediaFileName(
  session: StudioGuidedSession,
  role: GuidedSessionMediaRole,
): string | null {
  const metadata = session.file_metadata?.[role];
  if (metadata && typeof metadata === 'object') {
    const record = metadata as Record<string, unknown>;
    const name = record.original_filename ?? record.filename;
    if (typeof name === 'string' && name.trim()) return name.trim();
  }

  const url = guidedSessionMediaUrl(session, role);
  if (!url) return null;

  try {
    const pathname = new URL(url).pathname;
    const segment = pathname.split('/').pop();
    return segment ? decodeURIComponent(segment) : null;
  } catch {
    return null;
  }
}

export function fileExtension(filename: string): string {
  const match = filename.match(/\.([A-Za-z0-9]+)$/);
  return match ? match[1].toLowerCase() : 'bin';
}

/**
 * Firebase storage path for Studio media.
 * Video sources must use the `.source.` marker required by attach-media.
 */
export function buildGuidedSessionStoragePath(
  sessionSlug: string,
  role: GuidedSessionMediaRole,
  ext: string,
): string {
  const folder =
    role === 'thumbnail' ? 'thumbnails' : role === 'audio' ? 'audio' : 'video';
  if (role === 'video') {
    return `guided-sessions/${folder}/${sessionSlug}.source.${ext}`;
  }
  return `guided-sessions/${folder}/${sessionSlug}.${ext}`;
}

function isAllowedAudioFile(file: File): boolean {
  const ext = fileExtension(file.name);
  if (!ALLOWED_AUDIO_EXTENSIONS.has(ext)) {
    return false;
  }

  const mime = file.type.trim().toLowerCase();
  if (!mime) {
    return true;
  }

  if (REJECTED_AUDIO_MIME_TYPES.has(mime)) {
    return false;
  }

  return ALLOWED_AUDIO_MIME_TYPES.has(mime);
}

function isAllowedVideoFile(file: File): boolean {
  const ext = fileExtension(file.name);
  if (!ALLOWED_VIDEO_EXTENSIONS.has(ext)) {
    return false;
  }

  const mime = file.type.trim().toLowerCase();
  if (!mime || mime === 'application/octet-stream') {
    return true;
  }

  return ALLOWED_VIDEO_MIME_TYPES.has(mime) || mime.startsWith('video/');
}

export type MediaValidationError =
  | { code: 'empty' }
  | { code: 'tooLarge'; maxMb: number }
  | { code: 'tooLargeVideo' }
  | { code: 'audioFormat' }
  | { code: 'imageFile' }
  | { code: 'videoFile' }
  | { code: 'exclusivePrimaryMedia' }
  | { code: 'removeOtherPrimaryFirst' };

export function validateGuidedSessionMediaFile(
  file: File,
  role: GuidedSessionMediaRole,
): MediaValidationError | null {
  if (!file || file.size === 0) {
    return { code: 'empty' };
  }

  const maxBytes = MAX_FILE_BYTES[role];
  if (file.size > maxBytes) {
    if (role === 'video') {
      return { code: 'tooLargeVideo' };
    }
    return { code: 'tooLarge', maxMb: Math.round(maxBytes / (1024 * 1024)) };
  }

  if (role === 'audio') {
    if (!isAllowedAudioFile(file)) {
      return { code: 'audioFormat' };
    }
    return null;
  }

  if (role === 'thumbnail' && !file.type.startsWith('image/')) {
    return { code: 'imageFile' };
  }

  if (role === 'video' && !isAllowedVideoFile(file)) {
    return { code: 'videoFile' };
  }

  return null;
}

export function buildGuidedSessionFileMetadata(file: File): Record<string, unknown> {
  return {
    content_type: file.type || 'application/octet-stream',
    size: file.size,
    original_filename: file.name,
  };
}

export function getVideoOptimizationDisplayStatus(
  session: StudioGuidedSession,
): VideoOptimizationDisplayStatus {
  const status = session.video_optimization_display_status;
  if (status === 'optimizing' || status === 'ready' || status === 'failed') {
    return status;
  }
  return null;
}

/**
 * Video is present in the draft pipeline (including optimizing/failed with no URL yet).
 * Source of truth for exclusive audio/video blocking — not publish readiness.
 */
export function hasGuidedSessionVideo(session: StudioGuidedSession): boolean {
  const opt = getVideoOptimizationDisplayStatus(session);
  if (opt === 'optimizing' || opt === 'failed' || opt === 'ready') {
    return true;
  }
  return Boolean(guidedSessionMediaUrl(session, 'video'));
}

/**
 * Video satisfies the publish primary-media requirement.
 * optimizing/failed are never ready — even if a previous video_url still exists (replacement).
 * null display status = legacy: ready when video_url is present.
 */
export function isGuidedSessionVideoReady(session: StudioGuidedSession): boolean {
  const opt = getVideoOptimizationDisplayStatus(session);
  if (opt === 'optimizing' || opt === 'failed') {
    return false;
  }
  if (opt === 'ready') {
    return Boolean(guidedSessionMediaUrl(session, 'video'));
  }
  return Boolean(guidedSessionMediaUrl(session, 'video'));
}

/** Canonical playable video URL for Preview (never the `.source.` upload). */
export function guidedSessionCanonicalVideoUrl(
  session: StudioGuidedSession,
): string | null {
  return guidedSessionMediaUrl(session, 'video');
}

export function hasGuidedSessionAudio(session: StudioGuidedSession): boolean {
  return Boolean(guidedSessionMediaUrl(session, 'audio'));
}

export function hasGuidedSessionPrimaryMediaConflict(session: StudioGuidedSession): boolean {
  return hasGuidedSessionAudio(session) && hasGuidedSessionVideo(session);
}

export function hasValidGuidedSessionPrimaryMedia(session: StudioGuidedSession): boolean {
  const hasAudio = hasGuidedSessionAudio(session);
  const hasVideo = hasGuidedSessionVideo(session);
  if (hasAudio && hasVideo) {
    return false;
  }
  if (hasAudio) {
    return true;
  }
  if (hasVideo) {
    return isGuidedSessionVideoReady(session);
  }
  return false;
}

export function validateGuidedSessionMediaAttach(
  session: StudioGuidedSession,
  role: GuidedSessionMediaRole,
  isReplacingSameRole: boolean,
): MediaValidationError | null {
  if (isReplacingSameRole || role === 'thumbnail') {
    return null;
  }
  if (role === 'audio' && hasGuidedSessionVideo(session)) {
    return { code: 'removeOtherPrimaryFirst' };
  }
  if (role === 'video' && hasGuidedSessionAudio(session)) {
    return { code: 'removeOtherPrimaryFirst' };
  }
  return null;
}

export function isGuidedSessionMediaSlotBlocked(
  session: StudioGuidedSession,
  role: GuidedSessionMediaRole,
  isAttached: boolean,
): boolean {
  if (role === 'thumbnail' || isAttached) return false;
  if (role === 'audio' && hasGuidedSessionVideo(session)) return true;
  if (role === 'video' && hasGuidedSessionAudio(session)) return true;
  return false;
}

export function primaryMediaBlockedHintKey(role: GuidedSessionMediaRole): string {
  if (role === 'audio') return 'hintAudioBlocked';
  if (role === 'video') return 'hintVideoBlocked';
  return 'hintAudio';
}

export function hasGuidedSessionPrimaryMedia(session: StudioGuidedSession): boolean {
  return hasValidGuidedSessionPrimaryMedia(session);
}

export function hasGuidedSessionCover(session: StudioGuidedSession): boolean {
  return Boolean(guidedSessionMediaUrl(session, 'thumbnail'));
}
