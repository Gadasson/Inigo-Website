import { normalizeTimeSuitability, type TimeSuitabilityValue } from '@/lib/studio/timeSuitability';

export const RECIPE_COVER_MAX_BYTES = 15 * 1024 * 1024;
export const RECIPE_COVER_MAX_EDGE_PX = 10_000;
export const RECIPE_COVER_MAX_PIXELS = 40_000_000;
export const RECIPE_SOURCE_URL_MAX = 500;

export const RECIPE_COVER_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export const RECIPE_COVER_RETRY_STORAGE_KEY = 'inigo.studio.recipeCoverRetry';

export type RecipeVersionStatus = 'draft' | 'pending_review' | 'approved';
export type RecipeCoverIssue = 'type' | 'size' | 'edge' | 'pixels';

export type RecipeIngredientDraft = {
  id: string;
  nameHe: string;
  nameEn: string;
  amount: string;
};

export type RecipeStepDraft = {
  id: string;
  textHe: string;
  textEn: string;
};

export type RecipeEditorForm = {
  titleHe: string;
  titleEn: string;
  descriptionHe: string;
  descriptionEn: string;
  creditHe: string;
  creditEn: string;
  imageIsIllustration: boolean;
  totalMinutes: string;
  servings: string;
  mealType: string;
  timeSuitability: TimeSuitabilityValue[];
  dietaryTags: string[];
  ingredients: RecipeIngredientDraft[];
  steps: RecipeStepDraft[];
  sourceName: string;
  sourceUrl: string;
  coverUrl: string | null;
};

export type RecipeSubmitIssue =
  | 'cover'
  | 'total_minutes'
  | 'servings'
  | 'meal_type'
  | 'credit'
  | 'ingredients'
  | 'steps'
  | 'language'
  | 'source_url';

export type RecipeErrorKey =
  | 'errors.versionNotEditable'
  | 'errors.notPublished'
  | 'errors.permission'
  | 'errors.notFound'
  | 'errors.coverUpload'
  | 'errors.titleHe'
  | 'errors.titleEn'
  | 'errors.descriptionHe'
  | 'errors.descriptionEn'
  | 'errors.creditHe'
  | 'errors.creditEn'
  | 'errors.credit'
  | 'errors.sourceName'
  | 'errors.sourceUrl'
  | 'errors.illustration'
  | 'errors.totalMinutes'
  | 'errors.servings'
  | 'errors.mealType'
  | 'errors.timeSuitability'
  | 'errors.dietaryTags'
  | 'errors.ingredients'
  | 'errors.steps'
  | 'errors.image'
  | 'errors.cover'
  | 'errors.language'
  | 'errors.status'
  | 'errors.validation'
  | 'errors.generic';

const FIELD_ERROR_KEYS: Record<string, RecipeErrorKey> = {
  title_he: 'errors.titleHe',
  title_en: 'errors.titleEn',
  description_he: 'errors.descriptionHe',
  description_en: 'errors.descriptionEn',
  credit_he: 'errors.creditHe',
  credit_en: 'errors.creditEn',
  credit: 'errors.credit',
  source_name: 'errors.sourceName',
  source_url: 'errors.sourceUrl',
  image_is_illustration: 'errors.illustration',
  total_minutes: 'errors.totalMinutes',
  servings: 'errors.servings',
  meal_type: 'errors.mealType',
  time_suitability: 'errors.timeSuitability',
  dietary_tags: 'errors.dietaryTags',
  ingredients: 'errors.ingredients',
  steps: 'errors.steps',
  image: 'errors.image',
  cover: 'errors.cover',
  language: 'errors.language',
  status: 'errors.status',
  body: 'errors.validation',
};

export type RecipeIngredientBody = {
  position: number;
  amount: string;
  name_he: string;
  name_en: string;
};

export type RecipeStepBody = {
  position: number;
  text_he: string;
  text_en: string;
};

export type RecipeWriteBody = {
  title_he?: string;
  title_en?: string;
  description_he?: string;
  description_en?: string;
  credit_he?: string;
  credit_en?: string;
  source_url?: string;
  source_name?: string;
  image_is_illustration?: boolean;
  total_minutes?: number | null;
  servings?: number | null;
  meal_type?: string | null;
  time_suitability?: TimeSuitabilityValue[];
  dietary_tags?: string[];
  ingredients?: RecipeIngredientBody[];
  steps?: RecipeStepBody[];
};

export function isRecipeDraftEditable(status: string | null | undefined): boolean {
  return status === 'draft';
}

export function isRecipePendingReview(status: string | null | undefined): boolean {
  return status === 'pending_review';
}

/** Approved content stays put until an explicit save. The click itself sends nothing. */
export function canReviseApprovedRecipe(status: string | null | undefined): boolean {
  return status === 'approved';
}

export function emptyRecipeIngredient(id: string): RecipeIngredientDraft {
  return { id, nameHe: '', nameEn: '', amount: '' };
}

export function emptyRecipeStep(id: string): RecipeStepDraft {
  return { id, textHe: '', textEn: '' };
}

export function emptyRecipeForm(): RecipeEditorForm {
  return {
    titleHe: '',
    titleEn: '',
    descriptionHe: '',
    descriptionEn: '',
    creditHe: '',
    creditEn: '',
    imageIsIllustration: false,
    totalMinutes: '',
    servings: '',
    mealType: '',
    timeSuitability: normalizeTimeSuitability(null),
    dietaryTags: [],
    ingredients: [emptyRecipeIngredient('ingredient-1')],
    steps: [emptyRecipeStep('step-1')],
    sourceName: '',
    sourceUrl: '',
    coverUrl: null,
  };
}

export function moveRecipeItems<T>(items: readonly T[], index: number, direction: -1 | 1): T[] {
  const nextIndex = index + direction;
  if (index < 0 || index >= items.length || nextIndex < 0 || nextIndex >= items.length) {
    return items.slice();
  }
  const copy = items.slice();
  const [item] = copy.splice(index, 1);
  copy.splice(nextIndex, 0, item);
  return copy;
}

export function removeRecipeItem<T>(items: readonly T[], index: number): T[] {
  if (index < 0 || index >= items.length) return items.slice();
  return items.filter((_, itemIndex) => itemIndex !== index);
}

function positiveIntOrNull(value: string): number | null {
  if (!/^\d+$/.test(value.trim())) return null;
  const parsed = Number(value.trim());
  if (!Number.isInteger(parsed) || parsed < 1) return null;
  return parsed;
}

export function recipeSourceUrlIssue(value: string): boolean {
  const stripped = value.trim();
  if (!stripped) return false;
  if (stripped.length > RECIPE_SOURCE_URL_MAX || /\s/.test(stripped)) return true;
  try {
    const url = new URL(stripped);
    return (url.protocol !== 'http:' && url.protocol !== 'https:') || !url.hostname;
  } catch {
    return true;
  }
}

export function recipeLanguageComplete(form: RecipeEditorForm, lang: 'he' | 'en'): boolean {
  const title = lang === 'he' ? form.titleHe : form.titleEn;
  if (!title.trim() || form.ingredients.length === 0 || form.steps.length === 0) return false;
  for (const ingredient of form.ingredients) {
    const name = lang === 'he' ? ingredient.nameHe : ingredient.nameEn;
    if (!name.trim()) return false;
  }
  for (const step of form.steps) {
    const text = lang === 'he' ? step.textHe : step.textEn;
    if (!text.trim()) return false;
  }
  return true;
}

export function recipeSubmissionIssue(
  form: RecipeEditorForm,
  options?: { mealTypes?: readonly string[] },
): RecipeSubmitIssue | null {
  if (recipeSourceUrlIssue(form.sourceUrl)) return 'source_url';
  if (!form.coverUrl?.trim()) return 'cover';
  if (positiveIntOrNull(form.totalMinutes) == null) return 'total_minutes';
  if (positiveIntOrNull(form.servings) == null) return 'servings';
  if (!form.mealType.trim()) return 'meal_type';
  if (options?.mealTypes && !options.mealTypes.includes(form.mealType)) return 'meal_type';
  if (!form.creditHe.trim() && !form.creditEn.trim()) return 'credit';
  if (form.ingredients.length === 0 || form.ingredients.some((item) => !item.amount.trim())) {
    return 'ingredients';
  }
  if (form.steps.length === 0) return 'steps';
  if (!recipeLanguageComplete(form, 'he') && !recipeLanguageComplete(form, 'en')) return 'language';
  return null;
}

export function buildRecipeIngredientBody(ingredients: readonly RecipeIngredientDraft[]): RecipeIngredientBody[] {
  return ingredients.map((item, index) => ({
    position: index + 1,
    amount: item.amount.trim(),
    name_he: item.nameHe.trim(),
    name_en: item.nameEn.trim(),
  }));
}

export function buildRecipeStepBody(steps: readonly RecipeStepDraft[]): RecipeStepBody[] {
  return steps.map((item, index) => ({
    position: index + 1,
    text_he: item.textHe.trim(),
    text_en: item.textEn.trim(),
  }));
}

export function buildRecipeWriteBody(
  form: RecipeEditorForm,
  options: { includeDetails: boolean; includeLines: boolean; includeCreditHe: boolean; includeCreditEn: boolean },
): RecipeWriteBody {
  const body: RecipeWriteBody = {};
  if (options.includeDetails) {
    body.title_he = form.titleHe.trim();
    body.title_en = form.titleEn.trim();
    body.description_he = form.descriptionHe.trim();
    body.description_en = form.descriptionEn.trim();
    body.source_name = form.sourceName.trim();
    body.source_url = form.sourceUrl.trim();
    body.image_is_illustration = form.imageIsIllustration;
    body.total_minutes = positiveIntOrNull(form.totalMinutes);
    body.servings = positiveIntOrNull(form.servings);
    body.meal_type = form.mealType.trim() ? form.mealType.trim() : null;
    body.time_suitability = normalizeTimeSuitability(form.timeSuitability);
    body.dietary_tags = form.dietaryTags.slice();
    if (options.includeCreditHe) body.credit_he = form.creditHe.trim();
    if (options.includeCreditEn) body.credit_en = form.creditEn.trim();
  }
  if (options.includeLines) {
    body.ingredients = buildRecipeIngredientBody(form.ingredients);
    body.steps = buildRecipeStepBody(form.steps);
  }
  return body;
}

function detailsSignature(form: RecipeEditorForm): string {
  return JSON.stringify(
    buildRecipeWriteBody(form, { includeDetails: true, includeLines: false, includeCreditHe: true, includeCreditEn: true }),
  );
}

function linesSignature(form: RecipeEditorForm): string {
  return JSON.stringify(
    buildRecipeWriteBody(form, { includeDetails: false, includeLines: true, includeCreditHe: false, includeCreditEn: false }),
  );
}

export function recipeDetailsDirty(form: RecipeEditorForm, baseline: RecipeEditorForm): boolean {
  return detailsSignature(form) !== detailsSignature(baseline);
}

export function recipeLinesDirty(form: RecipeEditorForm, baseline: RecipeEditorForm): boolean {
  return linesSignature(form) !== linesSignature(baseline);
}

/**
 * An explicit save of an approved recipe sends PATCH even when the fields
 * match, so the server can open a draft. A clean draft sends nothing.
 * Credit is included only for a side the creator edited, so an omitted
 * credit is not sent as an empty string. Cover bytes are a separate
 * request and are skipped when details fail.
 */
export function recipeSavePlan(input: {
  hasRecipeId: boolean;
  revisingApproved: boolean;
  detailsDirty: boolean;
  linesDirty: boolean;
  coverPending: boolean;
  creditHeEdited: boolean;
  creditEnEdited: boolean;
}): {
  sendDetails: boolean;
  sendLines: boolean;
  sendCover: boolean;
  includeCreditHe: boolean;
  includeCreditEn: boolean;
} {
  if (!input.hasRecipeId) {
    return {
      sendDetails: true,
      sendLines: true,
      sendCover: input.coverPending,
      includeCreditHe: input.creditHeEdited,
      includeCreditEn: input.creditEnEdited,
    };
  }
  const sendDetails = input.detailsDirty || input.revisingApproved;
  return {
    sendDetails,
    sendLines: input.linesDirty,
    sendCover: input.coverPending,
    includeCreditHe: sendDetails && input.creditHeEdited,
    includeCreditEn: sendDetails && input.creditEnEdited,
  };
}

/**
 * After create, fill in only the credit sides the user left untouched.
 * A credit they typed stays, and every other local field stays.
 */
export function mergeRecipeCreateCredit(
  local: RecipeEditorForm,
  server: { credit_he?: string | null; credit_en?: string | null },
  edited: { he: boolean; en: boolean },
): RecipeEditorForm {
  return {
    ...local,
    creditHe: edited.he ? local.creditHe : (server.credit_he ?? ''),
    creditEn: edited.en ? local.creditEn : (server.credit_en ?? ''),
  };
}

export function recipeSaveSendsWrite(plan: { sendDetails: boolean; sendLines: boolean }): boolean {
  return plan.sendDetails || plan.sendLines;
}

export type RecipeSaveOutcome = {
  complete: boolean;
  canSubmit: boolean;
  failedPart: 'details' | 'cover' | null;
  recipeId: number | null;
};

export function recipeSaveOutcome(input: {
  recipeId: number | null;
  detailsAttempted: boolean;
  detailsFailed: boolean;
  coverAttempted: boolean;
  coverFailed: boolean;
}): RecipeSaveOutcome {
  if (!input.recipeId || (input.detailsAttempted && input.detailsFailed)) {
    return {
      complete: false,
      canSubmit: false,
      failedPart: 'details',
      recipeId: input.recipeId,
    };
  }
  if (input.coverAttempted && input.coverFailed) {
    return {
      complete: false,
      canSubmit: false,
      failedPart: 'cover',
      recipeId: input.recipeId,
    };
  }
  return { complete: true, canSubmit: true, failedPart: null, recipeId: input.recipeId };
}

export function canSubmitRecipe(input: {
  status: string | null | undefined;
  dirty: boolean;
  coverPending: boolean;
  saveComplete: boolean;
  ready: boolean;
}): boolean {
  return (
    isRecipeDraftEditable(input.status) &&
    !input.dirty &&
    !input.coverPending &&
    input.saveComplete &&
    input.ready
  );
}

/** Cover responses update the image only. Unsaved local fields stay in the form. */
export function recipeFormWithCover(form: RecipeEditorForm, coverUrl: string | null): RecipeEditorForm {
  return { ...form, coverUrl };
}

export type RecipeVersionRef = {
  status: RecipeVersionStatus;
  versionId: number;
  versionNumber: number;
};

/**
 * A cover upload on an approved recipe opens a new draft.
 * Adopt that draft's status and ids, and the new cover URL.
 * Leave every unsaved local field as it is.
 */
export function patchRecipeDraftVersion<T extends {
  status: RecipeVersionStatus;
  version_id: number;
  version_number: number;
  cover_url: string | null;
  cover_storage_path: string | null;
}>(
  current: T,
  incoming: {
    status: RecipeVersionStatus;
    version_id: number;
    version_number: number;
    cover_url: string | null;
    cover_storage_path: string | null;
  },
): T {
  return {
    ...current,
    status: incoming.status,
    version_id: incoming.version_id,
    version_number: incoming.version_number,
    cover_url: incoming.cover_url,
    cover_storage_path: incoming.cover_storage_path,
  };
}

export function applyRecipeCoverResponse(
  local: RecipeEditorForm,
  draft: {
    status: RecipeVersionStatus;
    version_id: number;
    version_number: number;
    cover_url: string | null;
  },
): { form: RecipeEditorForm; version: RecipeVersionRef } {
  return {
    form: recipeFormWithCover(local, draft.cover_url?.trim() ? draft.cover_url : null),
    version: {
      status: draft.status,
      versionId: draft.version_id,
      versionNumber: draft.version_number,
    },
  };
}

export function validateRecipeCoverMeta(input: {
  mimeType: string;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
}): RecipeCoverIssue | null {
  const mime = input.mimeType.toLowerCase() === 'image/jpg' ? 'image/jpeg' : input.mimeType.toLowerCase();
  if (!RECIPE_COVER_MIME_TYPES.includes(mime as (typeof RECIPE_COVER_MIME_TYPES)[number])) return 'type';
  if (!Number.isFinite(input.sizeBytes) || input.sizeBytes < 1 || input.sizeBytes > RECIPE_COVER_MAX_BYTES) {
    return 'size';
  }
  if (input.width != null && input.height != null) {
    if (
      !Number.isFinite(input.width) ||
      !Number.isFinite(input.height) ||
      input.width < 1 ||
      input.height < 1
    ) {
      return 'type';
    }
    if (input.width > RECIPE_COVER_MAX_EDGE_PX || input.height > RECIPE_COVER_MAX_EDGE_PX) return 'edge';
    if (input.width * input.height > RECIPE_COVER_MAX_PIXELS) return 'pixels';
  }
  return null;
}

export function recipeErrorMessageKey(input: {
  reasonCode: string | null;
  field: string | null;
}): RecipeErrorKey {
  if (input.reasonCode === 'version_not_editable') return 'errors.versionNotEditable';
  if (input.reasonCode === 'recipe_not_published') return 'errors.notPublished';
  if (input.reasonCode === 'permission_denied' || input.reasonCode === 'not_owner') return 'errors.permission';
  if (input.reasonCode === 'recipe_not_found') return 'errors.notFound';
  if (input.reasonCode === 'cover_upload_failed') return 'errors.coverUpload';
  if (input.field && FIELD_ERROR_KEYS[input.field]) return FIELD_ERROR_KEYS[input.field];
  if (input.reasonCode === 'validation_failed') return 'errors.validation';
  return 'errors.generic';
}

export function toggleDietaryTag(
  current: readonly string[],
  tag: string,
  allowed: readonly string[],
): string[] {
  if (!allowed.includes(tag)) return allowed.filter((item) => current.includes(item));
  const next = new Set(current);
  if (next.has(tag)) next.delete(tag);
  else next.add(tag);
  return allowed.filter((item) => next.has(item));
}

export function recipeListTitle(
  row: { title_en?: string | null; title_he?: string | null },
  locale: 'en' | 'he',
): string {
  const en = row.title_en?.trim() ?? '';
  const he = row.title_he?.trim() ?? '';
  if (locale === 'he') return he || en;
  return en || he;
}

export type RecipeServerIngredient = {
  position: number;
  amount: string;
  name_he: string;
  name_en: string;
};

export type RecipeServerStep = {
  position: number;
  text_he: string;
  text_en: string;
};

export function recipeFormFromServer(draft: {
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
  total_minutes: number | null;
  servings: number | null;
  meal_type: string | null;
  time_suitability: readonly string[];
  dietary_tags: readonly string[];
  ingredients: readonly RecipeServerIngredient[];
  steps: readonly RecipeServerStep[];
}): RecipeEditorForm {
  const ingredients = [...draft.ingredients].sort((a, b) => a.position - b.position);
  const steps = [...draft.steps].sort((a, b) => a.position - b.position);
  return {
    titleHe: draft.title_he ?? '',
    titleEn: draft.title_en ?? '',
    descriptionHe: draft.description_he ?? '',
    descriptionEn: draft.description_en ?? '',
    creditHe: draft.credit_he ?? '',
    creditEn: draft.credit_en ?? '',
    imageIsIllustration: draft.image_is_illustration === true,
    totalMinutes: draft.total_minutes == null ? '' : String(draft.total_minutes),
    servings: draft.servings == null ? '' : String(draft.servings),
    mealType: draft.meal_type ?? '',
    timeSuitability: normalizeTimeSuitability(draft.time_suitability),
    dietaryTags: draft.dietary_tags.filter((tag): tag is string => typeof tag === 'string'),
    ingredients: ingredients.map((item) => ({
      id: `ingredient-${item.position}`,
      nameHe: item.name_he ?? '',
      nameEn: item.name_en ?? '',
      amount: item.amount ?? '',
    })),
    steps: steps.map((item) => ({
      id: `step-${item.position}`,
      textHe: item.text_he ?? '',
      textEn: item.text_en ?? '',
    })),
    sourceName: draft.source_name ?? '',
    sourceUrl: draft.source_url ?? '',
    coverUrl: draft.cover_url?.trim() ? draft.cover_url : null,
  };
}

export function markRecipeCoverRetry(recipeId: number): void {
  if (typeof sessionStorage === 'undefined') return;
  sessionStorage.setItem(RECIPE_COVER_RETRY_STORAGE_KEY, String(recipeId));
}

export function takeRecipeCoverRetry(recipeId: number): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  const stored = sessionStorage.getItem(RECIPE_COVER_RETRY_STORAGE_KEY);
  if (stored !== String(recipeId)) return false;
  sessionStorage.removeItem(RECIPE_COVER_RETRY_STORAGE_KEY);
  return true;
}
