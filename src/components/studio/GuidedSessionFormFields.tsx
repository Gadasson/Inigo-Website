'use client';

import { useTranslations } from 'next-intl';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import type { GuidedSessionDurationMediaSource } from '@/lib/studio/guidedSessionDuration';
import type { GuidedSessionTaxonomy } from '@/lib/studio/guidedSessionTaxonomy';
import { getFocusOptionsForPractice } from '@/lib/studio/guidedSessionTaxonomy';
import {
  GUIDED_SESSION_ACCESS_TIERS,
  GUIDED_SESSION_DIFFICULTIES,
  GUIDED_SESSION_LANGUAGES,
  GUIDED_SESSION_SOUND_GENDERS,
} from '@/lib/studio/guidedSessionOptions';
import StudioFieldLabel from '@/components/studio/StudioFieldLabel';
import GuidedSessionDurationField from '@/components/studio/GuidedSessionDurationField';

type Props = {
  form: GuidedSessionEditorForm;
  durationFromMedia: boolean;
  durationMediaSource: GuidedSessionDurationMediaSource | null;
  taxonomy: GuidedSessionTaxonomy | null;
  taxonomyLoading: boolean;
  taxonomyError?: string | null;
  disabled?: boolean;
  simplified?: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
};

const LANGUAGE_LABEL_KEYS: Record<string, string> = {
  en: 'languageEn',
  he: 'languageHe',
};

const VOICE_LABEL_KEYS: Record<string, string> = {
  male: 'voiceMale',
  female: 'voiceFemale',
  neutral: 'voiceNeutral',
};

const DIFFICULTY_LABEL_KEYS: Record<string, string> = {
  beginner: 'difficultyBeginner',
  intermediate: 'difficultyIntermediate',
  advanced: 'difficultyAdvanced',
};

const ACCESS_LABEL_KEYS: Record<string, string> = {
  free: 'accessFree',
  plus: 'accessPlus',
  premium: 'accessPremium',
  pro: 'accessPro',
};

function taxonomySelectDisabled(
  disabled: boolean,
  taxonomyLoading: boolean,
  optionsCount: number,
): boolean {
  return disabled || taxonomyLoading || optionsCount === 0;
}

function withCurrentTaxonomyOption(
  options: { code: string; label: string }[],
  currentCode: string,
): { code: string; label: string }[] {
  if (!currentCode || options.some((option) => option.code === currentCode)) {
    return options;
  }
  return [{ code: currentCode, label: currentCode }, ...options];
}

export default function GuidedSessionFormFields({
  form,
  durationFromMedia,
  durationMediaSource,
  taxonomy,
  taxonomyLoading,
  taxonomyError = null,
  disabled = false,
  simplified = false,
  onChange,
}: Props) {
  const t = useTranslations('createForm');
  const tf = useTranslations('fields');
  const to = useTranslations('options');

  const practices = withCurrentTaxonomyOption(taxonomy?.practices ?? [], form.practice);
  const practiceFocuses = getFocusOptionsForPractice(taxonomy, form.practice);
  const focuses = withCurrentTaxonomyOption(practiceFocuses, form.focus);
  const focusSelectDisabled =
    disabled ||
    taxonomyLoading ||
    !form.practice.trim() ||
    practiceFocuses.length === 0;

  const titleField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="title">{tf('title')}</StudioFieldLabel>
      <input
        id="title"
        name="title"
        type="text"
        value={form.title}
        onChange={onChange}
        disabled={disabled}
        autoComplete="off"
        placeholder={tf('titlePlaceholder')}
      />
    </div>
  );

  const descriptionField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="description" hintKey="description">
        {tf('description')}
      </StudioFieldLabel>
      <textarea
        id="description"
        name="description"
        rows={4}
        value={form.description}
        onChange={onChange}
        disabled={disabled}
        placeholder={tf('descriptionPlaceholder')}
      />
    </div>
  );

  const durationField = (
    <GuidedSessionDurationField
      durationMm={form.durationMm}
      durationSs={form.durationSs}
      isFromMedia={durationFromMedia}
      mediaSource={durationMediaSource}
      disabled={disabled}
      onChange={onChange}
    />
  );

  const languageField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="language">{tf('language')}</StudioFieldLabel>
      <select
        id="language"
        name="language"
        value={form.language}
        onChange={onChange}
        disabled={disabled}
      >
        {GUIDED_SESSION_LANGUAGES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {to(LANGUAGE_LABEL_KEYS[opt.value] ?? opt.value)}
          </option>
        ))}
      </select>
    </div>
  );

  const voiceField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="soundGender" hintKey="voice">
        {tf('voice')}
      </StudioFieldLabel>
      <select
        id="soundGender"
        name="soundGender"
        value={form.soundGender}
        onChange={onChange}
        disabled={disabled}
      >
        {GUIDED_SESSION_SOUND_GENDERS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {to(VOICE_LABEL_KEYS[opt.value] ?? opt.value)}
          </option>
        ))}
      </select>
    </div>
  );

  const difficultyField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="difficulty" hintKey="difficulty">
        {tf('difficulty')}
      </StudioFieldLabel>
      <select
        id="difficulty"
        name="difficulty"
        value={form.difficulty}
        onChange={onChange}
        disabled={disabled}
      >
        {GUIDED_SESSION_DIFFICULTIES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {to(DIFFICULTY_LABEL_KEYS[opt.value] ?? opt.value)}
          </option>
        ))}
      </select>
    </div>
  );

  const practiceField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="practice" hintKey="practice">
        {tf('practice')}
      </StudioFieldLabel>
      <select
        id="practice"
        name="practice"
        value={form.practice}
        onChange={onChange}
        disabled={taxonomySelectDisabled(disabled, taxonomyLoading, practices.length)}
      >
        {!form.practice ? (
          <option value="">
            {taxonomyLoading ? tf('loadingPractices') : tf('selectPractice')}
          </option>
        ) : null}
        {practices.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const focusField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="focus" hintKey="focus">
        {tf('focus')}
      </StudioFieldLabel>
      <select
        id="focus"
        name="focus"
        value={form.focus}
        onChange={onChange}
        disabled={focusSelectDisabled}
      >
        {!form.focus ? (
          <option value="">
            {!form.practice.trim()
              ? tf('selectPracticeFirst')
              : taxonomyLoading
                ? tf('loadingFocus')
                : practiceFocuses.length === 0
                  ? tf('noFocus')
                  : tf('selectFocus')}
          </option>
        ) : null}
        {focuses.map((opt) => (
          <option key={opt.code} value={opt.code}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const taxonomyErrorBlock = taxonomyError ? (
    <p className="studio-form__error" role="alert">
      {taxonomyError}
    </p>
  ) : null;

  if (simplified) {
    return (
      <div className="studio-form">
        {titleField}
        {descriptionField}

        <div className="studio-form__row">
          {practiceField}
          {focusField}
        </div>
        {taxonomyErrorBlock}

        <div className="studio-form__row">
          {voiceField}
          {languageField}
        </div>

        {durationField}

        <p className="studio-form__section-note">{t('defaultsNote')}</p>
      </div>
    );
  }

  return (
    <div className="studio-form">
      {titleField}
      {descriptionField}

      <div className="studio-form__row">
        {durationField}
        {languageField}
      </div>

      <div className="studio-form__row">
        {voiceField}
        {difficultyField}
      </div>

      <div className="studio-form__row">
        {practiceField}
        {focusField}
      </div>

      {taxonomyErrorBlock}

      <div className="studio-form__field">
        <StudioFieldLabel htmlFor="instructor" hintKey="instructor">
          {tf('instructor')}
        </StudioFieldLabel>
        <input
          id="instructor"
          name="instructor"
          type="text"
          value={form.instructor}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
        />
      </div>

      <div className="studio-form__row">
        <div className="studio-form__field">
          <StudioFieldLabel htmlFor="environment" hintKey="environment">
            {tf('environment')}
          </StudioFieldLabel>
          <input
            id="environment"
            name="environment"
            type="text"
            value={form.environment}
            onChange={onChange}
            disabled={disabled}
            autoComplete="off"
            placeholder={tf('environmentPlaceholder')}
          />
        </div>

        <div className="studio-form__field">
          <StudioFieldLabel htmlFor="backgroundMusic" hintKey="backgroundMusic">
            {tf('backgroundMusic')}
          </StudioFieldLabel>
          <input
            id="backgroundMusic"
            name="backgroundMusic"
            type="text"
            value={form.backgroundMusic}
            onChange={onChange}
            disabled={disabled}
            autoComplete="off"
            placeholder={tf('backgroundMusicPlaceholder')}
          />
        </div>
      </div>

      <div className="studio-form__field">
        <StudioFieldLabel htmlFor="backgroundMusicCreator" hintKey="backgroundMusicCreator">
          {tf('backgroundMusicCreator')}
        </StudioFieldLabel>
        <input
          id="backgroundMusicCreator"
          name="backgroundMusicCreator"
          type="text"
          value={form.backgroundMusicCreator}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
          placeholder={tf('backgroundMusicCreatorPlaceholder')}
        />
      </div>

      <div className="studio-form__field">
        <StudioFieldLabel htmlFor="accessTier" hintKey="accessTier">
          {tf('accessTier')}
        </StudioFieldLabel>
        <select
          id="accessTier"
          name="accessTier"
          value={form.accessTier}
          onChange={onChange}
          disabled={disabled}
        >
          {GUIDED_SESSION_ACCESS_TIERS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {to(ACCESS_LABEL_KEYS[opt.value] ?? opt.value)}
            </option>
          ))}
        </select>
      </div>

      <div className="studio-form__field">
        <StudioFieldLabel htmlFor="tagsText" hintKey="tags">
          {tf('tags')}
        </StudioFieldLabel>
        <input
          id="tagsText"
          name="tagsText"
          type="text"
          value={form.tagsText}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
          placeholder={tf('tagsPlaceholder')}
        />
      </div>
    </div>
  );
}
