'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  getGuidedSession,
  updateGuidedSessionDraft,
} from '@/lib/api/studioGuidedSessions';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import { guidedSessionStatusLabel } from '@/lib/studio/guidedSessionStatus';
import {
  buildGuidedSessionPatch,
  sessionToEditorForm,
  type GuidedSessionEditorForm,
} from '@/lib/studio/guidedSessionEditorForm';
import GuidedSessionFormFields from '@/components/studio/GuidedSessionFormFields';

type Props = {
  sessionId: number;
};

type SaveState = 'idle' | 'saving' | 'saved' | 'error';

const AUTOSAVE_MS = 700;

export default function GuidedSessionEditor({ sessionId }: Props) {
  const { getIdToken } = useAuth();
  const [form, setForm] = useState<GuidedSessionEditorForm | null>(null);
  const [baseline, setBaseline] = useState<GuidedSessionEditorForm | null>(null);
  const baselineRef = useRef<GuidedSessionEditorForm | null>(null);
  const [status, setStatus] = useState<string>('draft');
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  const isEditable = status === 'draft';

  useEffect(() => {
    baselineRef.current = baseline;
  }, [baseline]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setLoadError(null);
      setIsReady(false);
      setSaveState('idle');
      setSaveError(null);

      try {
        const token = await getIdToken();
        const data = await getGuidedSession(sessionId, token);
        if (cancelled) return;

        const initial = sessionToEditorForm(data);
        setStatus(data.status);
        setForm(initial);
        setBaseline(initial);
        baselineRef.current = initial;
        setIsReady(true);
      } catch (err) {
        if (!cancelled) {
          setLoadError(parseStudioApiError(err));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [sessionId, getIdToken]);

  const onFieldChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => (prev ? { ...prev, [name]: value } : prev));
      setSaveError(null);
      if (saveState === 'saved' || saveState === 'error') {
        setSaveState('idle');
      }
    },
    [saveState],
  );

  useEffect(() => {
    if (!isReady || !isEditable || !form || !baseline) return;

    const patch = buildGuidedSessionPatch(form, baseline);
    if (Object.keys(patch).length === 0) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const currentBaseline = baselineRef.current;
      if (!currentBaseline) return;

      const pendingPatch = buildGuidedSessionPatch(form, currentBaseline);
      if (Object.keys(pendingPatch).length === 0) return;

      setSaveState('saving');
      setSaveError(null);

      try {
        const token = await getIdToken();
        const updated = await updateGuidedSessionDraft(sessionId, pendingPatch, token);
        const nextBaseline = sessionToEditorForm(updated);
        baselineRef.current = nextBaseline;
        setBaseline(nextBaseline);
        setStatus(updated.status);
        setSaveState('saved');
      } catch (err) {
        if (err instanceof StudioApiError && (err.status === 403 || err.status === 404)) {
          setSaveError('You do not have access to edit this session.');
        } else {
          setSaveError(parseStudioApiError(err));
        }
        setSaveState('error');
      }
    }, AUTOSAVE_MS);

    return () => window.clearTimeout(timer);
  }, [form, baseline, isReady, isEditable, sessionId, getIdToken]);

  const saveStatusLabel = (() => {
    if (!isEditable) return null;
    if (saveState === 'saving') return 'Saving…';
    if (saveState === 'saved') return 'Saved';
    if (saveState === 'error') return 'Error saving';
    return null;
  })();

  return (
    <div className="studio-form-page">
      <Link href="/studio?tab=sessions" className="studio-form-page__back">
        ← Back to Studio
      </Link>

      {loading ? (
        <p className="studio-form-page__status" role="status">
          Loading session…
        </p>
      ) : null}

      {loadError ? (
        <p className="studio-form__error" role="alert">
          {loadError}
        </p>
      ) : null}

      {form && !loadError ? (
        <>
          <header className="studio-form-page__header studio-form-page__header--split">
            <div>
              <h1 className="studio-form-page__title">Edit guided session</h1>
              <p className="studio-form-page__lede">
                {isEditable
                  ? 'Changes are saved automatically.'
                  : 'Published and archived sessions are read-only in Studio V1.'}
              </p>
            </div>
            <div className="studio-form-page__header-meta">
              <span
                className={`studio-editor__status-badge studio-editor__status-badge--${status}`}
              >
                {guidedSessionStatusLabel(status)}
              </span>
              {saveStatusLabel ? (
                <span
                  className={`studio-editor__save-status studio-editor__save-status--${saveState}`}
                  role="status"
                  aria-live="polite"
                >
                  {saveStatusLabel}
                </span>
              ) : null}
            </div>
          </header>

          {saveError ? (
            <p className="studio-form__error" role="alert">
              {saveError}
            </p>
          ) : null}

          <GuidedSessionFormFields
            form={form}
            disabled={!isEditable}
            onChange={onFieldChange}
          />
        </>
      ) : null}
    </div>
  );
}
