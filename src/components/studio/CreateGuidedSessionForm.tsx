'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createGuidedSessionDraft } from '@/lib/api/studioGuidedSessions';
import { generateSessionId } from '@/lib/studio/generateSessionId';
import { minutesToDurationString } from '@/lib/studio/formatDuration';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import {
  GUIDED_SESSION_CATEGORIES,
  GUIDED_SESSION_CREATE_DEFAULTS,
  GUIDED_SESSION_DIFFICULTIES,
  GUIDED_SESSION_LANGUAGES,
  GUIDED_SESSION_PRIMARY_CATEGORIES,
  GUIDED_SESSION_SOUND_GENDERS,
} from '@/lib/studio/guidedSessionOptions';

type FormState = {
  title: string;
  description: string;
  durationMinutes: string;
  language: string;
  soundGender: string;
  difficulty: string;
  category: string;
  primaryCategory: string;
};

const INITIAL_FORM: FormState = {
  title: '',
  description: '',
  durationMinutes: '10',
  language: 'en',
  soundGender: 'neutral',
  difficulty: 'beginner',
  category: 'stress-relief',
  primaryCategory: 'meditation',
};

export default function CreateGuidedSessionForm() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const instructor =
    user?.displayName?.trim() || user?.email?.split('@')[0] || user?.email || 'Creator';

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (form.title.trim().length < 2) return 'Please add a title.';
    if (form.description.trim().length < 10) return 'Description should be at least a few words.';
    const minutes = Number(form.durationMinutes);
    if (!Number.isFinite(minutes) || minutes < 1 || minutes > 180) {
      return 'Duration must be between 1 and 180 minutes.';
    }
    return null;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);

    try {
      const token = await getIdToken();
      const sessionId = generateSessionId(form.title.trim());

      const draft = await createGuidedSessionDraft(
        {
          session_id: sessionId,
          title: form.title.trim(),
          description: form.description.trim(),
          duration: minutesToDurationString(Number(form.durationMinutes)),
          difficulty: form.difficulty,
          category: form.category,
          primary_category: form.primaryCategory,
          instructor,
          environment: GUIDED_SESSION_CREATE_DEFAULTS.environment,
          background_music: GUIDED_SESSION_CREATE_DEFAULTS.background_music,
          language: form.language,
          sound_gender: form.soundGender,
          access_tier: GUIDED_SESSION_CREATE_DEFAULTS.access_tier,
          tags: GUIDED_SESSION_CREATE_DEFAULTS.tags,
          sub_category_codes: GUIDED_SESSION_CREATE_DEFAULTS.sub_category_codes,
        },
        token,
      );

      router.push(`/studio/guided-sessions/${draft.id}`);
    } catch (err) {
      setError(parseStudioApiError(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="studio-form-page">
      <Link href="/studio?tab=sessions" className="studio-form-page__back">
        ← Back to Studio
      </Link>

      <header className="studio-form-page__header">
        <h1 className="studio-form-page__title">Create guided session</h1>
        <p className="studio-form-page__lede">
          Start with the basics. You can refine everything later.
        </p>
      </header>

      <form className="studio-form" onSubmit={onSubmit} noValidate>
        <div className="studio-form__field">
          <label htmlFor="title">Title</label>
          <input
            id="title"
            name="title"
            type="text"
            required
            value={form.title}
            onChange={onChange}
            autoComplete="off"
            placeholder="Morning breath"
          />
        </div>

        <div className="studio-form__field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            required
            rows={4}
            value={form.description}
            onChange={onChange}
            placeholder="What will someone feel or learn in this session?"
          />
        </div>

        <div className="studio-form__row">
          <div className="studio-form__field">
            <label htmlFor="durationMinutes">Duration (minutes)</label>
            <input
              id="durationMinutes"
              name="durationMinutes"
              type="number"
              min={1}
              max={180}
              required
              value={form.durationMinutes}
              onChange={onChange}
            />
          </div>

          <div className="studio-form__field">
            <label htmlFor="language">Language</label>
            <select id="language" name="language" value={form.language} onChange={onChange}>
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
            <label htmlFor="soundGender">Voice</label>
            <select id="soundGender" name="soundGender" value={form.soundGender} onChange={onChange}>
              {GUIDED_SESSION_SOUND_GENDERS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="studio-form__field">
            <label htmlFor="difficulty">Difficulty</label>
            <select id="difficulty" name="difficulty" value={form.difficulty} onChange={onChange}>
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
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={form.category} onChange={onChange}>
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
            >
              {GUIDED_SESSION_PRIMARY_CATEGORIES.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <p className="studio-form__meta">
          Instructor: <span>{instructor}</span>
        </p>

        {error ? (
          <p className="studio-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="studio-form__actions">
          <button type="submit" className="studio-form__submit" disabled={submitting}>
            {submitting ? 'Creating…' : 'Create draft'}
          </button>
        </div>
      </form>
    </div>
  );
}
