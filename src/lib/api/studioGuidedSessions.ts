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
  instructor?: string;
};

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
