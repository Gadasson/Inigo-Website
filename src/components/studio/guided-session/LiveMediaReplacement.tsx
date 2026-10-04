'use client';

import { useRef, useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { StudioApiError } from '@/lib/api/studioApiClient';
import {
  discardGuidedSessionMediaReplacement,
  getGuidedSession,
  retryGuidedSessionMediaReplacement,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { formatDurationClock } from '@/lib/studio/formatDuration';
import {
  GUIDED_SESSION_MEDIA_SLOTS,
  guidedSessionCanonicalVideoUrl,
  guidedSessionMediaUrl,
  validateGuidedSessionMediaFile,
} from '@/lib/studio/guidedSessionMedia';
import type { OnGuidedSessionMediaUpdated } from '@/lib/studio/guidedSessionMediaTypes';
import { uploadLiveMediaReplacement } from '@/lib/studio/liveMediaReplacementUpload';
import {
  canContinueReservedUpload,
  canDiscardReplacement,
  canRetryFailedReplacement,
  canStartNewReplacement,
  creatorSafeReplacementError,
  livePrimaryMediaType,
  ReplacementFlowError,
  replacementActivity,
  replacementConflictAction,
  type ReplacementActivity,
} from '@/lib/studio/mediaReplacement';
import { getStudioApiErrorCode, parseStudioApiError } from '@/lib/studio/parseStudioApiError';

type Props = {
  session: StudioGuidedSession;
  onSessionUpdated: OnGuidedSessionMediaUpdated;
};

export default function LiveMediaReplacement({ session, onSessionUpdated }: Props) {
  const { getIdToken } = useAuth();
  const t = useTranslations('replacement');
  const tv = useTranslations('mediaValidation');
  const tm = useTranslations('media');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [percent, setPercent] = useState(0);
  const [busy, setBusy] = useState<'retry' | 'discard' | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const mediaType = livePrimaryMediaType(session);
  const replacement = session.media_replacement ?? null;
  const activity = replacementActivity(replacement, mediaType);
  const currentUrl =
    mediaType === 'video'
      ? guidedSessionCanonicalVideoUrl(session)
      : mediaType === 'audio'
        ? guidedSessionMediaUrl(session, 'audio')
        : null;
  const accept =
    GUIDED_SESSION_MEDIA_SLOTS.find((slot) => slot.role === mediaType)?.accept ?? '';

  if (!mediaType) return null;

  const applySession = (next: StudioGuidedSession) => {
    onSessionUpdated(next);
  };

  const onPickFile = () => {
    setMessage(null);
    fileInputRef.current?.click();
  };

  const onFile = async (file: File | undefined) => {
    if (!file || uploading || busy) return;
    if (fileInputRef.current) fileInputRef.current.value = '';

    const validation = validateGuidedSessionMediaFile(file, mediaType);
    if (validation) {
      setMessage(
        validation.code === 'tooLarge'
          ? tv('tooLarge', { maxMb: validation.maxMb })
          : tv(validation.code),
      );
      return;
    }

    const continuing = canContinueReservedUpload(replacement);
    if (!continuing && !canStartNewReplacement(replacement)) {
      setMessage(t('alreadyOpen'));
      return;
    }

    setUploading(true);
    setPercent(0);
    setMessage(null);
    try {
      const outcome = await uploadLiveMediaReplacement({
        session,
        file,
        mediaType,
        getIdToken,
        onProgress: setPercent,
        onReserved: (reserved) => {
          applySession({ ...session, media_replacement: reserved });
        },
      });
      applySession(outcome.session);
      if (outcome.kind === 'conflict') {
        setMessage(conflictMessage(outcome.code, t));
      }
    } catch (error) {
      if (error instanceof ReplacementFlowError) {
        setMessage(error.code === 'extension_mismatch' ? t('extensionMismatch') : t('generic'));
        return;
      }
      const code = getStudioApiErrorCode(error);
      if (replacementConflictAction(code) === 'validation') {
        setMessage(code === 'media_role_mismatch' ? t('wrongType') : t('validation'));
        return;
      }
      if (error instanceof StudioApiError && (error.status === 401 || error.status === 403)) {
        setMessage(parseStudioApiError(error));
        return;
      }
      setMessage(t('uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const onRetry = async () => {
    if (!replacement?.generation || busy || uploading) return;
    setBusy('retry');
    setMessage(null);
    try {
      const token = await getIdToken();
      const next = await retryGuidedSessionMediaReplacement(
        session.id,
        replacement.generation,
        token,
      );
      applySession({ ...session, media_replacement: next });
    } catch (error) {
      const code = getStudioApiErrorCode(error);
      if (replacementConflictAction(code) === 'refetch') {
        try {
          const token = await getIdToken();
          applySession(await getGuidedSession(session.id, token));
        } catch {
          /* keep the previous session */
        }
        setMessage(conflictMessage(code, t));
      } else {
        setMessage(t('generic'));
      }
    } finally {
      setBusy(null);
    }
  };

  const onDiscard = async () => {
    if (!replacement?.generation || busy || uploading) return;
    setBusy('discard');
    setMessage(null);
    try {
      const token = await getIdToken();
      await discardGuidedSessionMediaReplacement(session.id, replacement.generation, token);
      applySession(await getGuidedSession(session.id, token));
      setConfirmDiscard(false);
    } catch (error) {
      const code = getStudioApiErrorCode(error);
      if (replacementConflictAction(code) === 'refetch') {
        try {
          const token = await getIdToken();
          applySession(await getGuidedSession(session.id, token));
        } catch {
          /* keep the previous session */
        }
        setMessage(conflictMessage(code, t));
      } else {
        setMessage(t('generic'));
      }
    } finally {
      setBusy(null);
    }
  };

  const displayActivity: ReplacementActivity | 'uploading' = uploading ? 'uploading' : activity;
  const safeFailure = creatorSafeReplacementError(replacement?.error);
  const duration =
    replacement?.proposed_duration_seconds != null
      ? formatDurationClock(replacement.proposed_duration_seconds)
      : null;
  const showReplace =
    !uploading &&
    (canStartNewReplacement(replacement) || displayActivity === 'idle');
  const showContinue = !uploading && canContinueReservedUpload(replacement);
  const showRetry = !uploading && canRetryFailedReplacement(replacement, mediaType);
  const showDiscard = !uploading && canDiscardReplacement(replacement);

  return (
    <div className="creator-workspace__replacement">
      <article className="creator-workspace__replacement-current">
        <div className="creator-workspace__replacement-heading">
          <h3>{mediaType === 'video' ? t('currentVideo') : t('currentAudio')}</h3>
          <span className="creator-workspace__replacement-live">{t('liveBadge')}</span>
        </div>
        {currentUrl && mediaType === 'video' ? (
          <video className="creator-workspace__media-video" controls preload="metadata" src={currentUrl} />
        ) : null}
        {currentUrl && mediaType === 'audio' ? (
          <audio className="creator-workspace__media-audio" controls preload="metadata" src={currentUrl}>
            {tm('audioUnsupported')}
          </audio>
        ) : null}
      </article>

      <div className="creator-workspace__replacement-proposal" role="status">
        {displayActivity === 'uploading' ? (
          <p className="creator-workspace__media-status creator-workspace__media-status--uploading">
            {t('uploading', { percent })}
          </p>
        ) : null}
        {displayActivity === 'awaiting_upload' ? (
          <p className="creator-workspace__media-status">{t('readyToUpload')}</p>
        ) : null}
        {displayActivity === 'preparing' ? (
          <p className="creator-workspace__media-status creator-workspace__media-status--optimizing">
            {t('preparingVideo')}
          </p>
        ) : null}
        {displayActivity === 'optimizing' ? (
          <p className="creator-workspace__media-status creator-workspace__media-status--optimizing">
            {t('optimizingVideo')}
          </p>
        ) : null}
        {displayActivity === 'awaiting_review' ? (
          <>
            <p className="creator-workspace__replacement-title">
              {mediaType === 'video' ? t('awaitingReviewVideo') : t('awaitingReviewAudio')}
            </p>
            <p className="creator-workspace__media-optimize-note">{t('awaitingReviewBody')}</p>
            {duration ? (
              <p className="creator-workspace__media-optimize-note">
                {t('proposedDuration', { duration })}
              </p>
            ) : null}
          </>
        ) : null}
        {displayActivity === 'failed' ? (
          <>
            <p className="creator-workspace__replacement-title">{t('failedTitle')}</p>
            {safeFailure ? (
              <p className="creator-workspace__media-optimize-note">{safeFailure}</p>
            ) : null}
          </>
        ) : null}
        {displayActivity === 'rejected' ? (
          <>
            <p className="creator-workspace__replacement-title">{t('rejectedTitle')}</p>
            {replacement?.rejection_reason ? (
              <p className="creator-workspace__media-optimize-note">
                {t('rejectedReason', { reason: replacement.rejection_reason })}
              </p>
            ) : null}
            <p className="creator-workspace__media-optimize-note">{t('rejectedBody')}</p>
          </>
        ) : null}
        {displayActivity === 'cancelled' ? (
          <>
            <p className="creator-workspace__replacement-title">{t('cancelledTitle')}</p>
            <p className="creator-workspace__media-optimize-note">{t('cancelledBody')}</p>
          </>
        ) : null}
        {displayActivity === 'promoted' ? (
          <p className="creator-workspace__media-status creator-workspace__media-status--attached">
            {t('promoted')}
          </p>
        ) : null}

        {message ? (
          <p className="studio-form__error" role="alert">
            {message}
          </p>
        ) : null}

        <div className="creator-workspace__media-recovery">
          {showContinue ? (
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--primary"
              onClick={onPickFile}
              disabled={uploading || busy != null}
            >
              {t('continueUpload')}
            </button>
          ) : null}
          {showReplace ? (
            <button
              type="button"
              className={`creator-workspace__media-btn${
                showRetry
                  ? ' creator-workspace__media-btn--ghost'
                  : ' creator-workspace__media-btn--primary'
              }`}
              onClick={onPickFile}
              disabled={uploading || busy != null}
            >
              {mediaType === 'video' ? t('replaceVideo') : t('replaceAudio')}
            </button>
          ) : null}
          {showRetry ? (
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--primary"
              onClick={() => void onRetry()}
              disabled={busy != null}
            >
              {busy === 'retry' ? t('retrying') : t('retry')}
            </button>
          ) : null}
          {showDiscard && !confirmDiscard ? (
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
              onClick={() => setConfirmDiscard(true)}
              disabled={busy != null}
            >
              {t('discard')}
            </button>
          ) : null}
        </div>

        {confirmDiscard ? (
          <div className="creator-workspace__replacement-confirm">
            <p>{t('discardConfirm')}</p>
            <p className="creator-workspace__media-optimize-note">{t('discardNote')}</p>
            <div className="creator-workspace__media-recovery">
              <button
                type="button"
                className="creator-workspace__media-btn"
                onClick={() => void onDiscard()}
                disabled={busy != null}
              >
                {busy === 'discard' ? t('discarding') : t('discard')}
              </button>
              <button
                type="button"
                className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
                onClick={() => setConfirmDiscard(false)}
                disabled={busy != null}
              >
                {t('keep')}
              </button>
            </div>
          </div>
        ) : null}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(event) => {
            void onFile(event.target.files?.[0]);
          }}
        />
      </div>
    </div>
  );
}

function conflictMessage(
  code: string | null,
  t: (key: 'alreadyOpen' | 'stale' | 'invalidState' | 'generic') => string,
): string {
  if (code === 'replacement_already_open') return t('alreadyOpen');
  if (code === 'stale_generation') return t('stale');
  if (code === 'invalid_state') return t('invalidState');
  return t('generic');
}
