import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';

export type GuidedSessionMediaRole = 'audio' | 'thumbnail' | 'video';

export type GuidedSessionMediaSlotId = 'audio' | 'cover' | 'video';

export const GUIDED_SESSION_MEDIA_SLOTS: {
  id: GuidedSessionMediaSlotId;
  role: GuidedSessionMediaRole;
  label: string;
  accept: string;
  emptyHint: string;
}[] = [
  {
    id: 'audio',
    role: 'audio',
    label: 'Audio',
    accept: 'audio/*',
    emptyHint: 'Add the guided audio for this session.',
  },
  {
    id: 'cover',
    role: 'thumbnail',
    label: 'Cover image',
    accept: 'image/*',
    emptyHint: 'Optional, but helps people recognize your session.',
  },
  {
    id: 'video',
    role: 'video',
    label: 'Video',
    accept: 'video/*',
    emptyHint: 'Use video instead of audio, or add both.',
  },
];

const MAX_FILE_BYTES: Record<GuidedSessionMediaRole, number> = {
  audio: 50 * 1024 * 1024,
  thumbnail: 10 * 1024 * 1024,
  video: 500 * 1024 * 1024,
};

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

export function validateGuidedSessionMediaFile(
  file: File,
  role: GuidedSessionMediaRole,
): string | null {
  if (!file || file.size === 0) {
    return 'Choose a file to upload.';
  }

  const maxBytes = MAX_FILE_BYTES[role];
  if (file.size > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return `This file is too large. Please choose one under ${maxMb} MB.`;
  }

  if (role === 'audio' && !file.type.startsWith('audio/')) {
    return 'Please choose an audio file.';
  }
  if (role === 'thumbnail' && !file.type.startsWith('image/')) {
    return 'Please choose an image file.';
  }
  if (role === 'video' && !file.type.startsWith('video/')) {
    return 'Please choose a video file.';
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
