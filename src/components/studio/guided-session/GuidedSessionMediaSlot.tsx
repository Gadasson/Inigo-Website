'use client';

import { useRef, useState } from 'react';
import {
  type GuidedSessionMediaSlotConfig,
  guidedSessionMediaFileName,
  guidedSessionMediaUrl,
  validateGuidedSessionMediaFile,
} from '@/lib/studio/guidedSessionMedia';
import { formatMediaUploadError, MediaUploadError } from '@/lib/studio/guidedSessionMediaErrors';
import { uploadGuidedSessionMedia } from '@/lib/studio/guidedSessionMediaUpload';
import { isFirebaseStorageConfigured } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';

type Props = {
  slot: GuidedSessionMediaSlotConfig;
  session: StudioGuidedSession;
  disabled: boolean;
  onSessionUpdated: (session: StudioGuidedSession) => void;
};

type SlotPhase = 'idle' | 'uploading' | 'error';

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

  const attachedUrl = guidedSessionMediaUrl(session, slot.role);
  const attachedName = guidedSessionMediaFileName(session, slot.role);
  const isAttached = Boolean(attachedUrl);

  const statusLabel = (() => {
    if (phase === 'uploading') {
      return `Uploading… ${uploadPercent}%`;
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
    return isAttached ? 'Replace' : 'Choose file';
  })();

  const onChooseFile = () => {
    inputRef.current?.click();
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || disabled) return;

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
      const { session: updated } = await uploadGuidedSessionMedia({
        session,
        role: slot.role,
        file,
        getIdToken,
        onProgress: ({ percent }) => {
          setUploadPercent(percent);
        },
      });

      onSessionUpdated(updated);
      setPhase('idle');
      setUploadPercent(0);
    } catch (err) {
      setPhase('error');
      setUploadPercent(0);
      setError(formatMediaUploadError(err));
    }
  };

  return (
    <li
      className={`creator-workspace__media-slot${
        isAttached ? ' creator-workspace__media-slot--attached' : ''
      }${phase === 'uploading' ? ' creator-workspace__media-slot--uploading' : ''}${
        phase === 'error' ? ' creator-workspace__media-slot--error' : ''
      }`}
    >
      <div className="creator-workspace__media-slot-main">
        <div className="creator-workspace__media-slot-heading">
          <span className="creator-workspace__slot-label">{slot.label}</span>
          <span
            className={`creator-workspace__media-status creator-workspace__media-status--${
              phase === 'idle' && isAttached ? 'attached' : phase
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

        {isAttached && attachedName ? (
          <p className="creator-workspace__media-filename">{attachedName}</p>
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
      </div>

      <div className="creator-workspace__media-slot-actions">
        <input
          ref={inputRef}
          type="file"
          accept={slot.accept}
          className="creator-workspace__media-input"
          disabled={disabled || phase === 'uploading'}
          onChange={onFileChange}
        />
        <button
          type="button"
          className="creator-workspace__media-btn"
          disabled={disabled || phase === 'uploading'}
          onClick={onChooseFile}
        >
          {buttonLabel}
        </button>
      </div>
    </li>
  );
}
