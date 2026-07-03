'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { getGuidedSession, type StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';

type Props = {
  sessionId: number;
};

export default function GuidedSessionDraftView({ sessionId }: Props) {
  const { getIdToken } = useAuth();
  const [draft, setDraft] = useState<StudioGuidedSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      try {
        const token = await getIdToken();
        const data = await getGuidedSession(sessionId, token);
        if (!cancelled) {
          setDraft(data);
        }
      } catch (err) {
        if (!cancelled) {
          setError(parseStudioApiError(err));
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

  return (
    <div className="studio-form-page">
      <Link href="/studio" className="studio-form-page__back">
        ← Back to Studio
      </Link>

      {loading ? (
        <p className="studio-form-page__status" role="status">
          Loading draft…
        </p>
      ) : null}

      {error ? (
        <p className="studio-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {draft && !error ? (
        <article className="studio-draft">
          <header className="studio-draft__header">
            <p className="studio-draft__label">Guided session</p>
            <h1 className="studio-draft__title">{draft.title}</h1>
            <p className="studio-draft__status">
              Status: <span>{draft.status}</span>
            </p>
          </header>

          {draft.description ? (
            <p className="studio-draft__description">{draft.description}</p>
          ) : null}

          <p className="studio-draft__next">Editor coming next.</p>
        </article>
      ) : null}
    </div>
  );
}
