import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import {
  GUIDED_SESSION_ACCESS_TIERS,
  GUIDED_SESSION_CATEGORIES,
  GUIDED_SESSION_DIFFICULTIES,
  GUIDED_SESSION_LANGUAGES,
  GUIDED_SESSION_PRIMARY_CATEGORIES,
  GUIDED_SESSION_SOUND_GENDERS,
} from '@/lib/studio/guidedSessionOptions';
import StudioFieldLabel from '@/components/studio/StudioFieldLabel';

type Props = {
  form: GuidedSessionEditorForm;
  disabled?: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
};

export default function GuidedSessionFormFields({
  form,
  disabled = false,
  onChange,
}: Props) {
  return (
    <div className="studio-form">
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

      <div className="studio-form__row">
        <div className="studio-form__field">
          <StudioFieldLabel htmlFor="durationMinutes">Duration (minutes)</StudioFieldLabel>
          <input
            id="durationMinutes"
            name="durationMinutes"
            type="number"
            min={1}
            max={180}
            value={form.durationMinutes}
            onChange={onChange}
            disabled={disabled}
          />
        </div>

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
      </div>

      <div className="studio-form__row">
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
      </div>

      <div className="studio-form__row">
        <div className="studio-form__field">
          <StudioFieldLabel htmlFor="category" hintKey="category">
            Category
          </StudioFieldLabel>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={onChange}
            disabled={disabled}
          >
            {GUIDED_SESSION_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="studio-form__field">
          <StudioFieldLabel htmlFor="primaryCategory" hintKey="primaryCategory">
            Primary category
          </StudioFieldLabel>
          <select
            id="primaryCategory"
            name="primaryCategory"
            value={form.primaryCategory}
            onChange={onChange}
            disabled={disabled}
          >
            {GUIDED_SESSION_PRIMARY_CATEGORIES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

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
