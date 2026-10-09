import { studioFetch, studioFetchForm, StudioApiError } from '@/lib/api/studioApiClient';
import type { RecipeVersionStatus, RecipeWriteBody } from '@/lib/studio/recipeEditor';

const BASE = '/api/studio/recipes';

export type StudioRecipeSummary = {
  id: number;
  archived_at: string | null;
  published_version_id: number | null;
  status: RecipeVersionStatus | null;
  title_he: string;
  title_en: string;
  updated_at: string | null;
};

export type StudioRecipeIngredient = {
  position: number;
  amount: string;
  name_he: string;
  name_en: string;
  name?: string;
};

export type StudioRecipeStep = {
  position: number;
  text_he: string;
  text_en: string;
  text?: string;
};

export type StudioRecipeVersion = {
  version_id: number;
  version_number: number;
  status: RecipeVersionStatus;
  title_he: string;
  title_en: string;
  description_he: string;
  description_en: string;
  credit_he: string;
  credit_en: string;
  source_url: string | null;
  source_name: string | null;
  image_is_illustration: boolean;
  cover_url: string | null;
  cover_storage_path: string | null;
  total_minutes: number | null;
  servings: number | null;
  meal_type: string | null;
  time_suitability: string[];
  dietary_tags: string[];
  display_language: string;
  title: string;
  description: string;
  credit: string;
  submitted_at: string | null;
  approved_at: string | null;
  ingredients: StudioRecipeIngredient[];
  steps: StudioRecipeStep[];
};

export type StudioRecipeDetail = {
  id: number;
  archived_at: string | null;
  published_version_id: number | null;
  draft: StudioRecipeVersion | null;
  published: Omit<StudioRecipeVersion, 'ingredients' | 'steps'> | null;
};

export type StudioRecipeOptions = {
  meal_types: string[];
  dietary_tags: string[];
  time_suitability: string[];
};

export type RecipeApiFailure = {
  reasonCode: string | null;
  detail: string;
  field: string | null;
};

async function withToken<T>(token: string | null, call: (authToken: string) => Promise<T>): Promise<T> {
  if (!token) throw new StudioApiError('Not authenticated', 401, null);
  return call(token);
}

export function parseRecipeApiFailure(error: unknown): RecipeApiFailure {
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

export async function listStudioRecipes(token: string | null): Promise<StudioRecipeSummary[]> {
  const data = await withToken(token, (authToken) =>
    studioFetch<{ results: StudioRecipeSummary[] }>(`${BASE}/`, { token: authToken }),
  );
  return data.results ?? [];
}

export async function createStudioRecipe(body: RecipeWriteBody, token: string | null): Promise<StudioRecipeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioRecipeDetail>(`${BASE}/`, { method: 'POST', body, token: authToken }),
  );
}

export async function getStudioRecipe(id: number, token: string | null): Promise<StudioRecipeDetail> {
  return withToken(token, (authToken) => studioFetch<StudioRecipeDetail>(`${BASE}/${id}/`, { token: authToken }));
}

export async function patchStudioRecipe(
  id: number,
  body: RecipeWriteBody,
  token: string | null,
): Promise<StudioRecipeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioRecipeDetail>(`${BASE}/${id}/`, { method: 'PATCH', body, token: authToken }),
  );
}

export async function getStudioRecipeOptions(token: string | null): Promise<StudioRecipeOptions> {
  return withToken(token, (authToken) =>
    studioFetch<StudioRecipeOptions>(`${BASE}/options/`, { token: authToken }),
  );
}

export async function uploadStudioRecipeCover(
  id: number,
  file: File,
  token: string | null,
): Promise<StudioRecipeDetail> {
  const formData = new FormData();
  formData.append('image', file);
  return withToken(token, (authToken) =>
    studioFetchForm<StudioRecipeDetail>(`${BASE}/${id}/cover/`, {
      method: 'POST',
      formData,
      token: authToken,
    }),
  );
}

export async function submitStudioRecipe(id: number, token: string | null): Promise<StudioRecipeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioRecipeDetail>(`${BASE}/${id}/submit/`, { method: 'POST', token: authToken }),
  );
}

export async function archiveStudioRecipe(id: number, token: string | null): Promise<StudioRecipeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioRecipeDetail>(`${BASE}/${id}/archive/`, { method: 'POST', token: authToken }),
  );
}

export async function unarchiveStudioRecipe(id: number, token: string | null): Promise<StudioRecipeDetail> {
  return withToken(token, (authToken) =>
    studioFetch<StudioRecipeDetail>(`${BASE}/${id}/unarchive/`, { method: 'POST', token: authToken }),
  );
}
