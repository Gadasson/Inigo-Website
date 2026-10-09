import {
  emptyRecipeForm,
  emptyRecipeIngredient,
  emptyRecipeStep,
  recipeLanguageComplete,
  recipeSourceUrlIssue,
  type RecipeEditorForm,
} from '@/lib/studio/recipeEditor';
import { TIME_SUITABILITY_ORDER, normalizeTimeSuitability, type TimeSuitabilityValue } from '@/lib/studio/timeSuitability';

export const RECIPE_IMPORT_MEAL_TYPES = [
  'breakfast',
  'main',
  'salad_side',
  'soup',
  'snack',
  'dessert',
  'drink',
  'spread_sauce',
] as const;

export const RECIPE_IMPORT_DIETARY_TAGS = ['vegetarian', 'vegan'] as const;

const TITLE_MAX = 160;
const DESCRIPTION_MAX = 4000;
const CREDIT_MAX = 80;
const SOURCE_NAME_MAX = 200;
const AMOUNT_MAX = 80;
const INGREDIENT_NAME_MAX = 200;
const STEP_MAX = 4000;
const INGREDIENT_MAX = 60;
const STEP_COUNT_MAX = 40;

const ALLOWED_KEYS = new Set([
  'title_he',
  'title_en',
  'description_he',
  'description_en',
  'credit_he',
  'credit_en',
  'total_minutes',
  'servings',
  'meal_type',
  'time_suitability',
  'dietary_tags',
  'ingredients',
  'steps',
  'source_url',
  'source_name',
  'image_is_illustration',
]);

const FORBIDDEN_KEYS = new Set([
  'cover_url',
  'cover_storage_path',
  'image',
  'storage_path',
  'storage_url',
  'status',
  'id',
  'recipe_id',
  'owner',
  'published_version',
  'published_version_id',
  'archived_at',
  'version_id',
  'version_number',
  'display_language',
  'title',
  'description',
  'credit',
  'name',
  'text',
]);

export type RecipeImportCatalog = {
  mealTypes: readonly string[];
  dietaryTags: readonly string[];
  timeSuitability: readonly string[];
};

export const DEFAULT_RECIPE_IMPORT_CATALOG: RecipeImportCatalog = {
  mealTypes: RECIPE_IMPORT_MEAL_TYPES,
  dietaryTags: RECIPE_IMPORT_DIETARY_TAGS,
  timeSuitability: TIME_SUITABILITY_ORDER,
};

export type RecipeImportIssue =
  | 'empty'
  | 'notJson'
  | 'multipleBlocks'
  | 'notObject'
  | 'forbidden'
  | 'unknownField'
  | 'type'
  | 'number'
  | 'mealType'
  | 'timeSuitability'
  | 'dietaryTags'
  | 'ingredients'
  | 'steps'
  | 'language'
  | 'sourceUrl'
  | 'tooLong'
  | 'illustration';

export type RecipeImportResult =
  | {
      ok: true;
      form: RecipeEditorForm;
      creditHeProvided: boolean;
      creditEnProvided: boolean;
    }
  | { ok: false; issue: RecipeImportIssue };

/** Pasting a recipe never calls the network. Saving stays a separate explicit action. */
export function recipePastePerformsRequest(): false {
  return false;
}

export type RecipePromptCopy =
  | { status: 'needRequest' }
  | { status: 'copied'; prompt: string }
  | { status: 'manual'; prompt: string };

/** Decide what the creator sees after asking to copy. An empty request is not copied. */
export function recipePromptCopy(
  locale: 'he' | 'en',
  request: string,
  clipboardWrote: boolean,
  catalog: RecipeImportCatalog = DEFAULT_RECIPE_IMPORT_CATALOG,
): RecipePromptCopy {
  const trimmed = request.trim();
  if (!trimmed) return { status: 'needRequest' };
  const prompt = recipeImportPrompt(locale, catalog, trimmed);
  return clipboardWrote ? { status: 'copied', prompt } : { status: 'manual', prompt };
}

export function recipeImportPrompt(
  locale: 'he' | 'en',
  catalog: RecipeImportCatalog = DEFAULT_RECIPE_IMPORT_CATALOG,
  request = '',
): string {
  const meals = catalog.mealTypes.join(', ');
  const times = catalog.timeSuitability.join(', ');
  const shape = `{
  "title_he": "",
  "title_en": "",
  "description_he": "",
  "description_en": "",
  "credit_he": "",
  "credit_en": "",
  "total_minutes": 0,
  "servings": 0,
  "meal_type": "",
  "time_suitability": [],
  "dietary_tags": [],
  "ingredients": [{ "position": 1, "amount": "", "name_he": "", "name_en": "" }],
  "steps": [{ "position": 1, "text_he": "", "text_en": "" }],
  "source_url": null,
  "source_name": null,
  "image_is_illustration": false
}`;

  const instructions =
    locale === 'he'
      ? [
      'הכן מתכון לפי הבקשה שלי, והחזר אובייקט JSON אחד בלבד. בלי טקסט לפניו או אחריו.',
      'כתוב את המתכון בעברית ובאנגלית. אם שפה אחת אינה מלאה, החזר לפחות שפה שלמה אחת: כותרת, שם לכל מצרך, וטקסט לכל שלב.',
      'הזמן הוא הזמן הכולל בדקות עד שהמנה מוכנה, כולל המתנה, בישול או קירור.',
      'אל תמציא מקור, קרדיט, טענות רפואיות או סיווג תזונה.',
      'אם המקור לא ידוע, source_url ו-source_name נשארים null.',
      'אם לא מסרתי קרדיט, אל תכלול את credit_he ואת credit_en.',
      'image_is_illustration נשאר false, אלא אם אמרתי שהתמונה תהיה המחשה.',
      'אין להוסיף שדות תמונה, כתובות אחסון, מזהה מתכון או סטטוס.',
      'זו הצעה שאני צריך לבדוק לפני פרסום.',
      `סוגי מנה מותרים: ${meals}.`,
      `זמני יום מותרים: ${times}.`,
      'מותר ליצור מתכונים עם בשר או דגים. vegetarian ו-vegan הן תגיות אופציונליות בלבד. אם אינן מתאימות, החזר dietary_tags: [].',
      'amount הוא שדה אחד לשתי השפות. כשצריך, נסח אותו בשתי השפות, למשל "2 כפות / 2 tbsp".',
      'המבנה:',
      shape,
    ].join('\n')
      : [
    'Prepare a recipe from my request and return one JSON object only. No text before or after it.',
    'Write the recipe in Hebrew and English. If one language is incomplete, still return at least one complete language: a title, a name for every ingredient, and text for every step.',
    'The time is the total minutes until the dish is ready, including waiting, cooking, or cooling.',
    'Do not invent a source, a credit, medical claims, or a dietary label.',
    'If the source is unknown, source_url and source_name stay null.',
    'If I did not give a credit, leave credit_he and credit_en out of the object.',
    'image_is_illustration stays false unless I said the image will be an illustration.',
    'Do not add image fields, storage addresses, a recipe id, or statuses.',
    'This is a suggestion I need to review before publishing.',
    `Allowed dish types: ${meals}.`,
    `Allowed times of day: ${times}.`,
    'Recipes with meat or fish are allowed. vegetarian and vegan are optional tags only. If they do not apply, return dietary_tags: [].',
    'amount is one field shared by both languages. When needed, write it in both, for example "2 כפות / 2 tbsp".',
    'The shape:',
    shape,
  ].join('\n');
  return withRecipeRequest(instructions, locale, request);
}

function withRecipeRequest(instructions: string, locale: 'he' | 'en', request: string): string {
  const heading = locale === 'he' ? 'הבקשה שלי:' : 'My request:';
  const trimmed = request.trim();
  return trimmed ? `${instructions}\n${heading}\n${trimmed}` : `${instructions}\n${heading}`;
}

export function recipeFormHasContent(form: RecipeEditorForm): boolean {
  if (
    form.titleHe.trim() ||
    form.titleEn.trim() ||
    form.descriptionHe.trim() ||
    form.descriptionEn.trim() ||
    form.creditHe.trim() ||
    form.creditEn.trim() ||
    form.sourceName.trim() ||
    form.sourceUrl.trim() ||
    form.totalMinutes.trim() ||
    form.servings.trim() ||
    form.mealType.trim() ||
    form.imageIsIllustration ||
    form.dietaryTags.length > 0
  ) {
    return true;
  }
  if (form.ingredients.some((item) => item.nameHe.trim() || item.nameEn.trim() || item.amount.trim())) return true;
  if (form.steps.some((item) => item.textHe.trim() || item.textEn.trim())) return true;
  return false;
}

export function recipeImportNeedsConfirmation(form: RecipeEditorForm): boolean {
  return recipeFormHasContent(form);
}

/** Replace recipe text with the import. The current cover stays. */
export function applyRecipeImport(current: RecipeEditorForm, imported: RecipeEditorForm): RecipeEditorForm {
  return { ...imported, coverUrl: current.coverUrl };
}

function fail(issue: RecipeImportIssue): RecipeImportResult {
  return { ok: false, issue };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractJsonText(raw: string): { ok: true; text: string } | { ok: false; issue: RecipeImportIssue } {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, issue: 'empty' };
  if (trimmed.startsWith('{')) return { ok: true, text: trimmed };
  const fences = trimmed.match(/```/g);
  if (!fences) return { ok: false, issue: 'notJson' };
  if (fences.length !== 2) return { ok: false, issue: 'multipleBlocks' };
  const match = trimmed.match(/^```([A-Za-z0-9_-]*)[ \t]*\r?\n([\s\S]*?)\r?\n?```$/);
  if (!match || match[1].toLowerCase() !== 'json') return { ok: false, issue: 'notJson' };
  return { ok: true, text: match[2].trim() };
}

function optionalString(
  record: Record<string, unknown>,
  key: string,
  limit: number,
): { ok: true; value: string; present: boolean } | { ok: false; issue: RecipeImportIssue } {
  if (!Object.prototype.hasOwnProperty.call(record, key) || record[key] == null) {
    return { ok: true, value: '', present: false };
  }
  if (typeof record[key] !== 'string') return { ok: false, issue: 'type' };
  const value = record[key].trim();
  if (value.length > limit) return { ok: false, issue: 'tooLong' };
  return { ok: true, value, present: value.length > 0 };
}

function requiredString(value: unknown, limit: number): { ok: true; value: string } | { ok: false; issue: RecipeImportIssue } {
  if (typeof value !== 'string') return { ok: false, issue: 'type' };
  const trimmed = value.trim();
  if (trimmed.length > limit) return { ok: false, issue: 'tooLong' };
  return { ok: true, value: trimmed };
}

function positiveInt(value: unknown): { ok: true; value: number } | { ok: false; issue: RecipeImportIssue } {
  if (typeof value !== 'number' || !Number.isInteger(value) || value < 1) return { ok: false, issue: 'number' };
  return { ok: true, value };
}

export function parseRecipeImport(
  raw: string,
  catalog: RecipeImportCatalog = DEFAULT_RECIPE_IMPORT_CATALOG,
): RecipeImportResult {
  const extracted = extractJsonText(raw);
  if (!extracted.ok) return extracted;
  let parsed: unknown;
  try {
    parsed = JSON.parse(extracted.text);
  } catch {
    return fail('notJson');
  }
  if (!isRecord(parsed)) return fail('notObject');

  for (const key of Object.keys(parsed)) {
    if (FORBIDDEN_KEYS.has(key)) return fail('forbidden');
    if (!ALLOWED_KEYS.has(key)) return fail('unknownField');
  }

  const titleHe = optionalString(parsed, 'title_he', TITLE_MAX);
  if (!titleHe.ok) return titleHe;
  const titleEn = optionalString(parsed, 'title_en', TITLE_MAX);
  if (!titleEn.ok) return titleEn;
  const descriptionHe = optionalString(parsed, 'description_he', DESCRIPTION_MAX);
  if (!descriptionHe.ok) return descriptionHe;
  const descriptionEn = optionalString(parsed, 'description_en', DESCRIPTION_MAX);
  if (!descriptionEn.ok) return descriptionEn;
  const creditHe = optionalString(parsed, 'credit_he', CREDIT_MAX);
  if (!creditHe.ok) return creditHe;
  const creditEn = optionalString(parsed, 'credit_en', CREDIT_MAX);
  if (!creditEn.ok) return creditEn;
  const sourceName = optionalString(parsed, 'source_name', SOURCE_NAME_MAX);
  if (!sourceName.ok) return sourceName;

  if (!positiveInt(parsed.total_minutes).ok || !positiveInt(parsed.servings).ok) return fail('number');
  const minutes = positiveInt(parsed.total_minutes);
  const servings = positiveInt(parsed.servings);
  if (!minutes.ok || !servings.ok) return fail('number');

  if (typeof parsed.meal_type !== 'string' || !catalog.mealTypes.includes(parsed.meal_type)) return fail('mealType');

  if (!Array.isArray(parsed.time_suitability)) return fail('timeSuitability');
  for (const item of parsed.time_suitability) {
    if (typeof item !== 'string' || !catalog.timeSuitability.includes(item)) return fail('timeSuitability');
  }
  const timeSuitability = normalizeTimeSuitability(parsed.time_suitability);

  if (!Array.isArray(parsed.dietary_tags)) return fail('dietaryTags');
  const dietSeen = new Set<string>();
  for (const item of parsed.dietary_tags) {
    if (typeof item !== 'string' || !catalog.dietaryTags.includes(item)) return fail('dietaryTags');
    dietSeen.add(item);
  }
  const dietaryTags = catalog.dietaryTags.filter((tag) => dietSeen.has(tag));

  if (!Array.isArray(parsed.ingredients) || parsed.ingredients.length < 1 || parsed.ingredients.length > INGREDIENT_MAX) {
    return fail('ingredients');
  }
  const ingredients = [];
  for (let index = 0; index < parsed.ingredients.length; index += 1) {
    const item = parsed.ingredients[index];
    if (!isRecord(item)) return fail('ingredients');
    for (const key of Object.keys(item)) {
      if (key !== 'position' && key !== 'amount' && key !== 'name_he' && key !== 'name_en') return fail('ingredients');
    }
    if ('position' in item && item.position != null) {
      if (typeof item.position !== 'number' || !Number.isInteger(item.position) || item.position < 1) {
        return fail('ingredients');
      }
    }
    const amount = requiredString(item.amount, AMOUNT_MAX);
    const nameHe = requiredString(item.name_he, INGREDIENT_NAME_MAX);
    const nameEn = requiredString(item.name_en, INGREDIENT_NAME_MAX);
    const ingredientFields = [amount, nameHe, nameEn];
    const ingredientFailure = ingredientFields.find((field) => !field.ok);
    if (ingredientFailure && !ingredientFailure.ok) {
      return fail(ingredientFailure.issue === 'tooLong' ? 'tooLong' : 'ingredients');
    }
    if (!amount.ok || !nameHe.ok || !nameEn.ok || !amount.value) return fail('ingredients');
    ingredients.push({
      ...emptyRecipeIngredient(`ingredient-${index + 1}`),
      amount: amount.value,
      nameHe: nameHe.value,
      nameEn: nameEn.value,
    });
  }

  if (!Array.isArray(parsed.steps) || parsed.steps.length < 1 || parsed.steps.length > STEP_COUNT_MAX) {
    return fail('steps');
  }
  const steps = [];
  for (let index = 0; index < parsed.steps.length; index += 1) {
    const item = parsed.steps[index];
    if (!isRecord(item)) return fail('steps');
    for (const key of Object.keys(item)) {
      if (key !== 'position' && key !== 'text_he' && key !== 'text_en') return fail('steps');
    }
    if ('position' in item && item.position != null) {
      if (typeof item.position !== 'number' || !Number.isInteger(item.position) || item.position < 1) {
        return fail('steps');
      }
    }
    const textHe = requiredString(item.text_he, STEP_MAX);
    const textEn = requiredString(item.text_en, STEP_MAX);
    const stepFailure = [textHe, textEn].find((field) => !field.ok);
    if (stepFailure && !stepFailure.ok) return fail(stepFailure.issue === 'tooLong' ? 'tooLong' : 'steps');
    if (!textHe.ok || !textEn.ok) return fail('steps');
    steps.push({
      ...emptyRecipeStep(`step-${index + 1}`),
      textHe: textHe.value,
      textEn: textEn.value,
    });
  }

  let sourceUrl = '';
  if (Object.prototype.hasOwnProperty.call(parsed, 'source_url') && parsed.source_url != null) {
    if (typeof parsed.source_url !== 'string') return fail('sourceUrl');
    sourceUrl = parsed.source_url.trim();
    if (recipeSourceUrlIssue(sourceUrl)) return fail('sourceUrl');
  }

  let imageIsIllustration = false;
  if (Object.prototype.hasOwnProperty.call(parsed, 'image_is_illustration')) {
    if (typeof parsed.image_is_illustration !== 'boolean') return fail('illustration');
    imageIsIllustration = parsed.image_is_illustration;
  }

  const form: RecipeEditorForm = {
    ...emptyRecipeForm(),
    titleHe: titleHe.value,
    titleEn: titleEn.value,
    descriptionHe: descriptionHe.value,
    descriptionEn: descriptionEn.value,
    creditHe: creditHe.present ? creditHe.value : '',
    creditEn: creditEn.present ? creditEn.value : '',
    imageIsIllustration,
    totalMinutes: String(minutes.value),
    servings: String(servings.value),
    mealType: parsed.meal_type,
    timeSuitability: timeSuitability as TimeSuitabilityValue[],
    dietaryTags,
    ingredients,
    steps,
    sourceName: sourceName.value,
    sourceUrl,
    coverUrl: null,
  };

  if (!recipeLanguageComplete(form, 'he') && !recipeLanguageComplete(form, 'en')) return fail('language');

  return {
    ok: true,
    form,
    creditHeProvided: creditHe.present,
    creditEnProvided: creditEn.present,
  };
}
