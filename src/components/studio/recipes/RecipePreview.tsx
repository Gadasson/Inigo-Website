'use client';

import type { ReactNode } from 'react';
import { useTranslations } from 'next-intl';
import { recipeLanguageComplete, type RecipeEditorForm, type RecipeSubmitIssue } from '@/lib/studio/recipeEditor';

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

const TIME_KEYS = {
  anytime: 'timeSuitabilityAnytime',
  morning: 'timeSuitabilityMorning',
  midday: 'timeSuitabilityMidday',
  evening: 'timeSuitabilityEvening',
  late_night: 'timeSuitabilityLateNight',
} as const;

type Props = {
  form: RecipeEditorForm;
  lang: 'he' | 'en';
  editable: boolean;
  busy: boolean;
  imageSection: ReactNode;
  error: string | null;
  savedNote: string | null;
  submitIssue: RecipeSubmitIssue | null;
  submitAllowed: boolean;
  showSubmit: boolean;
  onLang: (lang: 'he' | 'en') => void;
  onCreditHe: (value: string) => void;
  onCreditEn: (value: string) => void;
  onSourceName: (value: string) => void;
  onSourceUrl: (value: string) => void;
  onEditDetails: () => void;
  onSave: () => void;
  onSubmit: () => void;
};

export default function RecipePreview({
  form,
  lang,
  editable,
  busy,
  imageSection,
  error,
  savedNote,
  submitIssue,
  submitAllowed,
  showSubmit,
  onLang,
  onCreditHe,
  onCreditEn,
  onSourceName,
  onSourceUrl,
  onEditDetails,
  onSave,
  onSubmit,
}: Props) {
  const t = useTranslations('recipes');
  const optionsT = useTranslations('options');
  const complete = recipeLanguageComplete(form, lang);
  const title = lang === 'he' ? form.titleHe : form.titleEn;
  const description = lang === 'he' ? form.descriptionHe : form.descriptionEn;
  const credit = lang === 'he' ? form.creditHe : form.creditEn;
  const mealLabel =
    form.mealType in MEAL_KEYS ? t(MEAL_KEYS[form.mealType as keyof typeof MEAL_KEYS]) : form.mealType;

  return (
    <div className="studio-recipe-preview" dir={lang === 'he' ? 'rtl' : 'ltr'} lang={lang}>
      <div className="studio-recipe-actions" dir="ltr">
        <button
          type="button"
          className={`studio-workspace__tab${lang === 'he' ? ' studio-workspace__tab--active' : ''}`}
          aria-pressed={lang === 'he'}
          onClick={() => onLang('he')}
        >
          {t('previewHebrew')}
        </button>
        <button
          type="button"
          className={`studio-workspace__tab${lang === 'en' ? ' studio-workspace__tab--active' : ''}`}
          aria-pressed={lang === 'en'}
          onClick={() => onLang('en')}
        >
          {t('previewEnglish')}
        </button>
      </div>

      {complete ? null : <p className="studio-form__section-note">{t('previewLanguageMissing')}</p>}
      <h2 className="studio-form-page__title">{title || t('untitled')}</h2>
      {description ? <p className="studio-form__field-lede">{description}</p> : null}
      {credit ? (
        <p className="studio-form__field-lede">
          {t('previewCredit')} {credit}
        </p>
      ) : null}
      <p className="studio-form__field-lede">
        {t('previewFacts', { minutes: form.totalMinutes, servings: form.servings, meal: mealLabel })}
      </p>
      <p className="studio-form__field-lede">
        {form.timeSuitability
          .map((value) => (value in TIME_KEYS ? optionsT(TIME_KEYS[value as keyof typeof TIME_KEYS]) : value))
          .join(' · ')}
        {form.dietaryTags.length
          ? ` · ${form.dietaryTags
              .map((tag) => (tag in DIET_KEYS ? t(DIET_KEYS[tag as keyof typeof DIET_KEYS]) : tag))
              .join(' · ')}`
          : ''}
      </p>

      <h3 className="studio-form__legend">{t('ingredientsTitle')}</h3>
      <ol className="studio-recipe-lines">
        {form.ingredients.map((item, index) => (
          <li key={item.id} className="studio-recipe-line">
            <p className="studio-recipe-line__index">{t('ingredientPosition', { position: index + 1 })}</p>
            <p>
              {item.amount}
              {' · '}
              {(lang === 'he' ? item.nameHe : item.nameEn) || t('previewNameMissing')}
            </p>
          </li>
        ))}
      </ol>
      <h3 className="studio-form__legend">{t('stepsTitle')}</h3>
      <ol className="studio-recipe-lines">
        {form.steps.map((item, index) => (
          <li key={item.id} className="studio-recipe-line">
            <p className="studio-recipe-line__index">{t('stepPosition', { position: index + 1 })}</p>
            <p>{(lang === 'he' ? item.textHe : item.textEn) || t('previewNameMissing')}</p>
          </li>
        ))}
      </ol>

      <div className="studio-form__field">
        <label htmlFor="recipe-preview-credit-he">{t('creditHe')}</label>
        <p className="studio-form__field-lede">{t('creditLede')}</p>
        <input
          id="recipe-preview-credit-he"
          value={form.creditHe}
          disabled={!editable || busy}
          onChange={(event) => onCreditHe(event.target.value)}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-preview-credit-en">{t('creditEn')}</label>
        <input
          id="recipe-preview-credit-en"
          dir="ltr"
          value={form.creditEn}
          disabled={!editable || busy}
          onChange={(event) => onCreditEn(event.target.value)}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-preview-source-name">{t('sourceName')}</label>
        <p className="studio-form__field-lede">{t('sourceLede')}</p>
        <input
          id="recipe-preview-source-name"
          value={form.sourceName}
          disabled={!editable || busy}
          onChange={(event) => onSourceName(event.target.value)}
        />
      </div>
      <div className="studio-form__field">
        <label htmlFor="recipe-preview-source-url">{t('sourceUrl')}</label>
        <input
          id="recipe-preview-source-url"
          dir="ltr"
          inputMode="url"
          value={form.sourceUrl}
          disabled={!editable || busy}
          onChange={(event) => onSourceUrl(event.target.value)}
        />
      </div>

      {imageSection}

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
      {editable && submitIssue ? <p className="studio-form__field-lede">{t(`submitIssue.${submitIssue}`)}</p> : null}

      <div className="studio-recipe-actions">
        <button type="button" className="creator-workspace__media-btn" disabled={!editable || busy} onClick={onEditDetails}>
          {t('editDetails')}
        </button>
        {editable ? (
          <button type="button" className="studio-form__submit" disabled={busy} onClick={onSave}>
            {busy ? t('saving') : t('save')}
          </button>
        ) : null}
        {showSubmit ? (
          <button type="button" className="studio-form__submit" disabled={busy || !submitAllowed} onClick={onSubmit}>
            {t('submit')}
          </button>
        ) : null}
      </div>
    </div>
  );
}
