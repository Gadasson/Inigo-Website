import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { emptyRecipeForm } from '@/lib/studio/recipeEditor';
import { canSubmitRecipe, recipeSaveOutcome, recipeSavePlan } from '@/lib/studio/recipeEditor';
import {
  RECIPE_COVER_FRAME_ASPECT,
  recipeCoverPhase,
  recipeIllustrationForPath,
  recipeImageCopy,
  recipeImageCopyPerformsRequest,
  recipeImageRequest,
} from '@/lib/studio/recipeImageRequest';

function readyForm() {
  const form = emptyRecipeForm();
  form.titleHe = 'מרק עדשים';
  form.titleEn = 'Lentil soup';
  form.ingredients = [
    { id: 'ingredient-1', amount: '2 כפות / 2 tbsp', nameHe: 'שמן', nameEn: 'oil' },
    { id: 'ingredient-2', amount: 'כוס / 1 cup', nameHe: 'עדשים', nameEn: 'lentils' },
  ];
  form.steps = [
    { id: 'step-1', textHe: 'מחממים את השמן.', textEn: 'Warm the oil.' },
    { id: 'step-2', textHe: 'מבשלים עד שהעדשים רכות.', textEn: 'Cook until the lentils are soft.' },
  ];
  form.coverUrl = 'https://storage.example/cover.jpg';
  return form;
}

describe('recipe image request', () => {
  it('builds the request from the current recipe, including unsaved edits', () => {
    const form = readyForm();
    form.titleHe = 'מרק עדשים ביתי';
    form.ingredients[0].amount = '3 כפות / 3 tbsp';
    form.steps[1].textHe = 'מגישים בקערה עמוקה.';
    const request = recipeImageRequest(form, 'he');
    assert.equal(request.ok, true);
    if (!request.ok) return;
    assert.equal(request.lang, 'he');
    assert.equal(request.prompt.includes('מרק עדשים ביתי'), true);
    assert.equal(request.prompt.includes('3 כפות / 3 tbsp שמן'), true);
    assert.equal(request.prompt.includes('מגישים בקערה עמוקה.'), true);
    assert.equal(request.prompt.includes('Lentil soup'), false);
    assert.equal(request.prompt.includes(RECIPE_COVER_FRAME_ASPECT), true);
    assert.equal(request.prompt.includes('בלי טקסט, לוגו, סימן מים או קולאז\''), true);
    assert.equal(request.prompt.includes(form.coverUrl ?? ''), false);
  });

  it('uses the other complete language and does not invent missing text', () => {
    const form = readyForm();
    form.titleHe = '';
    form.ingredients[0].nameHe = '';
    form.steps[0].textHe = '';
    const request = recipeImageRequest(form, 'he');
    assert.equal(request.ok, true);
    if (!request.ok) return;
    assert.equal(request.lang, 'en');
    assert.equal(request.prompt.includes('Lentil soup'), true);
    assert.equal(request.prompt.includes('Warm the oil.'), true);
    assert.equal(request.prompt.includes('מרק'), false);
  });

  it('does not produce a request when basic details are missing', () => {
    const empty = recipeImageRequest(emptyRecipeForm(), 'he');
    assert.equal(empty.ok, false);
    if (empty.ok) return;
    assert.deepEqual(empty.missing, ['title', 'ingredients', 'amounts', 'steps']);
    assert.equal('prompt' in empty, false);

    const missingAmount = readyForm();
    missingAmount.ingredients[1].amount = '';
    const partial = recipeImageRequest(missingAmount, 'he');
    assert.equal(partial.ok, false);
    if (!partial.ok) assert.deepEqual(partial.missing, ['amounts']);
  });

  it('does not send a request or change the image when the prompt is copied', () => {
    assert.equal(recipeImageCopyPerformsRequest(), false);
    const form = readyForm();
    const coverUrl = form.coverUrl;
    const illustration = form.imageIsIllustration;
    const copied = recipeImageCopy(form, 'he', true);
    const failed = recipeImageCopy(form, 'he', false);
    const blocked = recipeImageCopy(emptyRecipeForm(), 'he', true);
    assert.equal(copied instanceof Promise, false);
    assert.equal(copied.status, 'copied');
    assert.equal(failed.status, 'manual');
    assert.equal(blocked.status, 'incomplete');
    if (copied.status === 'copied' && failed.status === 'manual') {
      assert.equal(copied.prompt.includes('מרק עדשים'), true);
      assert.equal(failed.prompt, copied.prompt);
    }
    assert.equal(form.coverUrl, coverUrl);
    assert.equal(form.imageIsIllustration, illustration);
  });

  it('marks an illustration only when the AI path is chosen', () => {
    assert.equal(recipeIllustrationForPath('ai', false), true);
    assert.equal(recipeIllustrationForPath('own', true), true);
    assert.equal(recipeIllustrationForPath('own', false), false);
    const form = readyForm();
    const kept = { coverUrl: form.coverUrl, imageIsIllustration: recipeIllustrationForPath('own', true) };
    assert.equal(kept.coverUrl, 'https://storage.example/cover.jpg');
    assert.equal(kept.imageIsIllustration, true);
  });

  it('names each cover phase and keeps the existing submit rules', () => {
    assert.equal(recipeCoverPhase({ hasLocalFile: true, uploading: false, failed: false, hasCoverUrl: true }), 'pending');
    assert.equal(recipeCoverPhase({ hasLocalFile: true, uploading: true, failed: false, hasCoverUrl: false }), 'uploading');
    assert.equal(recipeCoverPhase({ hasLocalFile: false, uploading: false, failed: false, hasCoverUrl: true }), 'uploaded');
    assert.equal(recipeCoverPhase({ hasLocalFile: true, uploading: false, failed: true, hasCoverUrl: false }), 'failed');
    assert.equal(recipeCoverPhase({ hasLocalFile: false, uploading: false, failed: false, hasCoverUrl: false }), 'none');

    const plan = recipeSavePlan({
      hasRecipeId: true,
      revisingApproved: false,
      detailsDirty: false,
      linesDirty: false,
      coverPending: true,
      creditHeEdited: false,
      creditEnEdited: false,
    });
    assert.equal(plan.sendCover, true);
    assert.equal(plan.sendDetails, false);
    const failedCover = recipeSaveOutcome({
      recipeId: 7,
      detailsAttempted: true,
      detailsFailed: false,
      coverAttempted: true,
      coverFailed: true,
    });
    assert.equal(failedCover.recipeId, 7);
    assert.equal(failedCover.complete, false);
    assert.equal(
      canSubmitRecipe({ status: 'draft', dirty: true, coverPending: true, saveComplete: false, ready: false }),
      false,
    );
  });
});
