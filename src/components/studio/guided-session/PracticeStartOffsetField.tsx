'use client';

import { useEffect, useId, useRef, useState, type RefObject } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import {
  updateGuidedSessionDraft,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import type { OnGuidedSessionMediaUpdated } from '@/lib/studio/guidedSessionMediaTypes';
import {
  formatPracticeStartMmInput,
  formatPracticeStartSsInput,
  isPracticeStartMmSsEmpty,
  isValidPracticeStartSeconds,
  padPracticeStartMm,
  padPracticeStartSs,
  parseSessionDurationSeconds,
  practiceStartMmSsToSeconds,
  practiceStartSecondsFromPlayer,
  practiceStartSecondsToMmSsParts,
  practiceStartServerField,
  type PracticeStartMediaKind,
} from '@/lib/studio/practiceStartOffset';

type Props = {
  session: StudioGuidedSession;
  mediaKind: PracticeStartMediaKind;
  mediaRef: RefObject<HTMLMediaElement | null>;
  disabled?: boolean;
  onSessionUpdated: OnGuidedSessionMediaUpdated;
};

export default function PracticeStartOffsetField({
  session,
  mediaKind,
  mediaRef,
  disabled = false,
  onSessionUpdated,
}: Props) {
  const { getIdToken } = useAuth();
  const t = useTranslations('media');
  const fieldId = useId();
  const serverField = practiceStartServerField(mediaKind);
  const savedSeconds = session[serverField] ?? null;
  const [mm, setMm] = useState(() => practiceStartSecondsToMmSsParts(savedSeconds).mm);
  const [ss, setSs] = useState(() => practiceStartSecondsToMmSsParts(savedSeconds).ss);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const latestPartsRef = useRef({ mm, ss });
  latestPartsRef.current = { mm, ss };

  useEffect(() => {
    const parts = practiceStartSecondsToMmSsParts(savedSeconds);
    setMm(parts.mm);
    setSs(parts.ss);
    setError(null);
  }, [savedSeconds, session.id, serverField]);

  const durationSeconds = parseSessionDurationSeconds(session.duration);

  const persist = async (nextSeconds: number | null) => {
    if (disabled || saving) return;
    if ((session[serverField] ?? null) === nextSeconds) {
      const parts = practiceStartSecondsToMmSsParts(nextSeconds);
      setMm(parts.mm);
      setSs(parts.ss);
      setError(null);
      return;
    }
    if (!isValidPracticeStartSeconds(nextSeconds, durationSeconds)) {
      setError(t('practiceStartInvalid'));
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = await getIdToken();
      const updated = await updateGuidedSessionDraft(
        session.id,
        { [serverField]: nextSeconds },
        token,
      );
      onSessionUpdated(updated);
      const parts = practiceStartSecondsToMmSsParts(updated[serverField] ?? null);
      setMm(parts.mm);
      setSs(parts.ss);
    } catch (err) {
      setError(parseStudioApiError(err));
    } finally {
      setSaving(false);
    }
  };

  const commitDraft = () => {
    const { mm: nextMm, ss: nextSs } = latestPartsRef.current;
    const paddedMm = padPracticeStartMm(nextMm);
    const paddedSs = padPracticeStartSs(nextSs);
    if (isPracticeStartMmSsEmpty(paddedMm, paddedSs)) {
      setMm('');
      setSs('');
      void persist(null);
      return;
    }
    setMm(paddedMm);
    setSs(paddedSs);
    void persist(practiceStartMmSsToSeconds(paddedMm, paddedSs));
  };

  const onClear = () => {
    setMm('');
    setSs('');
    setError(null);
    void persist(null);
  };

  const onSetFromPlayer = () => {
    const seconds = practiceStartSecondsFromPlayer(mediaRef.current);
    if (seconds == null) {
      setError(t('practiceStartNoPlayer'));
      return;
    }
    if (!isValidPracticeStartSeconds(seconds, durationSeconds)) {
      setError(t('practiceStartInvalid'));
      return;
    }
    const parts = practiceStartSecondsToMmSsParts(seconds);
    setMm(parts.mm);
    setSs(parts.ss);
    void persist(seconds);
  };

  const hasValue = !isPracticeStartMmSsEmpty(mm, ss);
  const mmInputId = `${fieldId}-mm`;
  const ssInputId = `${fieldId}-ss`;

  if (disabled && !hasValue && savedSeconds == null) {
    return null;
  }

  return (
    <div className="creator-workspace__practice-start">
      <div className="creator-workspace__practice-start-row">
        <label className="creator-workspace__practice-start-label" htmlFor={mmInputId}>
          {t('practiceStartLabel')}
        </label>
        <div
          className="creator-workspace__practice-start-input"
          role="group"
          aria-label={t('practiceStartLabel')}
        >
          <input
            id={mmInputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="creator-workspace__practice-start-part"
            value={mm}
            placeholder="0"
            disabled={disabled || saving}
            onChange={(event) => {
              setMm(formatPracticeStartMmInput(event.target.value));
              setError(null);
            }}
            onBlur={commitDraft}
            aria-label={t('practiceStartMinutesAria')}
          />
          <span className="creator-workspace__practice-start-sep" aria-hidden>
            :
          </span>
          <input
            id={ssInputId}
            type="text"
            inputMode="numeric"
            autoComplete="off"
            className="creator-workspace__practice-start-part"
            value={ss}
            placeholder="00"
            disabled={disabled || saving}
            onChange={(event) => {
              setSs(formatPracticeStartSsInput(event.target.value));
              setError(null);
            }}
            onBlur={commitDraft}
            aria-label={t('practiceStartSecondsAria')}
          />
        </div>
      </div>

      <p className="creator-workspace__practice-start-helper">{t('practiceStartHelper')}</p>

      {!disabled ? (
        <div className="creator-workspace__practice-start-actions">
          <button
            type="button"
            className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
            disabled={saving}
            onClick={onSetFromPlayer}
          >
            {t('practiceStartFromPlayer')}
          </button>
          <button
            type="button"
            className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
            disabled={saving || (!hasValue && savedSeconds == null)}
            onClick={onClear}
          >
            {t('practiceStartClear')}
          </button>
          {saving ? (
            <span className="creator-workspace__practice-start-status" role="status">
              {t('practiceStartSaving')}
            </span>
          ) : null}
        </div>
      ) : null}

      {error ? (
        <p className="creator-workspace__media-error" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
