import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { buildRecipeIngredientBody, buildRecipeStepBody, buildRecipeWriteBody, recipeSavePlan } from '@/lib/studio/recipeEditor';
import {
  applyRecipeImport,
  parseRecipeImport,
  recipeFormHasContent,
  recipeImportNeedsConfirmation,
  recipeImportPrompt,
  recipePastePerformsRequest,
  recipePromptCopy,
  type RecipeImportResult,
} from '@/lib/studio/recipeImport';
import { emptyRecipeForm } from '@/lib/studio/recipeEditor';

const SAMPLE = {
  title_he: 'מרק עדשים',
  title_en: 'Lentil soup',
  description_he: 'מרק חם',
  description_en: 'A warm soup',
  total_minutes: 40,
  servings: 4,
  meal_type: 'soup',
  time_suitability: ['evening'],
  dietary_tags: ['vegan'],
  ingredients: [
    { position: 1, amount: '2 כפות / 2 tbsp', name_he: 'שמן', name_en: 'oil' },
    { position: 2, amount: 'כוס / 1 cup', name_he: 'עדשים', name_en: 'lentils' },
  ],
  steps: [
    { position: 1, text_he: 'לטגן את הבצל', text_en: 'Fry the onion' },
    { position: 2, text_he: 'לבשל עד שהעדשים רכות', text_en: 'Cook until the lentils are soft' },
  ],
  source_url: null,
  source_name: null,
  image_is_illustration: false,
};

function succeed(result: RecipeImportResult) {
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error('expected a parsed recipe');
  return result;
}

describe('recipe import parsing', () => {
  it('parses clean JSON and a single json block without a network request', () => {
    assert.equal(recipePastePerformsRequest(), false);
    const clean = parseRecipeImport(JSON.stringify(SAMPLE));
    assert.equal(clean instanceof Promise, false);
    const parsed = succeed(clean);
    assert.equal(parsed.form.titleHe, 'מרק עדשים');
    assert.equal(parsed.creditHeProvided, false);
    assert.equal(parsed.creditEnProvided, false);

    const fenced = succeed(parseRecipeImport(`\`\`\`json\n${JSON.stringify(SAMPLE)}\n\`\`\``));
    assert.equal(fenced.form.titleEn, 'Lentil soup');
    assert.equal(recipeImportPrompt('he').includes('credit_he'), true);
    assert.equal(recipeImportPrompt('en').includes('image_is_illustration'), true);
    assert.equal(recipeImportPrompt('he').includes('2 כפות / 2 tbsp'), true);
    const request = 'סלט עדשים לארבע מנות, עד 20 דקות, עם מצרכים פשוטים';
    assert.equal(recipeImportPrompt('he').includes(request), false);
    const hebrewPrompt = recipeImportPrompt('he', undefined, request);
    assert.equal(hebrewPrompt.includes(request), true);
    assert.equal(hebrewPrompt.indexOf('הבקשה שלי:') < hebrewPrompt.indexOf(request), true);
    const englishPrompt = recipeImportPrompt('en', undefined, 'lentil salad for four');
    assert.equal(englishPrompt.includes('lentil salad for four'), true);
    assert.equal(englishPrompt.indexOf('My request:') < englishPrompt.indexOf('lentil salad for four'), true);

    assert.equal(recipePromptCopy('he', '  ', true).status, 'needRequest');
    const copied = recipePromptCopy('he', request, true);
    assert.equal(copied.status, 'copied');
    if (copied.status === 'copied') assert.equal(copied.prompt.includes(request), true);
    const manual = recipePromptCopy('en', 'lentil salad for four', false);
    assert.equal(manual.status, 'manual');
    if (manual.status === 'manual') assert.equal(manual.prompt.includes('lentil salad for four'), true);
    assert.equal(
      recipeImportPrompt('he').includes(
        'מותר ליצור מתכונים עם בשר או דגים. vegetarian ו-vegan הן תגיות אופציונליות בלבד. אם אינן מתאימות, החזר dietary_tags: [].',
      ),
      true,
    );
    assert.equal(
      recipeImportPrompt('en').includes(
        'Recipes with meat or fish are allowed. vegetarian and vegan are optional tags only. If they do not apply, return dietary_tags: [].',
      ),
      true,
    );
    const unmarked = succeed(parseRecipeImport(JSON.stringify({ ...SAMPLE, dietary_tags: [] })));
    assert.deepEqual(unmarked.form.dietaryTags, []);
  });

  it('rejects broken input, bad types, and unknown codes', () => {
    assert.equal(parseRecipeImport('just a recipe').ok, false);
    assert.equal(parseRecipeImport('{').ok, false);
    assert.equal(parseRecipeImport('```json\n{}\n```\n```json\n{}\n```').ok, false);
    assert.equal(parseRecipeImport('```\n{"title_he":"א"}\n```').ok, false);
    assert.equal(parseRecipeImport(JSON.stringify({ ...SAMPLE, total_minutes: '40' })).ok, false);
    assert.equal(parseRecipeImport(JSON.stringify({ ...SAMPLE, meal_type: 'brunch' })).ok, false);
    assert.equal(parseRecipeImport(JSON.stringify({ ...SAMPLE, time_suitability: ['dawn'] })).ok, false);
    assert.equal(parseRecipeImport(JSON.stringify({ ...SAMPLE, dietary_tags: ['kosher'] })).ok, false);
    assert.equal(parseRecipeImport(JSON.stringify({ ...SAMPLE, image_is_illustration: 'yes' })).ok, false);
  });

  it('accepts one complete language and rejects a split language', () => {
    const hebrew = succeed(
      parseRecipeImport(
        JSON.stringify({
          ...SAMPLE,
          title_en: '',
          description_en: '',
          ingredients: SAMPLE.ingredients.map((item) => ({ ...item, name_en: '' })),
          steps: SAMPLE.steps.map((item) => ({ ...item, text_en: '' })),
        }),
      ),
    );
    assert.equal(hebrew.form.titleHe, 'מרק עדשים');
    assert.equal(hebrew.form.ingredients[0].nameEn, '');

    const split = parseRecipeImport(
      JSON.stringify({
        ...SAMPLE,
        title_en: '',
        ingredients: [{ position: 1, amount: 'כוס', name_he: '', name_en: 'lentils' }],
        steps: [{ position: 1, text_he: '', text_en: 'Cook' }],
      }),
    );
    assert.equal(split.ok, false);
    if (!split.ok) assert.equal(split.issue, 'language');
  });

  it('blocks server and image fields before any form is filled', () => {
    for (const key of ['cover_url', 'cover_storage_path', 'status', 'id', 'storage_path']) {
      const result = parseRecipeImport(JSON.stringify({ ...SAMPLE, [key]: 'nope' }));
      assert.equal(result.ok, false);
      if (!result.ok) assert.equal(result.issue, 'forbidden');
    }
  });

  it('keeps ingredient and step array order and renumbers positions', () => {
    const reversed = succeed(
      parseRecipeImport(
        JSON.stringify({
          ...SAMPLE,
          ingredients: [
            { position: 9, amount: 'כוס', name_he: 'עדשים', name_en: 'lentils' },
            { position: 1, amount: 'כף', name_he: 'שמן', name_en: 'oil' },
          ],
          steps: [
            { position: 5, text_he: 'לבשל', text_en: 'Cook' },
            { position: 1, text_he: 'לטגן', text_en: 'Fry' },
          ],
        }),
      ),
    );
    assert.deepEqual(
      buildRecipeIngredientBody(reversed.form.ingredients).map((item) => [item.position, item.name_he]),
      [
        [1, 'עדשים'],
        [2, 'שמן'],
      ],
    );
    assert.deepEqual(
      buildRecipeStepBody(reversed.form.steps).map((item) => [item.position, item.text_he]),
      [
        [1, 'לבשל'],
        [2, 'לטגן'],
      ],
    );
  });

  it('fills the form, keeps later edits, and does not send an omitted credit', () => {
    const imported = succeed(parseRecipeImport(JSON.stringify(SAMPLE)));
    assert.equal(recipeFormHasContent(emptyRecipeForm()), false);
    assert.equal(recipeImportNeedsConfirmation(imported.form), true);
    const edited = { ...imported.form, titleHe: 'מרק עדשים ביתי', servings: '6' };
    assert.equal(edited.titleHe, 'מרק עדשים ביתי');
    assert.equal(edited.ingredients[1].nameEn, 'lentils');
    assert.equal(edited.servings, '6');

    const plan = recipeSavePlan({
      hasRecipeId: false,
      revisingApproved: false,
      detailsDirty: true,
      linesDirty: true,
      coverPending: false,
      creditHeEdited: imported.creditHeProvided,
      creditEnEdited: imported.creditEnProvided,
    });
    const body = buildRecipeWriteBody(edited, {
      includeDetails: true,
      includeLines: true,
      includeCreditHe: plan.includeCreditHe,
      includeCreditEn: plan.includeCreditEn,
    });
    assert.equal('credit_he' in body, false);
    assert.equal('credit_en' in body, false);
    assert.equal(body.title_he, 'מרק עדשים ביתי');
  });

  it('asks before replacing existing content and leaves the current image alone', () => {
    const current = emptyRecipeForm();
    current.titleHe = 'ישן';
    current.coverUrl = 'https://storage.example/cover.jpg';
    assert.equal(recipeImportNeedsConfirmation(current), true);
    const imported = succeed(parseRecipeImport(JSON.stringify(SAMPLE)));
    const next = applyRecipeImport(current, imported.form);
    assert.equal(next.titleHe, 'מרק עדשים');
    assert.equal(next.coverUrl, 'https://storage.example/cover.jpg');
    assert.equal(imported.form.coverUrl, null);
  });
});
