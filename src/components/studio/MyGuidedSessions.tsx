'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioAccess } from '@/contexts/StudioAccessContext';
import { GUIDED_SESSIONS_CAPABILITY } from '@/lib/api/studioBootstrap';
import { shouldLoadStudioArea } from '@/lib/studio/studioAreas';
import {
  listGuidedSessions,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import { formatSessionDate } from '@/lib/studio/formatSessionDate';
import { studioSessionPhase } from '@/lib/studio/guidedSessionPhase';
import {
  GUIDED_SESSION_STATUS_FILTERS,
  matchesStatusFilter,
  type GuidedSessionStatusFilter,
} from '@/lib/studio/guidedSessionStatus';

type Props = {
  /** When false, skip fetching until the tab becomes active. */
  active?: boolean;
};

const FILTER_LABEL_KEYS: Record<GuidedSessionStatusFilter, string> = {
  all: 'filterAll',
  draft: 'filterDrafts',
  published: 'filterPublished',
  archived: 'filterArchived',
};

const STATUS_PHASE_KEYS = {
  draft: 'statusDraft',
  awaiting_approval: 'statusAwaitingApproval',
  live: 'statusLive',
  archived: 'statusArchived',
} as const;

export default function MyGuidedSessions({ active = true }: Props) {
  const { user, getIdToken } = useAuth();
  const { status, enabled, capabilities } = useStudioAccess();
  const canLoadSessions =
    status.state === 'connected' &&
    shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, { enabled, capabilities });
  const canLoadRef = useRef(canLoadSessions);
  canLoadRef.current = canLoadSessions;
  const locale = useLocale();
  const t = useTranslations('sessions');
  const statusLabel = (session: StudioGuidedSession): string => {
    const phase = studioSessionPhase(session);
    if (phase === 'unknown') return session.status;
    return t(STATUS_PHASE_KEYS[phase]);
  };
  const [sessions, setSessions] = useState<StudioGuidedSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<GuidedSessionStatusFilter>('all');

  const loadSessions = useCallback(async () => {
    if (!user || !canLoadRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const token = await getIdToken();
      const data = await listGuidedSessions(token);
      if (!canLoadRef.current) return;
      setSessions(data);
    } catch (err) {
      if (!canLoadRef.current) return;
      setError(parseStudioApiError(err));
    } finally {
      if (canLoadRef.current) setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (canLoadSessions) return;
    setSessions([]);
    setError(null);
    setLoading(false);
  }, [canLoadSessions]);

  useEffect(() => {
    if (!active || !user || !canLoadSessions) return;
    void loadSessions();
  }, [active, user, canLoadSessions, loadSessions]);

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

  if (!canLoadSessions) return null;

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
              {t(FILTER_LABEL_KEYS[option.id])}
              {count > 0 ? (
                <span className="studio-session-filters__count">{count}</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {loading ? (
        <p className="studio-session-list__status" role="status">
          {t('loading')}
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
              <p className="studio-session-list__empty-title">{t('emptyTitle')}</p>
              <p className="studio-session-list__empty-text">{t('emptyText')}</p>
            </>
          ) : (
            <>
              <p className="studio-session-list__empty-title">{t('emptyFilteredTitle')}</p>
              <p className="studio-session-list__empty-text">{t('emptyFilteredText')}</p>
            </>
          )}
        </div>
      ) : null}

      {!loading && !error && filteredSessions.length > 0 ? (
        <ul className="studio-session-list">
          {filteredSessions.map((session) => {
            const phase = studioSessionPhase(session);
            const isDraft = phase === 'draft';
            const formatted = formatSessionDate(session.updated_at ?? session.created_at, locale);
            const timestamp = formatted
              ? session.updated_at
                ? t('updated', { date: formatted })
                : t('created', { date: formatted })
              : null;

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
                        className={`studio-session-item__status studio-session-item__status--${
                          phase === 'unknown' ? session.status : phase.replace('_', '-')
                        }`}
                      >
                        {statusLabel(session)}
                      </span>
                      {timestamp ? (
                        <span className="studio-session-item__date">{timestamp}</span>
                      ) : null}
                    </div>
                  </div>
                  {isDraft ? (
                    <span className="studio-session-item__continue">
                      {t('continue')}
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
