'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createGuidedSessionDraft } from '@/lib/api/studioGuidedSessions';
import { generateSessionId } from '@/lib/studio/generateSessionId';
import { isValidEstimatedDurationMmSs, mmSsToDurationString } from '@/lib/studio/formatDuration';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import {
  createDefaultGuidedSessionForm,
  parseTagsText,
  type GuidedSessionEditorForm,
} from '@/lib/studio/guidedSessionEditorForm';
import { GUIDED_SESSION_CREATE_DEFAULTS } from '@/lib/studio/guidedSessionOptions';
import GuidedSessionFormFields from '@/components/studio/GuidedSessionFormFields';

function instructorFromUser(user: {
  displayName?: string | null;
  email?: string | null;
} | null): string {
  return (
    user?.displayName?.trim() ||
    user?.email?.split('@')[0] ||
    user?.email ||
    'Creator'
  );
}

export default function CreateGuidedSessionForm() {
  const router = useRouter();
  const { user, getIdToken } = useAuth();
  const [form, setForm] = useState<GuidedSessionEditorForm>(() =>
    createDefaultGuidedSessionForm(),
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const suggested = instructorFromUser(user);
    setForm((prev) =>
      prev.instructor === '' || prev.instructor === 'Creator'
        ? { ...prev, instructor: suggested }
        : prev,
    );
  }, [user]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validate = (): string | null => {
    if (form.title.trim().length < 2) return 'Please add a title.';
    if (form.description.trim().length < 10) return 'Description should be at least a few words.';
    if (!isValidEstimatedDurationMmSs(form.durationMm, form.durationSs)) {
      return 'Duration must be between 00:01 and 180:00.';
    }
    if (form.instructor.trim().length < 1) return 'Please add an instructor name.';
    if (form.environment.trim().length < 1) return 'Please add an environment.';
    if (form.backgroundMusic.trim().length < 1) return 'Please add background music.';
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
      const musicCreator = form.backgroundMusicCreator.trim();

      const draft = await createGuidedSessionDraft(
        {
          session_id: sessionId,
          title: form.title.trim(),
          description: form.description.trim(),
          duration: mmSsToDurationString(Number(form.durationMm), Number(form.durationSs)),
          difficulty: form.difficulty,
          category: form.category,
          primary_category: form.primaryCategory,
          instructor: form.instructor.trim(),
          environment: form.environment.trim(),
          background_music: form.backgroundMusic.trim(),
          background_music_creator: musicCreator || undefined,
          language: form.language,
          sound_gender: form.soundGender,
          access_tier: form.accessTier,
          tags: parseTagsText(form.tagsText),
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
      <Link href="/studio" className="studio-form-page__back">
        ← Back to Studio
      </Link>

      <header className="studio-form-page__header">
        <h1 className="studio-form-page__title">Create guided session</h1>
        <p className="studio-form-page__lede">
          Start with the basics. You can refine everything later.
        </p>
      </header>

      <form onSubmit={onSubmit} noValidate>
        <GuidedSessionFormFields
          form={form}
          durationFromMedia={false}
          durationMediaSource={null}
          onChange={onChange}
        />

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
