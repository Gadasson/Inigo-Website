'use client';

import { useRef, useState } from 'react';
import {
  type GuidedSessionMediaSlotConfig,
  guidedSessionMediaFileName,
  guidedSessionMediaUrl,
  validateGuidedSessionMediaFile,
} from '@/lib/studio/guidedSessionMedia';
import {
  formatMediaUploadError,
  getPendingMediaAttach,
  MediaUploadError,
} from '@/lib/studio/guidedSessionMediaErrors';
import type {
  OnGuidedSessionMediaUpdated,
  PendingMediaAttach,
} from '@/lib/studio/guidedSessionMediaTypes';
import type { MediaUploadResult } from '@/lib/studio/guidedSessionMediaUpload';
import { isFirebaseStorageConfigured } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';

type Props = {
  slot: GuidedSessionMediaSlotConfig;
  session: StudioGuidedSession;
  disabled: boolean;
  onSessionUpdated: OnGuidedSessionMediaUpdated;
};

type SlotPhase = 'idle' | 'uploading' | 'attach_pending' | 'retrying_attach' | 'error';

function applyMediaUploadResult(
  result: MediaUploadResult,
  onSessionUpdated: OnGuidedSessionMediaUpdated,
) {
  if (result.durationDetected) {
    onSessionUpdated(result.session, { durationDetected: result.durationDetected });
  } else {
    onSessionUpdated(result.session);
  }
}

export default function GuidedSessionMediaSlot({
  slot,
  session,
  disabled,
  onSessionUpdated,
}: Props) {
  const { getIdToken } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [phase, setPhase] = useState<SlotPhase>('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingAttach, setPendingAttach] = useState<PendingMediaAttach | null>(null);

  const attachedUrl = guidedSessionMediaUrl(session, slot.role);
  const attachedName = guidedSessionMediaFileName(session, slot.role);
  const isAttached = Boolean(attachedUrl);
  const hasPendingAttach = pendingAttach !== null;

  const displayFileName =
    (isAttached && attachedName) ||
    pendingAttach?.originalFileName ||
    null;

  const statusLabel = (() => {
    if (phase === 'uploading') {
      return `Uploading… ${uploadPercent}%`;
    }
    if (phase === 'retrying_attach') {
      return 'Retrying attach…';
    }
    if (phase === 'attach_pending') {
      return 'Attach failed';
    }
    if (phase === 'error') {
      return 'Upload failed';
    }
    if (isAttached) {
      return '✓ Uploaded';
    }
    return 'Not added yet';
  })();

  const buttonLabel = (() => {
    if (phase === 'uploading') {
      return `Uploading… ${uploadPercent}%`;
    }
    if (phase === 'retrying_attach') {
      return 'Retrying attach…';
    }
    return isAttached || hasPendingAttach ? 'Replace' : 'Choose file';
  })();

  const clearPendingAttach = () => {
    setPendingAttach(null);
  };

  const onChooseFile = () => {
    inputRef.current?.click();
  };

  const onDiscardPending = () => {
    clearPendingAttach();
    setPhase('idle');
    setError(null);
    setUploadPercent(0);
  };

  const onRetryAttach = async () => {
    if (!pendingAttach || disabled) return;

    setPhase('retrying_attach');
    setError(null);

    try {
      const { retryAttachGuidedSessionMedia } = await import('@/lib/studio/guidedSessionMediaUpload');
      const result = await retryAttachGuidedSessionMedia({
        pendingAttach,
        getIdToken,
      });

      applyMediaUploadResult(result, onSessionUpdated);
      clearPendingAttach();
      setPhase('idle');
      setUploadPercent(0);
    } catch (err) {
      const nextPending = getPendingMediaAttach(err) ?? pendingAttach;
      setPendingAttach(nextPending);
      setPhase('attach_pending');
      setError(formatMediaUploadError(err));
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || disabled) return;

    clearPendingAttach();

    const validationError = validateGuidedSessionMediaFile(file, slot.role);
    if (validationError) {
      setPhase('idle');
      setError(validationError);
      setUploadPercent(0);
      return;
    }

    if (!isFirebaseStorageConfigured()) {
      setPhase('idle');
      setError(formatMediaUploadError(new MediaUploadError('config', '', null)));
      setUploadPercent(0);
      return;
    }

    setPhase('uploading');
    setUploadPercent(0);
    setError(null);

    try {
      const { uploadGuidedSessionMedia } = await import('@/lib/studio/guidedSessionMediaUpload');
      const result = await uploadGuidedSessionMedia({
        session,
        role: slot.role,
        file,
        getIdToken,
        onProgress: ({ percent }) => {
          setUploadPercent(percent);
        },
      });

      applyMediaUploadResult(result, onSessionUpdated);
      clearPendingAttach();
      setPhase('idle');
      setUploadPercent(0);
    } catch (err) {
      const nextPending = getPendingMediaAttach(err);
      if (nextPending) {
        setPendingAttach(nextPending);
        setPhase('attach_pending');
      } else {
        setPhase('error');
      }
      setUploadPercent(0);
      setError(formatMediaUploadError(err));
    }
  };

  const isBusy = phase === 'uploading' || phase === 'retrying_attach';
  const slotModifier =
    phase === 'attach_pending'
      ? 'attach-pending'
      : phase === 'retrying_attach'
        ? 'uploading'
        : phase;

  return (
    <li
      className={`creator-workspace__media-slot${
        isAttached ? ' creator-workspace__media-slot--attached' : ''
      }${slotModifier !== 'idle' ? ` creator-workspace__media-slot--${slotModifier}` : ''}`}
    >
      <div className="creator-workspace__media-slot-main">
        <div className="creator-workspace__media-slot-heading">
          <span className="creator-workspace__slot-label">{slot.label}</span>
          <span
            className={`creator-workspace__media-status creator-workspace__media-status--${
              phase === 'idle' && isAttached ? 'attached' : slotModifier
            }`}
            role="status"
          >
            {statusLabel}
          </span>
        </div>

        <p className="creator-workspace__media-format-guide">
          <span>{slot.formatGuidance.formats}</span>
          <span>{slot.formatGuidance.maxSize}</span>
        </p>

        {displayFileName ? (
          <p className="creator-workspace__media-filename">{displayFileName}</p>
        ) : (
          <p className="creator-workspace__media-hint">{slot.emptyHint}</p>
        )}

        {slot.role === 'thumbnail' && attachedUrl ? (
          // Firebase download URLs are dynamic user uploads — next/image not used here.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={attachedUrl}
            alt=""
            className="creator-workspace__media-thumb"
          />
        ) : null}

        {slot.role === 'audio' && attachedUrl ? (
          <audio
            className="creator-workspace__media-audio"
            controls
            preload="metadata"
            src={attachedUrl}
          >
            Your browser does not support audio playback.
          </audio>
        ) : null}

        {error ? (
          <p className="creator-workspace__media-error" role="alert">
            {error}
          </p>
        ) : null}

        {hasPendingAttach ? (
          <div className="creator-workspace__media-recovery">
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--primary"
              disabled={disabled || isBusy}
              onClick={() => void onRetryAttach()}
            >
              Retry attach
            </button>
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
              disabled={disabled || isBusy}
              onClick={onDiscardPending}
            >
              Discard uploaded file
            </button>
          </div>
        ) : null}
      </div>

      <div className="creator-workspace__media-slot-actions">
        <input
          ref={inputRef}
          type="file"
          accept={slot.accept}
          className="creator-workspace__media-input"
          disabled={disabled || isBusy}
          onChange={onFileChange}
        />
        <button
          type="button"
          className="creator-workspace__media-btn"
          disabled={disabled || isBusy}
          onClick={onChooseFile}
        >
          {buttonLabel}
        </button>
      </div>
    </li>
  );
}
