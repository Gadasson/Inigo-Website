'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import {
  listChallengeSessionOptions,
  parseChallengeApiFailure,
  type ChallengeSessionOption,
} from '@/lib/api/studioChallenges';
import { formatDurationClock } from '@/lib/studio/formatDuration';
import type { SessionOptionOwner } from '@/lib/studio/challengeEditor';

type Props = {
  disabled?: boolean;
  onSelect: (option: ChallengeSessionOption) => void;
};

const OWNERS: SessionOptionOwner[] = ['', 'self', 'platform', 'other_guide'];

export default function ChallengeSessionPicker({ disabled = false, onSelect }: Props) {
  const { getIdToken } = useAuth();
  const t = useTranslations('challenges');
  const [query, setQuery] = useState('');
  const [ownerKind, setOwnerKind] = useState<SessionOptionOwner>('');
  const [results, setResults] = useState<ChallengeSessionOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (disabled) return;
    let cancelled = false;
    const timer = window.setTimeout(() => {
      void (async () => {
        setLoading(true);
        setError(null);
        try {
          const token = await getIdToken();
          const rows = await listChallengeSessionOptions({ q: query, ownerKind }, token);
          if (!cancelled) setResults(rows);
        } catch (err) {
          if (!cancelled) setError(parseChallengeApiFailure(err).detail);
        } finally {
          if (!cancelled) setLoading(false);
        }
      })();
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [query, ownerKind, disabled, getIdToken]);

  return (
    <div className="studio-challenge-picker">
      <label className="studio-form__field">
        <span>{t('searchSessions')}</span>
        <input
          type="search"
          value={query}
          disabled={disabled}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <label className="studio-form__field">
        <span>{t('ownerFilter')}</span>
        <select
          value={ownerKind}
          disabled={disabled}
          onChange={(event) => setOwnerKind(event.target.value as SessionOptionOwner)}
        >
          {OWNERS.map((owner) => (
            <option key={owner || 'all'} value={owner}>
              {t(`owner.${owner || 'all'}`)}
            </option>
          ))}
        </select>
      </label>
      {loading ? <p className="studio-session-list__status">{t('searching')}</p> : null}
      {error ? (
        <p className="studio-form__error" role="alert">
          {error}
        </p>
      ) : null}
      <ul className="studio-session-list">
        {results.map((option) => (
          <li key={option.id}>
            <button
              type="button"
              className="studio-session-item studio-challenge-picker__option"
              disabled={disabled}
              onClick={() => onSelect(option)}
            >
              <span className="studio-session-item__title">{option.title}</span>
              <span className="studio-session-item__meta">
                {option.duration_seconds != null ? formatDurationClock(option.duration_seconds) : t('durationUnknown')}
                {' · '}
                {t(`media.${option.media_kind === 'audio' || option.media_kind === 'video' ? option.media_kind : 'unknown'}`)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
