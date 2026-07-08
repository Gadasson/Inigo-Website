import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';

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

const MAX_FILE_BYTES: Record<GuidedSessionMediaRole, number> = {
  audio: 50 * 1024 * 1024,
  thumbnail: 10 * 1024 * 1024,
  video: 500 * 1024 * 1024,
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
    id: 'cover',
    role: 'thumbnail',
    label: 'Cover image',
    accept: 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp',
    emptyHint: 'Optional, but helps people recognize your session.',
    formatGuidance: {
      formats: 'JPEG, PNG or WebP',
      maxSize: 'Maximum size: 10 MB',
    },
  },
  {
    id: 'video',
    role: 'video',
    label: 'Video',
    accept: 'video/*,.mp4',
    emptyHint: 'Use video instead of audio, or add both.',
    formatGuidance: {
      formats: 'MP4 recommended',
      maxSize: 'Maximum size: 500 MB',
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

export function buildGuidedSessionStoragePath(
  sessionSlug: string,
  role: GuidedSessionMediaRole,
  ext: string,
): string {
  const folder =
    role === 'thumbnail' ? 'thumbnails' : role === 'audio' ? 'audio' : 'video';
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

export type MediaValidationError =
  | { code: 'empty' }
  | { code: 'tooLarge'; maxMb: number }
  | { code: 'audioFormat' }
  | { code: 'imageFile' }
  | { code: 'videoFile' };

export function validateGuidedSessionMediaFile(
  file: File,
  role: GuidedSessionMediaRole,
): MediaValidationError | null {
  if (!file || file.size === 0) {
    return { code: 'empty' };
  }

  const maxBytes = MAX_FILE_BYTES[role];
  if (file.size > maxBytes) {
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

  if (role === 'video' && !file.type.startsWith('video/')) {
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

export function hasGuidedSessionPrimaryMedia(session: StudioGuidedSession): boolean {
  return Boolean(guidedSessionMediaUrl(session, 'audio') || guidedSessionMediaUrl(session, 'video'));
}

export function hasGuidedSessionCover(session: StudioGuidedSession): boolean {
  return Boolean(guidedSessionMediaUrl(session, 'thumbnail'));
}
