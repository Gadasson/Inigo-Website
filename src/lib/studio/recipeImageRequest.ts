import { recipeLanguageComplete, type RecipeEditorForm } from '@/lib/studio/recipeEditor';

/** The studio cover frame is 4 / 3. The image request asks for that ratio only. */
export const RECIPE_COVER_FRAME_ASPECT = '4:3';

export type RecipeImagePath = 'own' | 'ai';

export type RecipeImageGap = 'title' | 'ingredients' | 'amounts' | 'steps';

export type RecipeImageRequestResult =
  | { ok: true; lang: 'he' | 'en'; prompt: string }
  | { ok: false; missing: RecipeImageGap[] };

export type RecipeImageCopy =
  | { status: 'incomplete'; missing: RecipeImageGap[] }
  | { status: 'copied'; prompt: string }
  | { status: 'manual'; prompt: string };

export type RecipeCoverPhase = 'none' | 'pending' | 'uploading' | 'uploaded' | 'failed';

/** Copying an image request never calls the network and never uploads a file. */
export function recipeImageCopyPerformsRequest(): false {
  return false;
}

function languageGaps(form: RecipeEditorForm, lang: 'he' | 'en'): RecipeImageGap[] {
  const gaps: RecipeImageGap[] = [];
  const title = lang === 'he' ? form.titleHe : form.titleEn;
  if (!title.trim()) gaps.push('title');
  if (form.ingredients.length === 0 || form.ingredients.some((item) => !(lang === 'he' ? item.nameHe : item.nameEn).trim())) {
    gaps.push('ingredients');
  }
  if (form.ingredients.length === 0 || form.ingredients.some((item) => !item.amount.trim())) gaps.push('amounts');
  if (form.steps.length === 0 || form.steps.some((item) => !(lang === 'he' ? item.textHe : item.textEn).trim())) {
    gaps.push('steps');
  }
  return gaps;
}

function imagePrompt(form: RecipeEditorForm, lang: 'he' | 'en'): string {
  const title = (lang === 'he' ? form.titleHe : form.titleEn).trim();
  const ingredients = form.ingredients
    .map((item) => `- ${item.amount.trim()} ${(lang === 'he' ? item.nameHe : item.nameEn).trim()}`)
    .join('\n');
  const steps = form.steps
    .map((item, index) => `${index + 1}. ${(lang === 'he' ? item.textHe : item.textEn).trim()}`)
    .join('\n');

  if (lang === 'he') {
    return [
      'צור תמונה של המנה המוכנה.',
      '',
      `שם המנה: ${title}`,
      'מצרכים:',
      ingredients,
      'הכנה:',
      steps,
      '',
      'צילום אוכל טבעי ומזמין, בסגנון ביתי נקי.',
      'המנה המוכנה תואמת למתכון.',
      'אין להוסיף רכיבים או קישוטים אכילים שאינם במתכון.',
      'בלי טקסט, לוגו, סימן מים או קולאז\'.',
      'מנה מרכזית בפריים, עם מרווח לחיתוך לכרטיס.',
      `יחס התמונה: ${RECIPE_COVER_FRAME_ASPECT}.`,
    ].join('\n');
  }

  return [
    'Create a photo of the finished dish.',
    '',
    `Dish name: ${title}`,
    'Ingredients:',
    ingredients,
    'Preparation:',
    steps,
    '',
    'A natural, inviting food photo, in a clean home style.',
    'The finished dish matches the recipe.',
    'Do not add edible ingredients or garnishes that are not in the recipe.',
    'No text, logo, watermark, or collage.',
    'Keep the dish centered in the frame, with room to crop it into a card.',
    `Image ratio: ${RECIPE_COVER_FRAME_ASPECT}.`,
  ].join('\n');
}

/** Build an image request from one complete language already in the form. */
export function recipeImageRequest(form: RecipeEditorForm, preferred: 'he' | 'en'): RecipeImageRequestResult {
  const order: Array<'he' | 'en'> = preferred === 'en' ? ['en', 'he'] : ['he', 'en'];
  const ready = order.find((lang) => languageGaps(form, lang).length === 0 && recipeLanguageComplete(form, lang));
  if (!ready) {
    const preferredGaps = languageGaps(form, preferred);
    const other = preferred === 'he' ? 'en' : 'he';
    const otherGaps = languageGaps(form, other);
    const missing = preferredGaps.length <= otherGaps.length ? preferredGaps : otherGaps;
    return { ok: false, missing };
  }
  return { ok: true, lang: ready, prompt: imagePrompt(form, ready) };
}

export function recipeImageCopy(form: RecipeEditorForm, preferred: 'he' | 'en', clipboardWrote: boolean): RecipeImageCopy {
  const request = recipeImageRequest(form, preferred);
  if (!request.ok) return { status: 'incomplete', missing: request.missing };
  return clipboardWrote ? { status: 'copied', prompt: request.prompt } : { status: 'manual', prompt: request.prompt };
}

/**
 * Choosing AI marks the image as an illustration.
 * Choosing a photo keeps the current mark and the current image.
 */
export function recipeIllustrationForPath(path: RecipeImagePath, currentIllustration: boolean): boolean {
  return path === 'ai' ? true : currentIllustration;
}

export function recipeCoverPhase(input: {
  hasLocalFile: boolean;
  uploading: boolean;
  failed: boolean;
  hasCoverUrl: boolean;
}): RecipeCoverPhase {
  if (input.uploading) return 'uploading';
  if (input.failed) return 'failed';
  if (input.hasLocalFile) return 'pending';
  if (input.hasCoverUrl) return 'uploaded';
  return 'none';
}
