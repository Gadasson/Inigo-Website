'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
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
import { buildGuidedSessionTaxonomyPayload, applyPracticeSelectionToForm } from '@/lib/studio/guidedSessionTaxonomy';
import { useGuidedSessionTaxonomy } from '@/hooks/useGuidedSessionTaxonomy';
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

function applyTaxonomyDefaults(
  form: GuidedSessionEditorForm,
  practiceCode: string | undefined,
  focusCode: string | undefined,
): GuidedSessionEditorForm {
  return {
    ...form,
    practice: form.practice || practiceCode || '',
    focus: form.focus || focusCode || '',
  };
}

export default function CreateGuidedSessionForm() {
  const router = useRouter();
  const t = useTranslations('createForm');
  const tv = useTranslations('validation');
  const { user, getIdToken } = useAuth();
  const { taxonomy, loading: taxonomyLoading, error: taxonomyError } =
    useGuidedSessionTaxonomy();
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

  useEffect(() => {
    if (!taxonomy?.practices[0]) return;
    const firstPractice = taxonomy.practices[0];
    setForm((prev) =>
      applyTaxonomyDefaults(
        prev,
        firstPractice.code,
        firstPractice.subCategories[0]?.code,
      ),
    );
  }, [taxonomy]);

  const onChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => {
      if (name === 'practice') {
        return applyPracticeSelectionToForm(prev, value, taxonomy);
      }
      return { ...prev, [name]: value };
    });
  };

  const validate = (): string | null => {
    if (form.title.trim().length < 2) return tv('title');
    if (form.description.trim().length < 10) return tv('description');
    if (!isValidEstimatedDurationMmSs(form.durationMm, form.durationSs)) {
      return tv('duration');
    }
    if (!form.practice.trim()) return tv('practice');
    if (!form.focus.trim()) return tv('focus');
    if (form.instructor.trim().length < 1) return tv('instructor');
    if (form.environment.trim().length < 1) return tv('environment');
    if (form.backgroundMusic.trim().length < 1) return tv('backgroundMusic');
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
      const taxonomyPayload = buildGuidedSessionTaxonomyPayload(form.practice, form.focus);

      const draft = await createGuidedSessionDraft(
        {
          session_id: sessionId,
          title: form.title.trim(),
          description: form.description.trim(),
          duration: mmSsToDurationString(Number(form.durationMm), Number(form.durationSs)),
          difficulty: form.difficulty,
          category: taxonomyPayload.category,
          primary_category: taxonomyPayload.primary_category,
          instructor: form.instructor.trim(),
          environment: form.environment.trim(),
          background_music: form.backgroundMusic.trim(),
          background_music_creator: musicCreator || undefined,
          language: form.language,
          sound_gender: form.soundGender,
          access_tier: form.accessTier,
          tags: parseTagsText(form.tagsText),
          sub_category_codes: taxonomyPayload.sub_category_codes,
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
        <span className="studio-back-arrow" aria-hidden>
          ←
        </span>{' '}
        {t('back')}
      </Link>

      <header className="studio-form-page__header">
        <h1 className="studio-form-page__title">{t('title')}</h1>
        <p className="studio-form-page__lede">{t('lede')}</p>
      </header>

      <form onSubmit={onSubmit} noValidate>
        <GuidedSessionFormFields
          form={form}
          durationFromMedia={false}
          durationMediaSource={null}
          taxonomy={taxonomy}
          taxonomyLoading={taxonomyLoading}
          taxonomyError={taxonomyError}
          simplified
          onChange={onChange}
        />

        {error ? (
          <p className="studio-form__error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="studio-form__actions">
          <button
            type="submit"
            className="studio-form__submit"
            disabled={submitting || taxonomyLoading}
          >
            {submitting ? t('submitBusy') : t('submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
