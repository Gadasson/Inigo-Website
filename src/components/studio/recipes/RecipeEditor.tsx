'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioLocale } from '@/contexts/StudioIntlContext';
import { RECIPES_CAPABILITY } from '@/lib/api/studioBootstrap';
import {
  archiveStudioRecipe,
  createStudioRecipe,
  getStudioRecipe,
  getStudioRecipeOptions,
  parseRecipeApiFailure,
  patchStudioRecipe,
  submitStudioRecipe,
  unarchiveStudioRecipe,
  uploadStudioRecipeCover,
  type StudioRecipeDetail,
  type StudioRecipeOptions,
} from '@/lib/api/studioRecipes';
import {
  applyRecipeCoverResponse,
  buildRecipeWriteBody,
  canReviseApprovedRecipe,
  canSubmitRecipe,
  emptyRecipeForm,
  emptyRecipeIngredient,
  emptyRecipeStep,
  isRecipeDraftEditable,
  isRecipePendingReview,
  markRecipeCoverRetry,
  mergeRecipeCreateCredit,
  moveRecipeItems,
  patchRecipeDraftVersion,
  recipeDetailsDirty,
  recipeErrorMessageKey,
  recipeFormFromServer,
  recipeFormWithCover,
  recipeLinesDirty,
  recipeSaveOutcome,
  recipeSavePlan,
  recipeSaveSendsWrite,
  recipeSourceUrlIssue,
  recipeSubmissionIssue,
  takeRecipeCoverRetry,
  toggleDietaryTag,
  validateRecipeCoverMeta,
  type RecipeEditorForm,
  type RecipeSubmitIssue,
} from '@/lib/studio/recipeEditor';
import { studioAreaManageHref } from '@/lib/studio/studioAreas';
import {
  TIME_SUITABILITY_ORDER,
  toggleTimeSuitabilityValue,
  type TimeSuitabilityValue,
} from '@/lib/studio/timeSuitability';
import {
  applyRecipeImport,
  parseRecipeImport,
  recipeImportNeedsConfirmation,
  recipeImportPrompt,
  recipePromptCopy,
  DEFAULT_RECIPE_IMPORT_CATALOG,
  type RecipeImportResult,
} from '@/lib/studio/recipeImport';
import StudioConfirmDialog from '@/components/studio/StudioConfirmDialog';
import StudioFieldHint from '@/components/studio/StudioFieldHint';
import {
  recipeCoverPhase,
  recipeIllustrationForPath,
  recipeImageCopy,
  recipeImageRequest,
  type RecipeImageGap,
  type RecipeImagePath,
} from '@/lib/studio/recipeImageRequest';
import RecipeCoverSection from '@/components/studio/recipes/RecipeCoverSection';
import RecipePastePanel from '@/components/studio/recipes/RecipePastePanel';
import RecipePreview from '@/components/studio/recipes/RecipePreview';

type Props = { mode: 'create' } | { mode: 'edit'; recipeId: number };

const MEAL_KEYS = {
  breakfast: 'meal.breakfast',
  main: 'meal.main',
  salad_side: 'meal.saladSide',
  soup: 'meal.soup',
  snack: 'meal.snack',
  dessert: 'meal.dessert',
  drink: 'meal.drink',
  spread_sauce: 'meal.spreadSauce',
} as const;

const DIET_KEYS = {
  vegetarian: 'diet.vegetarian',
  vegan: 'diet.vegan',
} as const;

const TIME_KEYS: Record<TimeSuitabilityValue, 'timeSuitabilityAnytime' | 'timeSuitabilityMorning' | 'timeSuitabilityMidday' | 'timeSuitabilityEvening' | 'timeSuitabilityLateNight'> = {
  anytime: 'timeSuitabilityAnytime',
  morning: 'timeSuitabilityMorning',
  midday: 'timeSuitabilityMidday',
  evening: 'timeSuitabilityEvening',
  late_night: 'timeSuitabilityLateNight',
};

async function readImageSize(file: File): Promise<{ width: number; height: number } | null> {
  if (typeof createImageBitmap !== 'function') return null;
  try {
    const bitmap = await createImageBitmap(file);
    const size = { width: bitmap.width, height: bitmap.height };
    bitmap.close();
    return size;
  } catch {
    return null;
  }
}

export default function RecipeEditor(props: Props) {
  const { getIdToken } = useAuth();
  const router = useRouter();
  const { locale } = useStudioLocale();
  const t = useTranslations('recipes');
  const hints = useTranslations('hints');
  const optionsT = useTranslations('options');
  const [form, setForm] = useState<RecipeEditorForm>(emptyRecipeForm);
  const [baseline, setBaseline] = useState<RecipeEditorForm>(emptyRecipeForm);
  const [detail, setDetail] = useState<StudioRecipeDetail | null>(null);
  const [options, setOptions] = useState<StudioRecipeOptions | null>(null);
  const [revising, setRevising] = useState(false);
  const [loading, setLoading] = useState(props.mode === 'edit');
  const [busy, setBusy] = useState(false);
  const [coverUploading, setCoverUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedNote, setSavedNote] = useState<string | null>(null);
  const [saveComplete, setSaveComplete] = useState(true);
  const [creditHeEdited, setCreditHeEdited] = useState(false);
  const [creditEnEdited, setCreditEnEdited] = useState(false);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [coverUploadFailed, setCoverUploadFailed] = useState(false);
  const [imagePath, setImagePath] = useState<RecipeImagePath | null>(null);
  const [imageCopied, setImageCopied] = useState(false);
  const [imageFallback, setImageFallback] = useState<string | null>(null);
  const [imageMissing, setImageMissing] = useState<RecipeImageGap[]>([]);
  const [confirm, setConfirm] = useState<'archive' | 'unarchive' | 'import' | null>(null);
  const [screen, setScreen] = useState<'choose' | 'paste' | 'preview' | 'form'>(
    props.mode === 'create' ? 'choose' : 'form',
  );
  const [pasteRequest, setPasteRequest] = useState('');
  const [pasteText, setPasteText] = useState('');
  const [importError, setImportError] = useState<string | null>(null);
  const [pendingImport, setPendingImport] = useState<Extract<RecipeImportResult, { ok: true }> | null>(null);
  const [promptCopied, setPromptCopied] = useState(false);
  const [promptFallback, setPromptFallback] = useState<string | null>(null);
  const [copyNeedsRequest, setCopyNeedsRequest] = useState(false);
  const [previewLang, setPreviewLang] = useState<'he' | 'en'>(locale === 'he' ? 'he' : 'en');
  const [pasteReturn, setPasteReturn] = useState<'choose' | 'form' | 'preview'>('choose');
  const busyRef = useRef(false);
  const lineId = useRef(2);
  const coverPreviewRef = useRef<string | null>(null);
  coverPreviewRef.current = coverPreview;

  const recipeId = props.mode === 'edit' ? props.recipeId : null;
  const status = detail?.draft?.status ?? (props.mode === 'create' ? 'draft' : null);
  const editable =
    props.mode === 'create' ||
    isRecipeDraftEditable(status) ||
    (revising && canReviseApprovedRecipe(status));
  const detailsDirty = recipeDetailsDirty(form, baseline);
  const linesDirty = recipeLinesDirty(form, baseline);
  const coverPending = coverFile != null;
  const submitIssue = recipeSubmissionIssue(form, { mealTypes: options?.meal_types });
  const submitAllowed = canSubmitRecipe({
    status,
    dirty: detailsDirty || linesDirty || coverPending,
    coverPending,
    saveComplete,
    ready: submitIssue == null,
  });

  useEffect(() => {
    return () => {
      if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const token = await getIdToken();
        const loaded = await getStudioRecipeOptions(token);
        if (!cancelled) setOptions(loaded);
      } catch (err) {
        if (!cancelled) setError(t(recipeErrorMessageKey(parseRecipeApiFailure(err))));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [getIdToken, t]);

  useEffect(() => {
    if (recipeId == null) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      setError(null);
      try {
        const token = await getIdToken();
        const loaded = await getStudioRecipe(recipeId, token);
        if (cancelled || !loaded.draft) return;
        const next = recipeFormFromServer(loaded.draft);
        const maxLine = Math.max(
          1,
          ...next.ingredients.map((item) => Number(item.id.replace('ingredient-', '')) || 0),
          ...next.steps.map((item) => Number(item.id.replace('step-', '')) || 0),
        );
        lineId.current = maxLine + 1;
        setDetail(loaded);
        setForm(next);
        setBaseline(next);
        setRevising(false);
        setCreditHeEdited(false);
        setCreditEnEdited(false);
        if (takeRecipeCoverRetry(recipeId)) {
          setSaveComplete(false);
          setCoverUploadFailed(true);
          setError(t('errors.coverRetry'));
          setSavedNote(null);
        }
      } catch (err) {
        if (!cancelled) setError(t(recipeErrorMessageKey(parseRecipeApiFailure(err))));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [recipeId, getIdToken, t]);

  const statusLabel = useMemo(() => {
    if (detail?.archived_at) return t('status.archived');
    if (status === 'pending_review') return t('status.pending_review');
    if (status === 'approved' && !revising) return t('status.approved');
    return t('status.draft');
  }, [detail?.archived_at, revising, status, t]);

  function failureText(err: unknown): string {
    return t(recipeErrorMessageKey(parseRecipeApiFailure(err)));
  }

  function applyImported(result: Extract<RecipeImportResult, { ok: true }>) {
    setForm((current) => applyRecipeImport(current, result.form));
    setCreditHeEdited(result.creditHeProvided);
    setCreditEnEdited(result.creditEnProvided);
    lineId.current = Math.max(result.form.ingredients.length, result.form.steps.length) + 1;
    setImportError(null);
    setPendingImport(null);
    setSavedNote(null);
    setImageCopied(false);
    setImageFallback(null);
    setImageMissing([]);
    setScreen('preview');
  }

  function showPastedRecipe() {
    const result = parseRecipeImport(pasteText, importCatalog());
    if (!result.ok) {
      setImportError(t(`importIssue.${result.issue}`));
      return;
    }
    if (recipeImportNeedsConfirmation(form)) {
      setPendingImport(result);
      setConfirm('import');
      return;
    }
    applyImported(result);
  }

  function importCatalog() {
    return {
      mealTypes: options?.meal_types?.length ? options.meal_types : DEFAULT_RECIPE_IMPORT_CATALOG.mealTypes,
      dietaryTags: options?.dietary_tags?.length ? options.dietary_tags : DEFAULT_RECIPE_IMPORT_CATALOG.dietaryTags,
      timeSuitability: options?.time_suitability?.length
        ? options.time_suitability
        : DEFAULT_RECIPE_IMPORT_CATALOG.timeSuitability,
    };
  }

  async function copyRecipePrompt() {
    const localeKey = locale === 'he' ? 'he' : 'en';
    const catalog = importCatalog();
    if (!pasteRequest.trim()) {
      setPromptCopied(false);
      setPromptFallback(null);
      setCopyNeedsRequest(recipePromptCopy(localeKey, pasteRequest, false, catalog).status === 'needRequest');
      return;
    }
    const prompt = recipeImportPrompt(localeKey, catalog, pasteRequest);
    let clipboardWrote = false;
    try {
      await navigator.clipboard.writeText(prompt);
      clipboardWrote = true;
    } catch {
      clipboardWrote = false;
    }
    const outcome = recipePromptCopy(localeKey, pasteRequest, clipboardWrote, catalog);
    setCopyNeedsRequest(false);
    setPromptCopied(outcome.status === 'copied');
    setPromptFallback(outcome.status === 'manual' ? outcome.prompt : null);
  }

  function updateForm(patch: Partial<RecipeEditorForm>) {
    setForm((current) => ({ ...current, ...patch }));
    setSavedNote(null);
    if ('titleHe' in patch || 'titleEn' in patch || 'ingredients' in patch || 'steps' in patch) {
      setImageCopied(false);
      setImageFallback(null);
      setImageMissing([]);
    }
  }

  function chooseImagePath(path: RecipeImagePath) {
    setImagePath(path);
    setForm((current) => ({
      ...current,
      imageIsIllustration: recipeIllustrationForPath(path, current.imageIsIllustration),
    }));
    setSavedNote(null);
  }

  async function copyImageRequest() {
    const localeKey = locale === 'he' ? 'he' : 'en';
    const built = recipeImageRequest(form, localeKey);
    if (!built.ok) {
      setImageCopied(false);
      setImageFallback(null);
      setImageMissing(recipeImageCopy(form, localeKey, false).status === 'incomplete' ? built.missing : []);
      return;
    }
    let clipboardWrote = false;
    try {
      await navigator.clipboard.writeText(built.prompt);
      clipboardWrote = true;
    } catch {
      clipboardWrote = false;
    }
    const outcome = recipeImageCopy(form, localeKey, clipboardWrote);
    setImageMissing([]);
    setImageCopied(outcome.status === 'copied');
    setImageFallback(outcome.status === 'manual' ? outcome.prompt : null);
  }

  async function chooseCover(file: File | null) {
    if (!file || !editable || busyRef.current) return;
    const size = await readImageSize(file);
    const issue = validateRecipeCoverMeta({
      mimeType: file.type,
      sizeBytes: file.size,
      width: size?.width,
      height: size?.height,
    });
    if (issue) {
      setError(t(`coverIssue.${issue}`));
      return;
    }
    if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    const preview = URL.createObjectURL(file);
    setCoverFile(file);
    setCoverPreview(preview);
    setCoverUploadFailed(false);
    setSavedNote(null);
    setError(null);
  }

  function clearPendingCover() {
    if (coverPreviewRef.current) URL.revokeObjectURL(coverPreviewRef.current);
    setCoverFile(null);
    setCoverPreview(null);
  }

  async function save() {
    if (busyRef.current || !editable) return;
    if (recipeSourceUrlIssue(form.sourceUrl)) {
      setError(t('errors.sourceUrl'));
      return;
    }
    const hasRecipeId = recipeId != null;
    const revisingApproved = revising && canReviseApprovedRecipe(status);
    const plan = recipeSavePlan({
      hasRecipeId,
      revisingApproved,
      detailsDirty,
      linesDirty,
      coverPending,
      creditHeEdited,
      creditEnEdited,
    });
    if (hasRecipeId && !recipeSaveSendsWrite(plan) && !plan.sendCover) {
      setSavedNote(t('saved'));
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    setSavedNote(null);
    let savedId = recipeId;
    let latest = detail;
    let detailsFailed = false;
    let coverFailed = false;
    const detailsAttempted = recipeSaveSendsWrite(plan);
    let coverAttempted = false;
    try {
      const token = await getIdToken();
      const body = buildRecipeWriteBody(form, {
        includeDetails: plan.sendDetails,
        includeLines: plan.sendLines,
        includeCreditHe: plan.includeCreditHe,
        includeCreditEn: plan.includeCreditEn,
      });
      if (!savedId) {
        try {
          latest = await createStudioRecipe(body, token);
          savedId = latest.id;
        } catch (err) {
          detailsFailed = true;
          setError(failureText(err));
        }
      } else if (detailsAttempted) {
        try {
          latest = await patchStudioRecipe(savedId, body, token);
        } catch (err) {
          detailsFailed = true;
          setError(failureText(err));
        }
      }

      let nextForm = form;
      if (!detailsFailed && latest?.draft && detailsAttempted) {
        nextForm = hasRecipeId
          ? recipeFormFromServer(latest.draft)
          : mergeRecipeCreateCredit(form, latest.draft, { he: creditHeEdited, en: creditEnEdited });
      }

      if (savedId && plan.sendCover && coverFile && !detailsFailed) {
        coverAttempted = true;
        setCoverUploading(true);
        setCoverUploadFailed(false);
        try {
          const uploaded = await uploadStudioRecipeCover(savedId, coverFile, token);
          if (uploaded.draft) {
            nextForm = applyRecipeCoverResponse(nextForm, uploaded.draft).form;
            latest = latest?.draft
              ? {
                  ...uploaded,
                  draft: patchRecipeDraftVersion(latest.draft, uploaded.draft),
                }
              : uploaded;
          } else {
            latest = uploaded;
          }
          clearPendingCover();
        } catch (err) {
          coverFailed = true;
          setCoverUploadFailed(true);
          setError(failureText(err));
        } finally {
          setCoverUploading(false);
        }
      }

      const outcome = recipeSaveOutcome({
        recipeId: savedId,
        detailsAttempted,
        detailsFailed,
        coverAttempted,
        coverFailed,
      });
      setSaveComplete(outcome.complete);

      if (!hasRecipeId && savedId && !detailsFailed) {
        if (coverFailed) markRecipeCoverRetry(savedId);
        router.replace(`/studio/recipes/${savedId}`);
        return;
      }

      if (latest?.draft && !detailsFailed && (detailsAttempted || coverAttempted)) {
        setDetail(latest);
        setForm(nextForm);
        setBaseline(coverFailed ? recipeFormFromServer(latest.draft) : nextForm);
        if (outcome.complete) {
          setRevising(false);
          setCreditHeEdited(false);
          setCreditEnEdited(false);
          setSavedNote(t('saved'));
        }
      }
    } catch (err) {
      setError(failureText(err));
      setSaveComplete(false);
    } finally {
      busyRef.current = false;
      setBusy(false);
      setCoverUploading(false);
    }
  }

  async function submit() {
    if (busyRef.current || props.mode !== 'edit' || !submitAllowed) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      const updated = await submitStudioRecipe(props.recipeId, token);
      if (updated.draft) {
        const next = recipeFormFromServer(updated.draft);
        setDetail(updated);
        setForm(next);
        setBaseline(next);
        setRevising(false);
      }
      setSavedNote(t('submitted'));
    } catch (err) {
      setError(failureText(err));
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  async function confirmLifecycle() {
    if (busyRef.current || props.mode !== 'edit' || !confirm) return;
    const action = confirm;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    try {
      const token = await getIdToken();
      const updated =
        action === 'archive'
          ? await archiveStudioRecipe(props.recipeId, token)
          : await unarchiveStudioRecipe(props.recipeId, token);
      setDetail(updated);
      if (updated.draft) {
        const next = recipeFormWithCover(form, updated.draft.cover_url);
        setForm(next);
        setBaseline(recipeFormWithCover(baseline, updated.draft.cover_url));
      }
      setConfirm(null);
      setSavedNote(action === 'archive' ? t('archived') : t('unarchived'));
    } catch (err) {
      setError(failureText(err));
      setConfirm(null);
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }

  if (loading) {
    return <p className="studio-form-page__status">{t('loadingEditor')}</p>;
  }

  const previewSrc = coverPreview || form.coverUrl;
  const coverPhase = recipeCoverPhase({
    hasLocalFile: coverFile != null,
    uploading: coverUploading,
    failed: coverUploadFailed,
    hasCoverUrl: Boolean(form.coverUrl),
  });
  const coverSection = (
    <RecipeCoverSection
      idPrefix={screen === 'preview' ? 'recipe-preview' : 'recipe'}
      path={imagePath}
      editable={editable}
      busy={busy}
      previewSrc={previewSrc}
      phase={coverPhase}
      illustration={form.imageIsIllustration}
      missing={imageMissing}
      copied={imageCopied}
      fallbackPrompt={imageFallback}
      onPath={chooseImagePath}
      onCopy={() => void copyImageRequest()}
      onIllustration={(value) => updateForm({ imageIsIllustration: value })}
      onCover={(file) => void chooseCover(file)}
    />
  );
  const mealTypes = options?.meal_types ?? [];
  const dietaryTags = options?.dietary_tags ?? [];
  const timeValues = (options?.time_suitability ?? TIME_SUITABILITY_ORDER).filter(
    (value): value is TimeSuitabilityValue =>
      (TIME_SUITABILITY_ORDER as readonly string[]).includes(value),
  );

  return (
    <div className="studio-form-page">
      <Link href={studioAreaManageHref(RECIPES_CAPABILITY)} className="studio-form-page__back">
        <span className="studio-back-arrow" aria-hidden>
          ←
        </span>{' '}
        {t('backToList')}
      </Link>
      <header className="studio-form-page__header">
        <h1 className="studio-form-page__title">{props.mode === 'create' ? t('createTitle') : t('editTitle')}</h1>
        <p className="studio-form-page__lede">{statusLabel}</p>
        <nav className="studio-recipe-progress" aria-label={t('progressLabel')}>
          <ol>
            <li>{t('progressPrepare')}</li>
            <li>{t('progressReview')}</li>
            <li>{t('progressImage')}</li>
            <li>{t('progressSave')}</li>
          </ol>
        </nav>
      </header>

      {screen === 'form' ? <p className="studio-form__section-note">{t('partialDraft')}</p> : null}
      {isRecipePendingReview(status) ? <p className="studio-form__section-note">{t('pendingNote')}</p> : null}
      {canReviseApprovedRecipe(status) ? <p className="studio-form__section-note">{t('approvedNote')}</p> : null}

      {canReviseApprovedRecipe(status) && !revising ? (
        <button type="button" className="studio-form__submit" disabled={busy} onClick={() => setRevising(true)}>
          {t('revise')}
        </button>
      ) : null}

      {screen === 'choose' ? (
        <div className="studio-recipe-choices">
          <button
            type="button"
            className="studio-form__submit"
            onClick={() => {
              setPasteReturn('choose');
              setScreen('paste');
            }}
          >
            {t('pasteReady')}
          </button>
          <button type="button" className="creator-workspace__media-btn" onClick={() => setScreen('form')}>
            {t('manualCreate')}
          </button>
        </div>
      ) : null}

      {screen === 'paste' && editable ? (
        <RecipePastePanel
          steps={[t('pasteStep1'), t('pasteStep2'), t('pasteStep3')]}
          requestLede={t('pasteLede')}
          requestLabel={t('pasteRequestLabel')}
          requestPlaceholder={t('pasteRequestPlaceholder')}
          request={pasteRequest}
          requestError={copyNeedsRequest ? t('pasteRequestMissing') : null}
          copyLabel={t('copyPrompt')}
          copiedLabel={promptCopied ? t('promptCopied') : null}
          manualCopyLabel={promptFallback ? t('pasteCopyManual') : null}
          fallbackPrompt={promptFallback}
          reviewNote={t('pasteReviewNote')}
          pasteLabel={t('pasteLabel')}
          showLabel={t('showRecipe')}
          manualLabel={t('manualCreate')}
          backLabel={pasteReturn === 'choose' ? t('backToChoices') : pasteReturn === 'preview' ? t('backToPreview') : t('editDetails')}
          text={pasteText}
          error={importError}
          disabled={busy}
          onRequest={(value) => {
            setPasteRequest(value);
            setCopyNeedsRequest(false);
            setPromptCopied(false);
            setPromptFallback(null);
          }}
          onText={(value) => {
            setPasteText(value);
            setImportError(null);
          }}
          onCopy={() => void copyRecipePrompt()}
          onShow={showPastedRecipe}
          onManual={() => setScreen('form')}
          onBack={() => setScreen(pasteReturn)}
        />
      ) : null}

      {screen === 'preview' && editable ? (
        <div className="studio-recipe-actions">
          <button
            type="button"
            className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
            disabled={busy}
            onClick={() => {
              setPasteReturn('preview');
              setScreen('paste');
            }}
          >
            {t('pasteReady')}
          </button>
        </div>
      ) : null}

      {screen === 'preview' ? (
        <RecipePreview
          form={form}
          lang={previewLang}
          editable={editable}
          busy={busy}
          imageSection={coverSection}
          error={error}
          savedNote={savedNote}
          submitIssue={submitIssue}
          submitAllowed={submitAllowed}
          showSubmit={props.mode === 'edit'}
          onLang={setPreviewLang}
          onCreditHe={(value) => {
            setCreditHeEdited(true);
            updateForm({ creditHe: value });
          }}
          onCreditEn={(value) => {
            setCreditEnEdited(true);
            updateForm({ creditEn: value });
          }}
          onSourceName={(value) => updateForm({ sourceName: value })}
          onSourceUrl={(value) => updateForm({ sourceUrl: value })}
          onEditDetails={() => setScreen('form')}
          onSave={() => void save()}
          onSubmit={() => void submit()}
        />
      ) : null}

      {screen === 'form' ? (
      <>
      {editable ? (
        <div className="studio-recipe-actions">
          <button
            type="button"
            className="creator-workspace__media-btn"
            disabled={busy}
            onClick={() => {
              setPasteReturn('form');
              setScreen('paste');
            }}
          >
            {t('pasteReady')}
          </button>
          {recipeImportNeedsConfirmation(form) ? (
            <button type="button" className="creator-workspace__media-btn creator-workspace__media-btn--ghost" disabled={busy} onClick={() => setScreen('preview')}>
              {t('backToPreview')}
            </button>
          ) : null}
        </div>
      ) : null}
      <div className="studio-form__field">
        <div className="studio-form__label-row">
          <label htmlFor="recipe-title-he">{t('titleHe')}</label>
          <StudioFieldHint id="recipe-title-hint" text={t('titleMore')} label={hints('fieldHelp')} />
        </div>
        <p id="recipe-title-lede" className="studio-form__field-lede">
          {t('titleLede')}
        </p>
        <input
          id="recipe-title-he"
          aria-describedby="recipe-title-lede"
          value={form.titleHe}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ titleHe: event.target.value })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-title-en">{t('titleEn')}</label>
        <input
          id="recipe-title-en"
          dir="ltr"
          value={form.titleEn}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ titleEn: event.target.value })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-description-he">{t('descriptionHe')}</label>
        <p id="recipe-description-lede" className="studio-form__field-lede">
          {t('descriptionLede')}
        </p>
        <textarea
          id="recipe-description-he"
          aria-describedby="recipe-description-lede"
          value={form.descriptionHe}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ descriptionHe: event.target.value })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-description-en">{t('descriptionEn')}</label>
        <textarea
          id="recipe-description-en"
          dir="ltr"
          value={form.descriptionEn}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ descriptionEn: event.target.value })}
        />
      </div>

      <div className="studio-form__field">
        <div className="studio-form__label-row">
          <label htmlFor="recipe-credit-he">{t('creditHe')}</label>
          <StudioFieldHint id="recipe-credit-hint" text={t('creditMore')} label={hints('fieldHelp')} />
        </div>
        <p id="recipe-credit-lede" className="studio-form__field-lede">
          {t('creditLede')}
        </p>
        <input
          id="recipe-credit-he"
          aria-describedby="recipe-credit-lede"
          value={form.creditHe}
          disabled={!editable || busy}
          onChange={(event) => {
            setCreditHeEdited(true);
            updateForm({ creditHe: event.target.value });
          }}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-credit-en">{t('creditEn')}</label>
        <input
          id="recipe-credit-en"
          dir="ltr"
          value={form.creditEn}
          disabled={!editable || busy}
          onChange={(event) => {
            setCreditEnEdited(true);
            updateForm({ creditEn: event.target.value });
          }}
        />
      </div>

      <div className="studio-form__field">
        <div className="studio-form__label-row">
          <label htmlFor="recipe-minutes">{t('totalMinutes')}</label>
          <StudioFieldHint id="recipe-minutes-hint" text={t('totalMinutesMore')} label={hints('fieldHelp')} />
        </div>
        <p id="recipe-minutes-lede" className="studio-form__field-lede">
          {t('totalMinutesLede')}
        </p>
        <input
          id="recipe-minutes"
          inputMode="numeric"
          aria-describedby="recipe-minutes-lede"
          value={form.totalMinutes}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ totalMinutes: event.target.value.replace(/\D/g, '') })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-servings">{t('servings')}</label>
        <p id="recipe-servings-lede" className="studio-form__field-lede">
          {t('servingsLede')}
        </p>
        <input
          id="recipe-servings"
          inputMode="numeric"
          aria-describedby="recipe-servings-lede"
          value={form.servings}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ servings: event.target.value.replace(/\D/g, '') })}
        />
      </div>

      <div className="studio-form__field">
        <label htmlFor="recipe-meal">{t('mealType')}</label>
        <select
          id="recipe-meal"
          value={form.mealType}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ mealType: event.target.value })}
        >
          <option value="">{t('mealUnset')}</option>
          {mealTypes.map((meal) => (
            <option key={meal} value={meal}>
              {meal in MEAL_KEYS ? t(MEAL_KEYS[meal as keyof typeof MEAL_KEYS]) : meal}
            </option>
          ))}
        </select>
      </div>

      <div className="studio-form__field">
        <span id="recipe-time-label" className="studio-form__legend">
          {t('timeSuitability')}
        </span>
        <p id="recipe-time-lede" className="studio-form__field-lede">
          {t('timeSuitabilityLede')}
        </p>
        <div className="studio-time-suitability" role="group" aria-labelledby="recipe-time-label">
          {timeValues.map((option) => {
            const selected = form.timeSuitability.includes(option);
            return (
              <button
                key={option}
                type="button"
                className={`studio-time-suitability__chip${selected ? ' studio-time-suitability__chip--selected' : ''}`}
                aria-pressed={selected}
                disabled={!editable || busy}
                onClick={() => updateForm({ timeSuitability: toggleTimeSuitabilityValue(form.timeSuitability, option) })}
              >
                {optionsT(TIME_KEYS[option])}
              </button>
            );
          })}
        </div>
      </div>

      <div className="studio-form__field">
        <div className="studio-form__label-row">
          <span id="recipe-diet-label" className="studio-form__legend">
            {t('dietaryTags')}
          </span>
          <StudioFieldHint id="recipe-diet-hint" text={t('dietaryMore')} label={hints('fieldHelp')} />
        </div>
        <p id="recipe-diet-lede" className="studio-form__field-lede">
          {t('dietaryLede')}
        </p>
        <div role="group" aria-labelledby="recipe-diet-label" aria-describedby="recipe-diet-lede">
          {dietaryTags.map((tag) => (
            <label key={tag} className="studio-recipe-check" htmlFor={`recipe-diet-${tag}`}>
              <input
                id={`recipe-diet-${tag}`}
                type="checkbox"
                checked={form.dietaryTags.includes(tag)}
                disabled={!editable || busy}
                onChange={() => updateForm({ dietaryTags: toggleDietaryTag(form.dietaryTags, tag, dietaryTags) })}
              />
              <span>{tag in DIET_KEYS ? t(DIET_KEYS[tag as keyof typeof DIET_KEYS]) : tag}</span>
            </label>
          ))}
        </div>
      </div>

      <h2 className="studio-form__legend">{t('ingredientsTitle')}</h2>
      <p className="studio-form__field-lede">{t('ingredientsLede')}</p>
      <ol className="studio-recipe-lines">
        {form.ingredients.map((ingredient, index) => (
          <li key={ingredient.id} className="studio-recipe-line">
            <p className="studio-recipe-line__index">{t('ingredientPosition', { position: index + 1 })}</p>
            <div className="studio-form__field">
              <label htmlFor={`ingredient-he-${ingredient.id}`}>{t('ingredientNameHe')}</label>
              <input
                id={`ingredient-he-${ingredient.id}`}
                value={ingredient.nameHe}
                disabled={!editable || busy}
                onChange={(event) =>
                  updateForm({
                    ingredients: form.ingredients.map((item) =>
                      item.id === ingredient.id ? { ...item, nameHe: event.target.value } : item,
                    ),
                  })
                }
              />
            </div>
            <div className="studio-form__field">
              <label htmlFor={`ingredient-en-${ingredient.id}`}>{t('ingredientNameEn')}</label>
              <input
                id={`ingredient-en-${ingredient.id}`}
                dir="ltr"
                value={ingredient.nameEn}
                disabled={!editable || busy}
                onChange={(event) =>
                  updateForm({
                    ingredients: form.ingredients.map((item) =>
                      item.id === ingredient.id ? { ...item, nameEn: event.target.value } : item,
                    ),
                  })
                }
              />
            </div>
            <div className="studio-form__field">
              <label htmlFor={`ingredient-amount-${ingredient.id}`}>{t('amount')}</label>
              <input
                id={`ingredient-amount-${ingredient.id}`}
                dir="ltr"
                value={ingredient.amount}
                disabled={!editable || busy}
                onChange={(event) =>
                  updateForm({
                    ingredients: form.ingredients.map((item) =>
                      item.id === ingredient.id ? { ...item, amount: event.target.value } : item,
                    ),
                  })
                }
              />
            </div>
            {editable ? (
              <div className="studio-recipe-line__actions">
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy || index === 0}
                  onClick={() => updateForm({ ingredients: moveRecipeItems(form.ingredients, index, -1) })}
                >
                  {t('moveUp')}
                </button>
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy || index === form.ingredients.length - 1}
                  onClick={() => updateForm({ ingredients: moveRecipeItems(form.ingredients, index, 1) })}
                >
                  {t('moveDown')}
                </button>
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy}
                  onClick={() => updateForm({ ingredients: form.ingredients.filter((item) => item.id !== ingredient.id) })}
                >
                  {t('removeIngredient')}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {editable ? (
        <button
          type="button"
          className="creator-workspace__media-btn"
          disabled={busy}
          onClick={() =>
            updateForm({
              ingredients: [...form.ingredients, emptyRecipeIngredient(`ingredient-${lineId.current++}`)],
            })
          }
        >
          {t('addIngredient')}
        </button>
      ) : null}

      <h2 className="studio-form__legend">{t('stepsTitle')}</h2>
      <p className="studio-form__field-lede">{t('stepsLede')}</p>
      <ol className="studio-recipe-lines">
        {form.steps.map((step, index) => (
          <li key={step.id} className="studio-recipe-line">
            <p className="studio-recipe-line__index">{t('stepPosition', { position: index + 1 })}</p>
            <div className="studio-form__field">
              <label htmlFor={`step-he-${step.id}`}>{t('stepTextHe')}</label>
              <textarea
                id={`step-he-${step.id}`}
                value={step.textHe}
                disabled={!editable || busy}
                onChange={(event) =>
                  updateForm({
                    steps: form.steps.map((item) =>
                      item.id === step.id ? { ...item, textHe: event.target.value } : item,
                    ),
                  })
                }
              />
            </div>
            <div className="studio-form__field">
              <label htmlFor={`step-en-${step.id}`}>{t('stepTextEn')}</label>
              <textarea
                id={`step-en-${step.id}`}
                dir="ltr"
                value={step.textEn}
                disabled={!editable || busy}
                onChange={(event) =>
                  updateForm({
                    steps: form.steps.map((item) =>
                      item.id === step.id ? { ...item, textEn: event.target.value } : item,
                    ),
                  })
                }
              />
            </div>
            {editable ? (
              <div className="studio-recipe-line__actions">
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy || index === 0}
                  onClick={() => updateForm({ steps: moveRecipeItems(form.steps, index, -1) })}
                >
                  {t('moveUp')}
                </button>
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy || index === form.steps.length - 1}
                  onClick={() => updateForm({ steps: moveRecipeItems(form.steps, index, 1) })}
                >
                  {t('moveDown')}
                </button>
                <button
                  type="button"
                  className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                  disabled={busy}
                  onClick={() => updateForm({ steps: form.steps.filter((item) => item.id !== step.id) })}
                >
                  {t('removeStep')}
                </button>
              </div>
            ) : null}
          </li>
        ))}
      </ol>
      {editable ? (
        <button
          type="button"
          className="creator-workspace__media-btn"
          disabled={busy}
          onClick={() => updateForm({ steps: [...form.steps, emptyRecipeStep(`step-${lineId.current++}`)] })}
        >
          {t('addStep')}
        </button>
      ) : null}

      <div className="studio-form__field">
        <label htmlFor="recipe-source-name">{t('sourceName')}</label>
        <p id="recipe-source-lede" className="studio-form__field-lede">
          {t('sourceLede')}
        </p>
        <input
          id="recipe-source-name"
          aria-describedby="recipe-source-lede"
          value={form.sourceName}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ sourceName: event.target.value })}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-source-url">{t('sourceUrl')}</label>
        <input
          id="recipe-source-url"
          dir="ltr"
          inputMode="url"
          value={form.sourceUrl}
          disabled={!editable || busy}
          onChange={(event) => updateForm({ sourceUrl: event.target.value })}
        />
      </div>

      {coverSection}

      {error ? (
        <p className="studio-form__error" role="alert">
          {error}
        </p>
      ) : null}
      {savedNote ? (
        <p className="studio-form-page__status" role="status">
          {savedNote}
        </p>
      ) : null}
      {props.mode === 'edit' && editable && submitIssue ? (
        <p className="studio-form__field-lede">{t(`submitIssue.${submitIssue}` as `submitIssue.${RecipeSubmitIssue}`)}</p>
      ) : null}

      {editable ? (
        <div className="studio-recipe-actions">
          <button type="button" className="studio-form__submit" disabled={busy} onClick={() => void save()}>
            {busy ? t('saving') : t('save')}
          </button>
          {props.mode === 'edit' ? (
            <button type="button" className="studio-form__submit" disabled={busy || !submitAllowed} onClick={() => void submit()}>
              {t('submit')}
            </button>
          ) : null}
        </div>
      ) : null}
      </>
      ) : null}

      {props.mode === 'edit' && !detail?.archived_at ? (
        <button type="button" className="creator-workspace__media-btn creator-workspace__media-btn--ghost" disabled={busy} onClick={() => setConfirm('archive')}>
          {t('archive')}
        </button>
      ) : null}
      {props.mode === 'edit' && detail?.archived_at ? (
        <button type="button" className="creator-workspace__media-btn" disabled={busy} onClick={() => setConfirm('unarchive')}>
          {t('unarchive')}
        </button>
      ) : null}

      <StudioConfirmDialog
        open={confirm === 'archive'}
        title={t('archiveTitle')}
        message={t('archiveBody')}
        cancelLabel={t('archiveCancel')}
        confirmLabel={t('archiveConfirm')}
        confirmBusy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void confirmLifecycle()}
      />
      <StudioConfirmDialog
        open={confirm === 'import'}
        title={t('importReplaceTitle')}
        message={t('importReplaceBody')}
        cancelLabel={t('archiveCancel')}
        confirmLabel={t('importReplaceConfirm')}
        confirmBusy={busy}
        onCancel={() => {
          setConfirm(null);
          setPendingImport(null);
        }}
        onConfirm={() => {
          if (pendingImport) applyImported(pendingImport);
          setConfirm(null);
        }}
      />
      <StudioConfirmDialog
        open={confirm === 'unarchive'}
        title={t('unarchiveTitle')}
        message={t('unarchiveBody')}
        cancelLabel={t('archiveCancel')}
        confirmLabel={t('unarchiveConfirm')}
        confirmBusy={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => void confirmLifecycle()}
      />
    </div>
  );
}
