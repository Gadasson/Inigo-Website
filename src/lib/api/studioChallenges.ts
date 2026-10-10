import { studioFetch, studioFetchForm, StudioApiError } from '@/lib/api/studioApiClient';
import type { ChallengeDetailsBody, ChallengeStepBody } from '@/lib/studio/challengeEditor';
import { buildSessionOptionsPath, challengeCoverFormData, type SessionOptionOwner } from '@/lib/studio/challengeEditor';

const BASE = '/api/studio/challenges';

export type ChallengeVersionStatus = 'draft' | 'pending_review' | 'approved';

export type StudioChallengeSummary = {
  id: number;
  archived_at: string | null;
  published_version_id: number | null;
  status: ChallengeVersionStatus | null;
  title_en: string;
  title_he: string;
  updated_at: string | null;
};

export type StudioChallengeStep = {
  position: number;
  kind: 'silent' | 'guided';
  practice_type: string | null;
  duration_minutes: number | null;
  guided_template_id: number | null;
  guided_session_id: string | null;
  title: string | null;
  duration_seconds: number | null;
  launch_target?: Record<string, unknown>;
};

export type StudioChallengeDraft = {
  id: number;
  version_number: number;
  status: ChallengeVersionStatus;
  days_per_week: number;
  schedule: 'fixed_weeks' | 'ongoing';
  week_count: number | null;
  title_en: string;
  title_he: string;
  description_en: string;
  description_he: string;
  cover_url: string | null;
  cover_storage_path: string | null;
  total_duration_seconds: number;
  submitted_at: string | null;
  approved_at: string | null;
};

export type StudioChallengeDetail = {
  id: number;
  archived_at: string | null;
  published_version_id: number | null;
  draft: StudioChallengeDraft | null;
  steps: StudioChallengeStep[];
  versions: { id: number; version_number: number; status: ChallengeVersionStatus }[];
};

export type ChallengeSessionOption = {
  id: number;
  session_id: string;
  title: string;
  duration_seconds: number | null;
  owner_kind: 'self' | 'platform' | 'other_guide';
  media_kind: string | null;
};

export type ChallengeApiFailure = {
  reasonCode: string | null;
  detail: string;
  field: string | null;
};

async function withToken<T>(token: string | null, call: (authToken: string) => Promise<T>): Promise<T> {
  if (!token) throw new StudioApiError('Not authenticated', 401, null);
  return call(token);
}

export function parseChallengeApiFailure(error: unknown): ChallengeApiFailure {
  if (error instanceof StudioApiError && error.body && typeof error.body === 'object' && !Array.isArray(error.body)) {
    const body = error.body as { reason_code?: unknown; detail?: unknown; details?: unknown };
    const reasonCode = typeof body.reason_code === 'string' ? body.reason_code : null;
    const details =
      body.details && typeof body.details === 'object' && !Array.isArray(body.details)
        ? (body.details as { field?: unknown })
        : null;
    const field = details && typeof details.field === 'string' ? details.field : null;
    return {
      reasonCode,
      detail: typeof body.detail === 'string' && body.detail.trim() ? body.detail : reasonCode || error.message,
      field,
    };
  }
  if (error instanceof Error && error.message.trim()) {
    return { reasonCode: null, detail: error.message, field: null };
  }
  return { reasonCode: null, detail: 'Something went wrong. Please try again.', field: null };
}

export async function listStudioChallenges(token: string | null): Promise<StudioChallengeSummary[]> {
  const data = await withToken(token, (authToken) =>
    studioFetch<{ results: StudioChallengeSummary[] }>(`${BASE}/`, { token: authToken }),
  );
  return data.results ?? [];
}

export async function createStudioChallenge(
  body: ChallengeDetailsBody & { steps: ChallengeStepBody[] },
  token: string | null,
): Promise<StudioChallengeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioChallengeDetail>(`${BASE}/`, { method: 'POST', body, token: authToken }),
  );
}

export async function getStudioChallenge(id: number, token: string | null): Promise<StudioChallengeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioChallengeDetail>(`${BASE}/${id}/`, { token: authToken }),
  );
}

export async function patchStudioChallenge(
  id: number,
  body: ChallengeDetailsBody,
  token: string | null,
): Promise<StudioChallengeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioChallengeDetail>(`${BASE}/${id}/`, { method: 'PATCH', body, token: authToken }),
  );
}

export async function uploadStudioChallengeCover(
  id: number,
  file: File,
  token: string | null,
): Promise<StudioChallengeDetail> {
  return withToken(token, (authToken) =>
    studioFetchForm<StudioChallengeDetail>(`${BASE}/${id}/cover/`, {
      method: 'POST',
      formData: challengeCoverFormData(file),
      token: authToken,
    }),
  );
}

export async function replaceStudioChallengeSteps(
  id: number,
  steps: ChallengeStepBody[],
  token: string | null,
): Promise<StudioChallengeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioChallengeDetail>(`${BASE}/${id}/steps/`, {
      method: 'PUT',
      body: { steps },
      token: authToken,
    }),
  );
}

export async function submitStudioChallenge(id: number, token: string | null): Promise<StudioChallengeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioChallengeDetail>(`${BASE}/${id}/submit/`, { method: 'POST', token: authToken }),
  );
}

export async function archiveStudioChallenge(id: number, token: string | null): Promise<StudioChallengeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioChallengeDetail>(`${BASE}/${id}/archive/`, { method: 'POST', token: authToken }),
  );
}

export async function listChallengeSessionOptions(
  input: { q?: string; ownerKind?: SessionOptionOwner },
  token: string | null,
): Promise<ChallengeSessionOption[]> {
  const data = await withToken(token, (authToken) =>
    studioFetch<{ results: ChallengeSessionOption[] }>(buildSessionOptionsPath(input), { token: authToken }),
  );
  return data.results ?? [];
}
