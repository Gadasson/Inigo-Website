'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import {
  listGuidedSessions,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import { sessionTimestampLabel } from '@/lib/studio/formatSessionDate';
import {
  GUIDED_SESSION_STATUS_FILTERS,
  guidedSessionStatusLabel,
  matchesStatusFilter,
  type GuidedSessionStatusFilter,
} from '@/lib/studio/guidedSessionStatus';

type Props = {
  /** When false, skip fetching until the tab becomes active. */
  active?: boolean;
};

export default function MyGuidedSessions({ active = true }: Props) {
  const { user, getIdToken } = useAuth();
  const [sessions, setSessions] = useState<StudioGuidedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GuidedSessionStatusFilter>('all');

  const loadSessions = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const data = await listGuidedSessions(token);
      setSessions(data);
    } catch (err) {
      setError(parseStudioApiError(err));
    } finally {
      setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (!active || !user) return;
    void loadSessions();
  }, [active, user, loadSessions]);

  const filteredSessions = useMemo(
    () => sessions.filter((session) => matchesStatusFilter(session.status, filter)),
    [sessions, filter],
  );

  const filterCounts = useMemo(() => {
    const counts: Record<GuidedSessionStatusFilter, number> = {
      all: sessions.length,
      draft: 0,
      published: 0,
      archived: 0,
    };

    for (const session of sessions) {
      if (session.status === 'draft') counts.draft += 1;
      if (session.status === 'available') counts.published += 1;
      if (session.status === 'archived') counts.archived += 1;
    }

    return counts;
  }, [sessions]);

  return (
    <section className="studio-workspace__library" aria-labelledby="studio-library-heading">
      <h2 id="studio-library-heading" className="visually-hidden">
        Your guided sessions
      </h2>
      <div className="studio-session-filters" role="tablist" aria-label="Filter sessions">
        {GUIDED_SESSION_STATUS_FILTERS.map((option) => {
          const count = filterCounts[option.id];
          const isActive = filter === option.id;

          return (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`studio-session-filters__btn${
                isActive ? ' studio-session-filters__btn--active' : ''
              }`}
              onClick={() => setFilter(option.id)}
            >
              {option.label}
              {count > 0 ? (
                <span className="studio-session-filters__count">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="studio-session-list__status" role="status">
          Loading your sessions…
        </p>
      ) : null}

      {error ? (
        <p className="studio-form__error" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !error && filteredSessions.length === 0 ? (
        <div className="studio-session-list__empty">
          {sessions.length === 0 ? (
            <>
              <p className="studio-session-list__empty-title">Nothing here yet</p>
              <p className="studio-session-list__empty-text">
                When you create a guided session, it will appear here so you can pick up where
                you left off.
              </p>
            </>
          ) : (
            <>
              <p className="studio-session-list__empty-title">No sessions in this view</p>
              <p className="studio-session-list__empty-text">
                Try another filter, or create something new in the Create tab.
              </p>
            </>
          )}
        </div>
      ) : null}

      {!loading && !error && filteredSessions.length > 0 ? (
        <ul className="studio-session-list">
          {filteredSessions.map((session) => {
            const isDraft = session.status === 'draft';
            const timestamp = sessionTimestampLabel(session);

            return (
              <li key={session.id}>
                <Link
                  href={`/studio/guided-sessions/${session.id}`}
                  className={`studio-session-item${
                    isDraft ? ' studio-session-item--draft' : ''
                  }`}
                >
                  <div className="studio-session-item__main">
                    <h3 className="studio-session-item__title">{session.title}</h3>
                    <div className="studio-session-item__meta">
                      <span
                        className={`studio-session-item__status studio-session-item__status--${session.status}`}
                      >
                        {guidedSessionStatusLabel(session.status)}
                      </span>
                      {timestamp ? (
                        <span className="studio-session-item__date">{timestamp}</span>
                      ) : null}
                    </div>
                  </div>
                  {isDraft ? (
                    <span className="studio-session-item__continue">
                      Continue
                      <span className="studio-card__cta-arrow" aria-hidden>
                        →
                      </span>
                    </span>
                  ) : (
                    <span className="studio-session-item__open" aria-hidden>
                      →
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
