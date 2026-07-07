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
  /**
   * When true, only expose the fields a creator truly needs (create flow).
   * Advanced/system fields stay in form state with their defaults and are
   * still sent in the POST payload — they are just hidden from the UI.
   */
  simplified?: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
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
      <StudioFieldLabel htmlFor="title">Title</StudioFieldLabel>
      <input
        id="title"
        name="title"
        type="text"
        value={form.title}
        onChange={onChange}
        disabled={disabled}
        autoComplete="off"
        placeholder="Morning breath"
      />
    </div>
  );

  const descriptionField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="description" hintKey="description">
        Description
      </StudioFieldLabel>
      <textarea
        id="description"
        name="description"
        rows={4}
        value={form.description}
        onChange={onChange}
        disabled={disabled}
        placeholder="What will someone feel or learn in this session?"
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
      <StudioFieldLabel htmlFor="language">Language</StudioFieldLabel>
      <select
        id="language"
        name="language"
        value={form.language}
        onChange={onChange}
        disabled={disabled}
      >
        {GUIDED_SESSION_LANGUAGES.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const voiceField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="soundGender" hintKey="voice">
        Voice
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
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const difficultyField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="difficulty" hintKey="difficulty">
        Difficulty
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
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );

  const practiceField = (
    <div className="studio-form__field">
      <StudioFieldLabel htmlFor="practice" hintKey="practice">
        Practice
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
            {taxonomyLoading ? 'Loading practices…' : 'Select practice'}
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
        Focus
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
              ? 'Select a practice first'
              : taxonomyLoading
                ? 'Loading focus options…'
                : practiceFocuses.length === 0
                  ? 'No focus options'
                  : 'Select focus'}
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
          Instructor
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
            Environment
          </StudioFieldLabel>
          <input
            id="environment"
            name="environment"
            type="text"
            value={form.environment}
            onChange={onChange}
            disabled={disabled}
            autoComplete="off"
            placeholder="indoor"
          />
        </div>

        <div className="studio-form__field">
          <StudioFieldLabel htmlFor="backgroundMusic" hintKey="backgroundMusic">
            Background music
          </StudioFieldLabel>
          <input
            id="backgroundMusic"
            name="backgroundMusic"
            type="text"
            value={form.backgroundMusic}
            onChange={onChange}
            disabled={disabled}
            autoComplete="off"
            placeholder="ambient"
          />
        </div>
      </div>

      <div className="studio-form__field">
        <StudioFieldLabel htmlFor="backgroundMusicCreator" hintKey="backgroundMusicCreator">
          Background music creator
        </StudioFieldLabel>
        <input
          id="backgroundMusicCreator"
          name="backgroundMusicCreator"
          type="text"
          value={form.backgroundMusicCreator}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
          placeholder="Optional"
        />
      </div>

      <div className="studio-form__field">
        <StudioFieldLabel htmlFor="accessTier" hintKey="accessTier">
          Access tier
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
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="studio-form__field">
        <StudioFieldLabel htmlFor="tagsText" hintKey="tags">
          Tags
        </StudioFieldLabel>
        <input
          id="tagsText"
          name="tagsText"
          type="text"
          value={form.tagsText}
          onChange={onChange}
          disabled={disabled}
          autoComplete="off"
          placeholder="calm, morning, breath"
        />
      </div>
    </div>
  );
}
