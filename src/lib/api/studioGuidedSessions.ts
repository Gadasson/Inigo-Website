import { studioFetch, StudioApiError } from '@/lib/api/studioApiClient';

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
  thumbnail_url?: string | null;
  audio_url?: string | null;
  video_url?: string | null;
  has_audio?: boolean;
  has_video?: boolean;
  file_metadata?: Record<string, Record<string, unknown>>;
  created_at?: string;
  updated_at?: string;
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
