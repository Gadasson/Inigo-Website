import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import {
  GUIDED_SESSION_ACCESS_TIERS,
  GUIDED_SESSION_CATEGORIES,
  GUIDED_SESSION_DIFFICULTIES,
  GUIDED_SESSION_LANGUAGES,
  GUIDED_SESSION_PRIMARY_CATEGORIES,
  GUIDED_SESSION_SOUND_GENDERS,
} from '@/lib/studio/guidedSessionOptions';

type Props = {
  form: GuidedSessionEditorForm;
  disabled: boolean;
  onChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => void;
};

export default function GuidedSessionEditorFields({ form, disabled, onChange }: Props) {
  return (
    <div className="studio-editor__sections">
      <section className="studio-editor__section" aria-labelledby="editor-basics">
        <h2 id="editor-basics" className="studio-editor__section-title">
          Basics
        </h2>
        <div className="studio-form">
          <div className="studio-form__field">
            <label htmlFor="title">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              value={form.title}
              onChange={onChange}
              disabled={disabled}
              autoComplete="off"
            />
          </div>

          <div className="studio-form__field">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              rows={5}
              value={form.description}
              onChange={onChange}
              disabled={disabled}
            />
          </div>

          <div className="studio-form__field">
            <label htmlFor="durationMinutes">Duration (minutes)</label>
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
        </div>
      </section>

      <section className="studio-editor__section" aria-labelledby="editor-details">
        <h2 id="editor-details" className="studio-editor__section-title">
          Details
        </h2>
        <div className="studio-form">
          <div className="studio-form__row">
            <div className="studio-form__field">
              <label htmlFor="language">Language</label>
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

            <div className="studio-form__field">
              <label htmlFor="soundGender">Voice gender</label>
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
          </div>

          <div className="studio-form__row">
            <div className="studio-form__field">
              <label htmlFor="difficulty">Difficulty</label>
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

            <div className="studio-form__field">
              <label htmlFor="accessTier">Access tier</label>
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
          </div>

          <div className="studio-form__row">
            <div className="studio-form__field">
              <label htmlFor="category">Category</label>
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
              <label htmlFor="primaryCategory">Primary category</label>
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
        </div>
      </section>

      <section className="studio-editor__section" aria-labelledby="editor-atmosphere">
        <h2 id="editor-atmosphere" className="studio-editor__section-title">
          Atmosphere
        </h2>
        <div className="studio-form">
          <div className="studio-form__field">
            <label htmlFor="instructor">Instructor</label>
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
              <label htmlFor="environment">Environment</label>
              <input
                id="environment"
                name="environment"
                type="text"
                value={form.environment}
                onChange={onChange}
                disabled={disabled}
                autoComplete="off"
              />
            </div>

            <div className="studio-form__field">
              <label htmlFor="backgroundMusic">Background music</label>
              <input
                id="backgroundMusic"
                name="backgroundMusic"
                type="text"
                value={form.backgroundMusic}
                onChange={onChange}
                disabled={disabled}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="studio-form__field">
            <label htmlFor="backgroundMusicCreator">Background music creator</label>
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
        </div>
      </section>

      <section className="studio-editor__section" aria-labelledby="editor-tags">
        <h2 id="editor-tags" className="studio-editor__section-title">
          Tags
        </h2>
        <div className="studio-form">
          <div className="studio-form__field">
            <label htmlFor="tagsText">Tags</label>
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
            <p className="studio-form__meta">Separate tags with commas.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
