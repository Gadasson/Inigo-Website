'use client';

import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  attachGuidedSessionMedia,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { uploadFileToFirebaseStorage } from '@/lib/firebase/storage';
import { isFirebaseStorageConfigured } from '@/lib/firebase/config';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import {
  buildGuidedSessionFileMetadata,
  buildGuidedSessionStoragePath,
  fileExtension,
  guidedSessionMediaFileName,
  guidedSessionMediaUrl,
  validateGuidedSessionMediaFile,
  type GuidedSessionMediaRole,
} from '@/lib/studio/guidedSessionMedia';

type SlotConfig = {
  id: string;
  role: GuidedSessionMediaRole;
  label: string;
  accept: string;
  emptyHint: string;
};

type Props = {
  slot: SlotConfig;
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
  const [error, setError] = useState<string | null>(null);

  const attachedUrl = guidedSessionMediaUrl(session, slot.role);
  const attachedName = guidedSessionMediaFileName(session, slot.role);
  const isAttached = Boolean(attachedUrl);

  const statusLabel = (() => {
    if (phase === 'uploading') return 'Uploading…';
    if (phase === 'error') return 'Could not attach';
    if (isAttached) return 'Attached';
    return 'Not added yet';
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
      setPhase('error');
      setError(validationError);
      return;
    }

    if (!isFirebaseStorageConfigured()) {
      setPhase('error');
      setError('File uploads are not configured yet. Contact your Studio admin.');
      return;
    }

    setPhase('uploading');
    setError(null);

    try {
      const ext = fileExtension(file.name);
      const storagePath = buildGuidedSessionStoragePath(session.session_id, slot.role, ext);
      const storageUrl = await uploadFileToFirebaseStorage(storagePath, file);
      const token = await getIdToken();
      const updated = await attachGuidedSessionMedia(
        session.id,
        {
          media_role: slot.role,
          storage_url: storageUrl,
          storage_path: storagePath,
          file_metadata: buildGuidedSessionFileMetadata(file),
        },
        token,
      );

      onSessionUpdated(updated);
      setPhase('idle');
    } catch (err) {
      setPhase('error');
      setError(parseStudioApiError(err));
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
            className={`creator-workspace__media-status creator-workspace__media-status--${phase === 'idle' && isAttached ? 'attached' : phase}`}
            role="status"
          >
            {statusLabel}
          </span>
        </div>

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
          {phase === 'uploading' ? 'Uploading…' : isAttached ? 'Replace' : 'Choose file'}
        </button>
      </div>
    </li>
  );
}
