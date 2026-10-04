import { studioFetch, StudioApiError } from '@/lib/api/studioApiClient';
import type { TimeSuitabilityValue } from '@/lib/studio/timeSuitability';

const BASE = '/api/studio/guided-sessions';

export type CreateGuidedSessionDraftPayload = {
  session_id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  category: string;
  primary_category: string;
  instructor: string;
  environment: string;
  background_music: string;
  background_music_creator?: string;
  language: string;
  sound_gender: string;
  access_tier: string;
  tags: string[];
  sub_category_codes: string[];
  /** Optional for older servers; preferred create default is ['anytime']. */
  time_suitability?: TimeSuitabilityValue[];
};

/** Creator-facing video optimization state from the Studio session API. */
export type VideoOptimizationDisplayStatus =
  | 'optimizing'
  | 'ready'
  | 'failed'
  | null;

/** Raw pipeline status (detail/list may also expose this). */
export type VideoOptimizationStatus =
  | 'pending'
  | 'processing'
  | 'ready'
  | 'failed'
  | null;

export type MediaReplacementStatus =
  | 'awaiting_upload'
  | 'pending'
  | 'processing'
  | 'ready_for_review'
  | 'failed'
  | 'rejected'
  | 'promoted';

/** Latest proposed replacement on a live session. Not a session status. */
export type StudioMediaReplacement = {
  id: number;
  generation: string;
  media_type: 'audio' | 'video';
  status: MediaReplacementStatus;
  error: string;
  created_at: string | null;
  ready_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string;
  proposed_duration_seconds: number | null;
  /** Present only while the server is waiting for the browser upload. */
  upload_storage_path?: string;
};

export type StudioGuidedSession = {
  id: number;
  session_id: string;
  title: string;
  status: string;
  description?: string;
  is_available?: boolean;
  difficulty?: string;
  category?: string;
  primary_category?: string;
  language?: string;
  sound_gender?: string;
  duration?: string;
  duration_minutes?: number;
  instructor?: string;
  environment?: string;
  background_music?: string;
  background_music_creator?: string | null;
  access_tier?: string;
  tags?: string[];
  sub_categories?: string[];
  /** Suitable invitation windows; omit/null treated as anytime by clients. */
  time_suitability?: TimeSuitabilityValue[] | null;
  thumbnail_url?: string | null;
  /** Canonical display derivative; prefer when optimization is ready. */
  thumbnail_display_url?: string | null;
  thumbnail_optimization_status?: 'pending' | 'processing' | 'ready' | 'failed' | null;
  audio_url?: string | null;
  video_url?: string | null;
  has_audio?: boolean;
  has_video?: boolean;
  /** Raw worker status; prefer display_status in UI. */
  video_optimization_status?: VideoOptimizationStatus;
  /** pending/processing → optimizing; null = legacy / not in pipeline. */
  video_optimization_display_status?: VideoOptimizationDisplayStatus;
  /** Present on detail responses when optimization failed. */
  video_optimization_error?: string;
  file_metadata?: Record<string, Record<string, unknown>>;
  created_at?: string;
  updated_at?: string;
  /** Latest replacement on detail. Absent from public/mobile payloads. */
  media_replacement?: StudioMediaReplacement | null;
};

export type AttachGuidedSessionMediaPayload = {
  media_role: 'audio' | 'thumbnail' | 'video';
  storage_url: string;
  storage_path: string;
  file_metadata?: Record<string, unknown>;
};

/** PATCH payload — only editable draft fields; omit immutable/media/status fields. */
export type UpdateGuidedSessionDraftPayload = Partial<{
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  category: string;
  primary_category: string;
  instructor: string;
  environment: string;
  background_music: string;
  background_music_creator: string;
  language: string;
  sound_gender: string;
  access_tier: string;
  tags: string[];
  sub_category_codes?: string[];
  time_suitability: TimeSuitabilityValue[];
}>;

type StudioGuidedSessionListResponse =
  | StudioGuidedSession[]
  | { sessions: StudioGuidedSession[] }
  | { results: StudioGuidedSession[] };

/** Backend list endpoint returns `{ sessions: [...] }` (not DRF default `results`). */
function normalizeGuidedSessionList(data: unknown): StudioGuidedSession[] {
  if (Array.isArray(data)) return data;
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.sessions)) {
      return record.sessions as StudioGuidedSession[];
    }
    if (Array.isArray(record.results)) {
      return record.results as StudioGuidedSession[];
    }
  }
  return [];
}

async function withToken<T>(
  token: string | null,
  call: (authToken: string) => Promise<T>,
): Promise<T> {
  if (!token) {
    throw new StudioApiError('Not authenticated', 401, null);
  }
  return call(token);
}

export async function createGuidedSessionDraft(
  payload: CreateGuidedSessionDraftPayload,
  token: string | null,
): Promise<StudioGuidedSession> {
  return withToken(token, (authToken) =>
    studioFetch<StudioGuidedSession>(`${BASE}/`, {
      method: 'POST',
      body: payload,
      token: authToken,
    }),
  );
}

export async function getGuidedSession(
  id: number,
  token: string | null,
): Promise<StudioGuidedSession> {
  return withToken(token, (authToken) =>
    studioFetch<StudioGuidedSession>(`${BASE}/${id}/`, {
      method: 'GET',
      token: authToken,
    }),
  );
}

export async function updateGuidedSessionDraft(
  id: number,
  payload: UpdateGuidedSessionDraftPayload,
  token: string | null,
): Promise<StudioGuidedSession> {
  return withToken(token, (authToken) =>
    studioFetch<StudioGuidedSession>(`${BASE}/${id}/`, {
      method: 'PATCH',
      body: payload,
      token: authToken,
    }),
  );
}

export async function listGuidedSessions(
  token: string | null,
): Promise<StudioGuidedSession[]> {
  return withToken(token, async (authToken) => {
    const data = await studioFetch<StudioGuidedSessionListResponse>(`${BASE}/`, {
      method: 'GET',
      token: authToken,
    });
    return normalizeGuidedSessionList(data).sort((a, b) => {
      const aTime = Date.parse(a.updated_at ?? a.created_at ?? '') || 0;
      const bTime = Date.parse(b.updated_at ?? b.created_at ?? '') || 0;
      return bTime - aTime;
    });
  });
}

export async function attachGuidedSessionMedia(
  id: number,
  payload: AttachGuidedSessionMediaPayload,
  token: string | null,
): Promise<StudioGuidedSession> {
  return withToken(token, (authToken) =>
    studioFetch<StudioGuidedSession>(`${BASE}/${id}/attach-media/`, {
      method: 'POST',
      body: payload,
      token: authToken,
    }),
  );
}

export async function detachGuidedSessionMedia(
  id: number,
  mediaRole: AttachGuidedSessionMediaPayload['media_role'],
  token: string | null,
): Promise<StudioGuidedSession> {
  return withToken(token, (authToken) =>
    studioFetch<StudioGuidedSession>(`${BASE}/${id}/detach-media/`, {
      method: 'POST',
      body: { media_role: mediaRole },
      token: authToken,
    }),
  );
}

/** Re-queue a failed video optimization (empty body). Returns updated session detail. */
export async function retryGuidedSessionVideoOptimization(
  id: number,
  token: string | null,
): Promise<StudioGuidedSession> {
  return withToken(token, (authToken) =>
    studioFetch<StudioGuidedSession>(`${BASE}/${id}/retry-video-optimization/`, {
      method: 'POST',
      token: authToken,
    }),
  );
}

export type StartMediaReplacementPayload = {
  extension?: string;
  media_type?: 'audio' | 'video';
};

export type AttachMediaReplacementPayload = {
  generation: string;
  storage_path: string;
  storage_url: string;
};

type MediaReplacementResponse = {
  media_replacement: StudioMediaReplacement | null;
};

export async function startGuidedSessionMediaReplacement(
  id: number,
  payload: StartMediaReplacementPayload,
  token: string | null,
): Promise<StudioMediaReplacement> {
  const data = await withToken(token, (authToken) =>
    studioFetch<MediaReplacementResponse>(`${BASE}/${id}/media-replacement/`, {
      method: 'POST',
      body: payload,
      token: authToken,
    }),
  );
  if (!data.media_replacement) {
    throw new Error('Media replacement did not start.');
  }
  return data.media_replacement;
}

export async function getGuidedSessionMediaReplacement(
  id: number,
  token: string | null,
): Promise<StudioMediaReplacement | null> {
  const data = await withToken(token, (authToken) =>
    studioFetch<MediaReplacementResponse>(`${BASE}/${id}/media-replacement/`, {
      method: 'GET',
      token: authToken,
    }),
  );
  return data.media_replacement;
}

export async function attachGuidedSessionMediaReplacement(
  id: number,
  payload: AttachMediaReplacementPayload,
  token: string | null,
): Promise<StudioMediaReplacement> {
  const data = await withToken(token, (authToken) =>
    studioFetch<MediaReplacementResponse>(`${BASE}/${id}/media-replacement/attach/`, {
      method: 'POST',
      body: payload,
      token: authToken,
    }),
  );
  if (!data.media_replacement) {
    throw new Error('Media replacement was not attached.');
  }
  return data.media_replacement;
}

export async function retryGuidedSessionMediaReplacement(
  id: number,
  generation: string,
  token: string | null,
): Promise<StudioMediaReplacement> {
  const data = await withToken(token, (authToken) =>
    studioFetch<MediaReplacementResponse>(`${BASE}/${id}/media-replacement/retry/`, {
      method: 'POST',
      body: { generation },
      token: authToken,
    }),
  );
  if (!data.media_replacement) {
    throw new Error('Media replacement could not be retried.');
  }
  return data.media_replacement;
}

export async function discardGuidedSessionMediaReplacement(
  id: number,
  generation: string,
  token: string | null,
): Promise<StudioMediaReplacement> {
  const data = await withToken(token, (authToken) =>
    studioFetch<MediaReplacementResponse>(`${BASE}/${id}/media-replacement/discard/`, {
      method: 'POST',
      body: { generation },
      token: authToken,
    }),
  );
  if (!data.media_replacement) {
    throw new Error('Media replacement could not be discarded.');
  }
  return data.media_replacement;
}

export async function publishGuidedSession(
  id: number,
  token: string | null,
): Promise<StudioGuidedSession> {
  return withToken(token, (authToken) =>
    studioFetch<StudioGuidedSession>(`${BASE}/${id}/publish/`, {
      method: 'POST',
      token: authToken,
    }),
  );
}
