import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { RECIPES_CAPABILITY, parseStudioAccess } from '@/lib/api/studioBootstrap';
import {
  resolveStudioHomeTab,
  shouldLoadStudioArea,
  studioAreaManageHref,
  studioHomeView,
} from '@/lib/studio/studioAreas';
import {
  applyRecipeCoverResponse,
  buildRecipeIngredientBody,
  buildRecipeWriteBody,
  canReviseApprovedRecipe,
  canSubmitRecipe,
  emptyRecipeForm,
  emptyRecipeIngredient,
  emptyRecipeStep,
  isRecipeDraftEditable,
  isRecipePendingReview,
  mergeRecipeCreateCredit,
  moveRecipeItems,
  patchRecipeDraftVersion,
  recipeDetailsDirty,
  recipeErrorMessageKey,
  recipeFormFromServer,
  recipeLanguageComplete,
  recipeSaveOutcome,
  recipeSavePlan,
  recipeSubmissionIssue,
  toggleDietaryTag,
  validateRecipeCoverMeta,
  RECIPE_COVER_MAX_BYTES,
  RECIPE_COVER_MAX_EDGE_PX,
  RECIPE_COVER_MAX_PIXELS,
} from '@/lib/studio/recipeEditor';

function access(capabilities: Record<string, boolean>, enabled = true) {
  return parseStudioAccess({
    studio_access: { enabled, capabilities },
  });
}

describe('recipe permissions and home tab', () => {
  it('opens recipes only when enabled and recipes is true', () => {
    const recipesOnly = access({ guided_sessions: false, challenges: false, recipes: true });
    assert.equal(shouldLoadStudioArea(RECIPES_CAPABILITY, recipesOnly), true);
    assert.equal(studioHomeView(recipesOnly).showRecipeList, true);
    assert.equal(studioHomeView(recipesOnly).showSessionList, false);
    assert.equal(studioHomeView(recipesOnly).showChallengeList, false);
    assert.equal(studioHomeView(recipesOnly).showNeutralEmpty, false);
    assert.equal(studioHomeView(recipesOnly).areas[0]?.createHref, '/studio/recipes/new');
    assert.equal(studioAreaManageHref(RECIPES_CAPABILITY), '/studio?tab=recipes');
    assert.equal(resolveStudioHomeTab('recipes', recipesOnly), 'recipes');
    assert.equal(resolveStudioHomeTab('sessions', recipesOnly), 'create');
    assert.equal(resolveStudioHomeTab('challenges', recipesOnly), 'create');

    const several = access({ guided_sessions: true, challenges: true, recipes: true });
    assert.equal(resolveStudioHomeTab('recipes', several), 'recipes');
    assert.equal(resolveStudioHomeTab('challenges', several), 'challenges');
    assert.equal(studioHomeView(several).areas.length, 3);

    const withoutRecipes = access({ guided_sessions: true, challenges: true, recipes: false });
    assert.equal(shouldLoadStudioArea(RECIPES_CAPABILITY, withoutRecipes), false);
    assert.equal(resolveStudioHomeTab('recipes', withoutRecipes), 'create');
  });

  it('does not grant recipes from another capability, the creator flag, or a legacy server', () => {
    const sessions = parseStudioAccess({
      studio_access: {
        enabled: true,
        is_studio_creator: true,
        capabilities: { guided_sessions: true, challenges: true },
      },
    });
    assert.equal(sessions.capabilities.recipes, false);
    assert.equal(shouldLoadStudioArea(RECIPES_CAPABILITY, sessions), false);

    const legacy = parseStudioAccess({ studio_access: { is_studio_creator: true } });
    assert.equal(legacy.capabilities.recipes, false);
    assert.equal(shouldLoadStudioArea(RECIPES_CAPABILITY, legacy), false);

    const disabled = access({ recipes: true }, false);
    assert.equal(shouldLoadStudioArea(RECIPES_CAPABILITY, disabled), false);
    assert.equal(resolveStudioHomeTab('recipes', disabled), 'create');
  });
});

describe('recipe lines, language, and versions', () => {
  it('reorders ingredients and steps into positions that start at 1', () => {
    const form = emptyRecipeForm();
    form.ingredients = [
      { ...emptyRecipeIngredient('a'), nameHe: 'מלח', amount: '1' },
      { ...emptyRecipeIngredient('b'), nameHe: 'מים', amount: '2' },
    ];
    form.steps = [
      { ...emptyRecipeStep('s1'), textHe: 'ראשון' },
      { ...emptyRecipeStep('s2'), textHe: 'שני' },
    ];
    const ingredients = moveRecipeItems(form.ingredients, 0, 1);
    const steps = moveRecipeItems(form.steps, 1, -1);
    assert.deepEqual(
      buildRecipeIngredientBody(ingredients).map((item) => [item.position, item.name_he]),
      [
        [1, 'מים'],
        [2, 'מלח'],
      ],
    );
    assert.deepEqual(
      buildRecipeWriteBody({ ...form, ingredients, steps }, {
        includeDetails: false,
        includeLines: true,
        includeCreditHe: false,
        includeCreditEn: false,
      }).steps?.map((item) => [item.position, item.text_he]),
      [
        [1, 'שני'],
        [2, 'ראשון'],
      ],
    );
  });

  it('treats one complete language as enough and ignores description', () => {
    const form = emptyRecipeForm();
    form.titleHe = 'מרק';
    form.ingredients = [{ ...emptyRecipeIngredient('a'), nameHe: 'מים', nameEn: '', amount: 'כוס' }];
    form.steps = [{ ...emptyRecipeStep('s'), textHe: 'לבשל', textEn: '' }];
    assert.equal(recipeLanguageComplete(form, 'he'), true);
    assert.equal(recipeLanguageComplete(form, 'en'), false);
    assert.equal(recipeSubmissionIssue({ ...form, coverUrl: 'https://example.com/a.jpg', totalMinutes: '20', servings: '2', mealType: 'soup', creditHe: 'איניגו' }), null);

    form.ingredients[0].nameHe = '';
    form.ingredients[0].nameEn = 'water';
    form.steps[0].textHe = '';
    form.steps[0].textEn = 'boil';
    assert.equal(recipeLanguageComplete(form, 'he'), false);
    assert.equal(recipeLanguageComplete(form, 'en'), false);
    assert.equal(
      recipeSubmissionIssue({
        ...form,
        coverUrl: 'https://example.com/a.jpg',
        totalMinutes: '20',
        servings: '2',
        mealType: 'soup',
        creditHe: 'איניגו',
      }),
      'language',
    );
  });

  it('keeps an approved recipe read-only until an explicit save opens a draft', () => {
    assert.equal(isRecipeDraftEditable('draft'), true);
    assert.equal(isRecipeDraftEditable('pending_review'), false);
    assert.equal(isRecipePendingReview('pending_review'), true);
    assert.equal(isRecipeDraftEditable('approved'), false);
    assert.equal(canReviseApprovedRecipe('approved'), true);
    assert.deepEqual(
      recipeSavePlan({
        hasRecipeId: true,
        revisingApproved: false,
        detailsDirty: false,
        linesDirty: false,
        coverPending: false,
        creditHeEdited: false,
        creditEnEdited: false,
      }),
      {
        sendDetails: false,
        sendLines: false,
        sendCover: false,
        includeCreditHe: false,
        includeCreditEn: false,
      },
    );
    const revising = recipeSavePlan({
      hasRecipeId: true,
      revisingApproved: true,
      detailsDirty: false,
      linesDirty: false,
      coverPending: false,
      creditHeEdited: false,
      creditEnEdited: false,
    });
    assert.equal(revising.sendDetails, true);
    assert.equal(revising.includeCreditHe, false);
    assert.equal(revising.includeCreditEn, false);
    const keptCredit = buildRecipeWriteBody(
      { ...emptyRecipeForm(), titleHe: 'מרק', creditHe: '' },
      {
        includeDetails: true,
        includeLines: false,
        includeCreditHe: revising.includeCreditHe,
        includeCreditEn: revising.includeCreditEn,
      },
    );
    assert.equal('credit_he' in keptCredit, false);
    assert.equal('credit_en' in keptCredit, false);
  });
});

describe('recipe save and cover', () => {
  it('keeps the new draft id when the cover upload fails after create', () => {
    const created = recipeSavePlan({
      hasRecipeId: false,
      revisingApproved: false,
      detailsDirty: true,
      linesDirty: true,
      coverPending: true,
      creditHeEdited: false,
      creditEnEdited: false,
    });
    assert.equal(created.sendCover, true);
    assert.equal(created.includeCreditHe, false);
    assert.equal(created.includeCreditEn, false);
    const untouched = emptyRecipeForm();
    const body = buildRecipeWriteBody(untouched, {
      includeDetails: true,
      includeLines: true,
      includeCreditHe: created.includeCreditHe,
      includeCreditEn: created.includeCreditEn,
    });
    assert.equal('credit_he' in body, false);
    assert.equal('credit_en' in body, false);
    assert.equal('cover_url' in body, false);

    const hebrewOnly = recipeSavePlan({
      hasRecipeId: false,
      revisingApproved: false,
      detailsDirty: true,
      linesDirty: true,
      coverPending: false,
      creditHeEdited: true,
      creditEnEdited: false,
    });
    const partial = buildRecipeWriteBody(
      { ...untouched, creditHe: 'עדי' },
      {
        includeDetails: true,
        includeLines: true,
        includeCreditHe: hebrewOnly.includeCreditHe,
        includeCreditEn: hebrewOnly.includeCreditEn,
      },
    );
    assert.equal(partial.credit_he, 'עדי');
    assert.equal('credit_en' in partial, false);

    const outcome = recipeSaveOutcome({
      recipeId: 41,
      detailsAttempted: true,
      detailsFailed: false,
      coverAttempted: true,
      coverFailed: true,
    });
    assert.equal(outcome.recipeId, 41);
    assert.equal(outcome.complete, false);
    assert.equal(outcome.canSubmit, false);
    assert.equal(outcome.failedPart, 'cover');
    assert.equal(
      canSubmitRecipe({
        status: 'draft',
        dirty: false,
        coverPending: true,
        saveComplete: false,
        ready: false,
      }),
      false,
    );
  });

  it('keeps a typed credit and fills only an untouched credit from the server', () => {
    const local = emptyRecipeForm();
    local.titleHe = 'מרק';
    local.creditHe = 'עדי';
    const merged = mergeRecipeCreateCredit(
      local,
      { credit_he: 'ברירת מחדל', credit_en: 'Default' },
      { he: true, en: false },
    );
    assert.equal(merged.titleHe, 'מרק');
    assert.equal(merged.creditHe, 'עדי');
    assert.equal(merged.creditEn, 'Default');

    const untouched = mergeRecipeCreateCredit(
      emptyRecipeForm(),
      { credit_he: 'ברירת מחדל', credit_en: 'Default' },
      { he: false, en: false },
    );
    assert.equal(untouched.creditHe, 'ברירת מחדל');
    assert.equal(untouched.creditEn, 'Default');
    assert.equal(untouched.titleHe, '');
  });

  it('adopts the new draft from a cover response without replacing local fields', () => {
    const local = emptyRecipeForm();
    local.titleHe = 'עריכה שעוד לא נשמרה';
    const applied = applyRecipeCoverResponse(local, {
      status: 'draft',
      version_id: 9,
      version_number: 2,
      cover_url: 'https://storage.example/cover.jpg',
    });
    assert.equal(applied.form.titleHe, 'עריכה שעוד לא נשמרה');
    assert.equal(applied.form.coverUrl, 'https://storage.example/cover.jpg');
    assert.deepEqual(applied.version, { status: 'draft', versionId: 9, versionNumber: 2 });

    const approved = {
      status: 'approved' as const,
      version_id: 4,
      version_number: 1,
      title_he: 'ישן',
      cover_url: 'https://storage.example/old.jpg',
      cover_storage_path: 'recipes/1/old.jpg',
    };
    const patched = patchRecipeDraftVersion(approved, {
      status: 'draft',
      version_id: 9,
      version_number: 2,
      cover_url: 'https://storage.example/cover.jpg',
      cover_storage_path: 'recipes/1/covers/new.jpg',
    });
    assert.equal(patched.status, 'draft');
    assert.equal(patched.version_id, 9);
    assert.equal(patched.version_number, 2);
    assert.equal(patched.title_he, 'ישן');
    assert.equal(patched.cover_url, 'https://storage.example/cover.jpg');
    assert.equal(recipeDetailsDirty(applied.form, local), false);
  });

  it('checks cover limits and maps field errors', () => {
    assert.equal(validateRecipeCoverMeta({ mimeType: 'image/gif', sizeBytes: 1000 }), 'type');
    assert.equal(
      validateRecipeCoverMeta({ mimeType: 'image/jpeg', sizeBytes: RECIPE_COVER_MAX_BYTES + 1 }),
      'size',
    );
    assert.equal(
      validateRecipeCoverMeta({
        mimeType: 'image/png',
        sizeBytes: 1000,
        width: RECIPE_COVER_MAX_EDGE_PX + 1,
        height: 10,
      }),
      'edge',
    );
    assert.equal(
      validateRecipeCoverMeta({
        mimeType: 'image/webp',
        sizeBytes: 1000,
        width: 8000,
        height: RECIPE_COVER_MAX_PIXELS / 8000 + 1,
      }),
      'pixels',
    );
    assert.equal(validateRecipeCoverMeta({ mimeType: 'image/jpeg', sizeBytes: 1000, width: 100, height: 100 }), null);
    assert.equal(recipeErrorMessageKey({ reasonCode: 'validation_failed', field: 'language' }), 'errors.language');
    assert.equal(recipeErrorMessageKey({ reasonCode: 'version_not_editable', field: null }), 'errors.versionNotEditable');
    assert.deepEqual(toggleDietaryTag(['vegetarian'], 'vegan', ['vegetarian', 'vegan']), ['vegetarian', 'vegan']);
    assert.deepEqual(toggleDietaryTag(['vegan'], 'vegan', ['vegetarian', 'vegan']), []);
  });

  it('loads server lines in position order and does not submit a dirty draft', () => {
    const form = recipeFormFromServer({
      title_he: 'סלט',
      title_en: '',
      description_he: '',
      description_en: '',
      credit_he: 'צוות',
      credit_en: 'Team',
      source_url: null,
      source_name: null,
      image_is_illustration: false,
      cover_url: 'https://storage.example/c.jpg',
      total_minutes: 10,
      servings: 1,
      meal_type: 'salad_side',
      time_suitability: ['anytime'],
      dietary_tags: [],
      ingredients: [
        { position: 2, amount: 'עלים', name_he: 'חסה', name_en: '' },
        { position: 1, amount: 'כף', name_he: 'שמן', name_en: '' },
      ],
      steps: [{ position: 1, text_he: 'לערבב', text_en: '' }],
    });
    assert.deepEqual(
      form.ingredients.map((item) => item.nameHe),
      ['שמן', 'חסה'],
    );
    assert.equal(recipeSubmissionIssue(form), null);
    const dirty = { ...form, titleHe: 'סלט חדש' };
    assert.equal(recipeDetailsDirty(dirty, form), true);
    assert.equal(
      canSubmitRecipe({ status: 'draft', dirty: true, coverPending: false, saveComplete: true, ready: true }),
      false,
    );
    assert.equal(
      canSubmitRecipe({ status: 'pending_review', dirty: false, coverPending: false, saveComplete: true, ready: true }),
      false,
    );
  });
});
