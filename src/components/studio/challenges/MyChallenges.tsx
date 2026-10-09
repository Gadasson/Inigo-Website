'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioAccess } from '@/contexts/StudioAccessContext';
import { CHALLENGES_CAPABILITY } from '@/lib/api/studioBootstrap';
import { listStudioChallenges, parseChallengeApiFailure, type StudioChallengeSummary } from '@/lib/api/studioChallenges';
import { challengeListTitle } from '@/lib/studio/challengeEditor';
import { shouldLoadStudioArea } from '@/lib/studio/studioAreas';

type Props = {
  active?: boolean;
  embedded?: boolean;
};

function listStatusKey(row: StudioChallengeSummary): 'draft' | 'pending_review' | 'approved' | 'archived' {
  if (row.archived_at) return 'archived';
  if (row.status === 'pending_review' || row.status === 'approved' || row.status === 'draft') return row.status;
  return 'draft';
}

export default function MyChallenges({ active = true, embedded = false }: Props) {
  const { user, getIdToken } = useAuth();
  const { status, enabled, capabilities } = useStudioAccess();
  const allowed =
    status.state === 'connected' &&
    shouldLoadStudioArea(CHALLENGES_CAPABILITY, { enabled, capabilities });
  const allowedRef = useRef(allowed);
  allowedRef.current = allowed;
  const t = useTranslations('challenges');
  const locale = useLocale() === 'he' ? 'he' : 'en';
  const [rows, setRows] = useState<StudioChallengeSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!user || !allowedRef.current) return;
    setLoading(true);
    setError(null);
    try {
      const token = await getIdToken();
      const data = await listStudioChallenges(token);
      if (!allowedRef.current) return;
      setRows(data);
    } catch (err) {
      if (!allowedRef.current) return;
      setError(parseChallengeApiFailure(err).detail);
    } finally {
      if (allowedRef.current) setLoading(false);
    }
  }, [user, getIdToken]);

  useEffect(() => {
    if (!allowed) {
      setRows([]);
      setError(null);
      setLoading(false);
    }
  }, [allowed]);

  useEffect(() => {
    if (!active || !allowed) return;
    void load();
  }, [active, allowed, load]);

  if (!allowed) return null;

  return (
    <section
      className="studio-workspace__library"
      aria-labelledby={embedded ? undefined : 'studio-challenges-heading'}
      aria-label={embedded ? t('listTitle') : undefined}
    >
      <div className="studio-challenge-list__header">
        {embedded ? null : (
          <h1 id="studio-challenges-heading" className="studio-workspace__title">
            {t('listTitle')}
          </h1>
        )}
        <Link href="/studio/challenges/new" className="studio-form__submit studio-challenge-list__create">
          {t('create')}
        </Link>
      </div>
      {embedded ? null : <p className="studio-workspace__lede">{t('listLede')}</p>}

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
      {!loading && !error && rows.length === 0 ? (
        <div className="studio-session-list__empty">
          <p className="studio-session-list__empty-title">{t('emptyTitle')}</p>
          <p className="studio-session-list__empty-text">{t('emptyBody')}</p>
        </div>
      ) : null}
      {!loading && !error && rows.length > 0 ? (
        <ul className="studio-session-list">
          {rows.map((row) => {
            const title = challengeListTitle(row, locale) || t('untitled');
            const statusKey = listStatusKey(row);
            return (
              <li key={row.id}>
                <Link href={`/studio/challenges/${row.id}`} className="studio-session-item">
                  <div className="studio-session-item__main">
                    <h3 className="studio-session-item__title">{title}</h3>
                    <div className="studio-session-item__meta">
                      <span className="studio-session-item__status">{t(`status.${statusKey}`)}</span>
                    </div>
                  </div>
                  <span className="studio-session-item__open" aria-hidden>
                    →
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : null}
    </section>
  );
}
