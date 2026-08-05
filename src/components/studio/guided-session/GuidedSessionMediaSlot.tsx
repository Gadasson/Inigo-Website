'use client';

import { useEffect, useRef, useState } from 'react';
import {
  type GuidedSessionMediaActivity,
  type GuidedSessionMediaSlotConfig,
  getVideoOptimizationDisplayStatus,
  guidedSessionMediaFileName,
  guidedSessionMediaUrl,
  hasGuidedSessionPrimaryMediaConflict,
  hasGuidedSessionVideo,
  isGuidedSessionMediaSlotBlocked,
  primaryMediaBlockedHintKey,
  validateGuidedSessionMediaAttach,
  validateGuidedSessionMediaFile,
} from '@/lib/studio/guidedSessionMedia';
import { resolveCoverImagePreview } from '@/lib/studio/coverImagePreview';
import {
  getMediaUploadErrorCode,
  getPendingMediaAttach,
  MediaUploadError,
} from '@/lib/studio/guidedSessionMediaErrors';
import type {
  OnGuidedSessionMediaUpdated,
  PendingMediaAttach,
} from '@/lib/studio/guidedSessionMediaTypes';
import type { MediaUploadResult } from '@/lib/studio/guidedSessionMediaUpload';
import {
  clearPendingMediaAttach,
  loadPendingMediaAttach,
  savePendingMediaAttach,
} from '@/lib/studio/pendingMediaAttachStorage';
import { isFirebaseStorageConfigured } from '@/lib/firebase/config';
import { useAuth } from '@/contexts/AuthContext';
import {
  detachGuidedSessionMedia,
  retryGuidedSessionVideoOptimization,
} from '@/lib/api/studioGuidedSessions';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import StudioConfirmDialog from '@/components/studio/StudioConfirmDialog';
import LoadingRemoteImage from '@/components/LoadingRemoteImage';
import { useTranslations } from 'next-intl';

type Props = {
  slot: GuidedSessionMediaSlotConfig;
  session: StudioGuidedSession;
  disabled: boolean;
  onSessionUpdated: OnGuidedSessionMediaUpdated;
  /** Stable callback preferred — slot id is provided by this component. */
  onActivityChange?: (slotId: string, activity: GuidedSessionMediaActivity) => void;
};

type SlotPhase =
  | 'idle'
  | 'uploading'
  | 'removing'
  | 'attach_pending'
  | 'retrying_attach'
  | 'retrying_optimization'
  | 'error';

const SLOT_LABEL_KEYS: Record<string, string> = {
  audio: 'slotAudio',
  cover: 'slotCover',
  video: 'slotVideo',
};

const SLOT_HINT_KEYS: Record<string, string> = {
  audio: 'hintAudio',
  cover: 'hintCover',
  video: 'hintVideo',
};

const SLOT_FORMATS_KEYS: Record<string, string> = {
  audio: 'formatsAudio',
  cover: 'formatsCover',
  video: 'formatsVideo',
};

const SLOT_RECOMMENDED_KEYS: Record<string, string> = {
  audio: 'recommendedAudio',
  cover: 'recommendedCover',
  video: 'recommendedVideo',
};

const SLOT_MAX_SIZE: Record<string, string> = {
  audio: '50 MB',
  cover: '10 MB',
  video: '2 GB',
};

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
  onActivityChange,
}: Props) {
  const { getIdToken } = useAuth();
  const t = useTranslations('media');
  const tv = useTranslations('mediaValidation');
  const te = useTranslations('mediaError');
  const inputRef = useRef<HTMLInputElement>(null);
  const localObjectUrlRef = useRef<string | null>(null);
  const [phase, setPhase] = useState<SlotPhase>('idle');
  const [uploadPercent, setUploadPercent] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pendingAttach, setPendingAttach] = useState<PendingMediaAttach | null>(null);
  const [localObjectUrl, setLocalObjectUrl] = useState<string | null>(null);
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [restoredPending, setRestoredPending] = useState(false);

  useEffect(() => {
    if (restoredPending || disabled) return;
    const stored = loadPendingMediaAttach(session.id, slot.role);
    if (!stored) {
      setRestoredPending(true);
      return;
    }
    setPendingAttach(stored);
    setPhase('attach_pending');
    setError(te('attachPending'));
    setRestoredPending(true);
  }, [disabled, restoredPending, session.id, slot.role, te]);

  useEffect(() => {
    return () => {
      if (localObjectUrlRef.current) {
        URL.revokeObjectURL(localObjectUrlRef.current);
        localObjectUrlRef.current = null;
      }
    };
  }, []);

  const revokeLocalObjectUrl = () => {
    if (localObjectUrlRef.current) {
      URL.revokeObjectURL(localObjectUrlRef.current);
      localObjectUrlRef.current = null;
    }
    setLocalObjectUrl(null);
  };

  const setLocalPreviewFromFile = (file: File) => {
    revokeLocalObjectUrl();
    if (slot.role !== 'thumbnail' || !file.type.startsWith('image/')) {
      return;
    }
    const url = URL.createObjectURL(file);
    localObjectUrlRef.current = url;
    setLocalObjectUrl(url);
  };

  const videoOptStatus =
    slot.role === 'video' ? getVideoOptimizationDisplayStatus(session) : null;
  const attachedUrl = guidedSessionMediaUrl(session, slot.role);
  const attachedName = guidedSessionMediaFileName(session, slot.role);
  const isAttached =
    slot.role === 'video' ? hasGuidedSessionVideo(session) : Boolean(attachedUrl);
  const hasPendingAttach = pendingAttach !== null;
  const hasConflict = hasGuidedSessionPrimaryMediaConflict(session);
  const isBlocked = isGuidedSessionMediaSlotBlocked(session, slot.role, isAttached);
  const isInteractionDisabled = disabled || isBlocked;

  const displayFileName =
    pendingAttach?.originalFileName ||
    (isAttached && !hasPendingAttach ? attachedName : null) ||
    null;

  const coverPreview =
    slot.role === 'thumbnail'
      ? resolveCoverImagePreview({
          persistedUrl: attachedUrl,
          localObjectUrl,
          hasPendingAttach,
          isUploading: phase === 'uploading',
        })
      : null;

  const onActivityChangeRef = useRef(onActivityChange);
  onActivityChangeRef.current = onActivityChange;

  useEffect(() => {
    onActivityChangeRef.current?.(slot.id, {
      uploading:
        phase === 'uploading' ||
        phase === 'retrying_attach' ||
        phase === 'removing' ||
        phase === 'retrying_optimization',
      attachPending: hasPendingAttach,
    });
  }, [phase, hasPendingAttach, slot.id]);

  const slotLabel = t(SLOT_LABEL_KEYS[slot.id] ?? slot.id);
  const slotHint = (() => {
    if (hasConflict && (slot.role === 'audio' || slot.role === 'video')) {
      return t('hintPrimaryConflict');
    }
    if (isBlocked) {
      return t(primaryMediaBlockedHintKey(slot.role));
    }
    return t(SLOT_HINT_KEYS[slot.id] ?? 'hintAudio');
  })();
  const slotFormats = t(SLOT_FORMATS_KEYS[slot.id] ?? 'formatsAudio');
  const slotMaxSize =
    slot.role === 'video'
      ? t('maxUploadSize', { size: SLOT_MAX_SIZE[slot.id] ?? '' })
      : t('maxSize', { size: SLOT_MAX_SIZE[slot.id] ?? '' });
  const slotRecommended = t(SLOT_RECOMMENDED_KEYS[slot.id] ?? 'recommendedAudio');

  const formatValidationError = (validationError: ReturnType<typeof validateGuidedSessionMediaFile>) => {
    if (!validationError) return null;
    if (validationError.code === 'tooLarge') {
      return tv('tooLarge', { maxMb: validationError.maxMb });
    }
    return tv(validationError.code);
  };

  const formatUploadError = (err: unknown) => te(getMediaUploadErrorCode(err));

  const statusLabel = (() => {
    if (phase === 'uploading') {
      if (uploadPercent >= 100) return t('statusAttaching');
      return t('statusUploading', { percent: uploadPercent });
    }
    if (phase === 'removing') return t('statusRemoving');
    if (phase === 'retrying_attach') return t('statusRetrying');
    if (phase === 'retrying_optimization') return t('statusRetryingOptimization');
    if (phase === 'attach_pending') return t('statusAttachFailed');
    if (phase === 'error') return t('statusUploadFailed');
    if (slot.role === 'video') {
      if (videoOptStatus === 'optimizing') return t('statusOptimizing');
      if (videoOptStatus === 'failed') return t('statusOptimizeFailed');
      if (videoOptStatus === 'ready') return t('statusVideoReady');
    }
    if (isAttached) return t('statusUploaded');
    return t('statusNotAdded');
  })();

  const statusModifier = (() => {
    if (phase !== 'idle') {
      if (phase === 'attach_pending') return 'attach-pending';
      if (phase === 'retrying_attach' || phase === 'retrying_optimization' || phase === 'uploading') {
        return 'uploading';
      }
      if (phase === 'removing') return 'removing';
      return phase;
    }
    if (slot.role === 'video') {
      if (videoOptStatus === 'optimizing') return 'optimizing';
      if (videoOptStatus === 'failed') return 'optimize-failed';
      if (videoOptStatus === 'ready' || isAttached) return 'attached';
    }
    if (isAttached) return 'attached';
    return 'idle';
  })();

  const buttonLabel = (() => {
    if (phase === 'uploading') {
      if (uploadPercent >= 100) return t('buttonAttaching');
      return t('buttonUploading', { percent: uploadPercent });
    }
    if (phase === 'removing') return t('buttonRemoving');
    if (phase === 'retrying_attach') return t('buttonRetrying');
    if (phase === 'retrying_optimization') return t('buttonRetryingOptimization');
    return isAttached || hasPendingAttach ? t('buttonReplace') : t('buttonChoose');
  })();

  const persistPending = (next: PendingMediaAttach | null) => {
    setPendingAttach(next);
    if (next) {
      savePendingMediaAttach(next);
    } else {
      clearPendingMediaAttach(session.id, slot.role);
    }
  };

  const clearPendingAttach = () => {
    persistPending(null);
  };

  const onChooseFile = () => {
    inputRef.current?.click();
  };

  const onDiscardPending = () => {
    clearPendingAttach();
    revokeLocalObjectUrl();
    setPhase('idle');
    setError(null);
    setUploadPercent(0);
  };

  const onRemoveAttached = async () => {
    if (!isAttached || disabled) return;

    setPhase('removing');
    setError(null);

    try {
      const token = await getIdToken();
      const updated = await detachGuidedSessionMedia(session.id, slot.role, token);
      onSessionUpdated(updated);
      clearPendingAttach();
      revokeLocalObjectUrl();
      setRemoveConfirmOpen(false);
      setPhase('idle');
      setUploadPercent(0);
    } catch (err) {
      setPhase('error');
      setError(parseStudioApiError(err));
    }
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
      revokeLocalObjectUrl();
      setPhase('idle');
      setUploadPercent(0);
    } catch (err) {
      const nextPending = getPendingMediaAttach(err) ?? pendingAttach;
      persistPending(nextPending);
      setPhase('attach_pending');
      setError(formatUploadError(err));
    }
  };

  const onRetryOptimization = async () => {
    if (slot.role !== 'video' || videoOptStatus !== 'failed' || disabled) return;

    setPhase('retrying_optimization');
    setError(null);

    try {
      const token = await getIdToken();
      const updated = await retryGuidedSessionVideoOptimization(session.id, token);
      onSessionUpdated(updated);
      setPhase('idle');
    } catch (err) {
      setPhase('error');
      setError(parseStudioApiError(err));
    }
  };

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';

    if (!file || disabled) return;

    clearPendingAttach();

    const attachError = validateGuidedSessionMediaAttach(session, slot.role, isAttached);
    if (attachError) {
      setPhase('idle');
      setError(formatValidationError(attachError));
      setUploadPercent(0);
      return;
    }

    const validationError = validateGuidedSessionMediaFile(file, slot.role);
    if (validationError) {
      setPhase('idle');
      setError(formatValidationError(validationError));
      setUploadPercent(0);
      return;
    }

    if (!isFirebaseStorageConfigured()) {
      setPhase('idle');
      setError(formatUploadError(new MediaUploadError('config', '', null)));
      setUploadPercent(0);
      return;
    }

    setLocalPreviewFromFile(file);
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
        onProgress: ({ stage, percent }) => {
          setUploadPercent(stage === 'attach' ? 100 : percent);
        },
      });

      applyMediaUploadResult(result, onSessionUpdated);
      clearPendingAttach();
      revokeLocalObjectUrl();
      setPhase('idle');
      setUploadPercent(0);
    } catch (err) {
      const nextPending = getPendingMediaAttach(err);
      if (nextPending) {
        persistPending(nextPending);
        setPhase('attach_pending');
      } else {
        revokeLocalObjectUrl();
        setPhase('error');
      }
      setUploadPercent(0);
      setError(formatUploadError(err));
    }
  };

  const isBusy =
    phase === 'uploading' ||
    phase === 'removing' ||
    phase === 'retrying_attach' ||
    phase === 'retrying_optimization';
  const slotModifier = statusModifier === 'idle' ? null : statusModifier;

  return (
    <li
      className={`creator-workspace__media-slot${
        isAttached && !hasPendingAttach ? ' creator-workspace__media-slot--attached' : ''
      }${slotModifier ? ` creator-workspace__media-slot--${slotModifier}` : ''}`}
    >
      <div className="creator-workspace__media-slot-main">
        <div className="creator-workspace__media-slot-heading">
          <span className="creator-workspace__slot-label">{slotLabel}</span>
          <span
            className={`creator-workspace__media-status creator-workspace__media-status--${statusModifier}`}
            role="status"
          >
            {statusLabel}
          </span>
        </div>

        <p className="creator-workspace__media-format-guide">
          <span>{slotFormats}</span>
          <span>{slotMaxSize}</span>
          <span>{slotRecommended}</span>
        </p>

        {slot.role === 'video' ? (
          <p className="creator-workspace__media-optimize-note">{t('autoOptimizeNote')}</p>
        ) : null}

        {slot.role === 'video' && videoOptStatus === 'optimizing' ? (
          <p className="creator-workspace__media-hint">{t('optimizingHint')}</p>
        ) : null}

        {slot.role === 'video' && videoOptStatus === 'failed' ? (
          <p className="creator-workspace__media-hint">{t('optimizeFailedHint')}</p>
        ) : null}

        {displayFileName ? (
          <p className="creator-workspace__media-filename">{displayFileName}</p>
        ) : videoOptStatus !== 'optimizing' && videoOptStatus !== 'failed' ? (
          <p className="creator-workspace__media-hint">{slotHint}</p>
        ) : null}

        {coverPreview?.kind === 'persisted' && coverPreview.src ? (
          <LoadingRemoteImage
            src={coverPreview.src}
            className="creator-workspace__media-thumb"
            wrapperClassName="creator-workspace__media-thumb-wrap"
          />
        ) : null}

        {coverPreview?.kind === 'local_pending' && coverPreview.src ? (
          <div className="creator-workspace__media-thumb-wrap creator-workspace__media-thumb-wrap--pending">
            {/* Local blob preview — not persisted server media */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreview.src}
              alt=""
              className="creator-workspace__media-thumb creator-workspace__media-thumb--pending"
            />
            <span className="creator-workspace__media-pending-badge">{t('pendingPreviewBadge')}</span>
          </div>
        ) : null}

        {slot.role === 'audio' && attachedUrl && !hasPendingAttach ? (
          <audio
            className="creator-workspace__media-audio"
            controls
            preload="metadata"
            src={attachedUrl}
          >
            {t('audioUnsupported')}
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
              {t('retryAttach')}
            </button>
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
              disabled={disabled || isBusy}
              onClick={onDiscardPending}
            >
              {t('discard')}
            </button>
          </div>
        ) : null}

        {slot.role === 'video' && videoOptStatus === 'failed' && !hasPendingAttach ? (
          <div className="creator-workspace__media-recovery">
            <button
              type="button"
              className="creator-workspace__media-btn creator-workspace__media-btn--primary"
              disabled={disabled || isBusy}
              onClick={() => void onRetryOptimization()}
            >
              {t('retryOptimization')}
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
          disabled={isInteractionDisabled || isBusy}
          onChange={onFileChange}
        />
        {isAttached && !hasPendingAttach ? (
          <button
            type="button"
            className="creator-workspace__media-btn creator-workspace__media-btn--ghost"
            disabled={disabled || isBusy}
            onClick={() => setRemoveConfirmOpen(true)}
          >
            {t('buttonRemove')}
          </button>
        ) : null}
        <button
          type="button"
          className="creator-workspace__media-btn"
          disabled={isInteractionDisabled || isBusy}
          onClick={onChooseFile}
        >
          {buttonLabel}
        </button>
      </div>

      <StudioConfirmDialog
        open={removeConfirmOpen}
        title={t('confirmRemoveTitle', { type: slotLabel })}
        message={t('confirmRemoveBody')}
        cancelLabel={t('cancel')}
        confirmLabel={t('buttonRemove')}
        confirmBusy={phase === 'removing'}
        confirmBusyLabel={t('buttonRemoving')}
        onCancel={() => {
          if (phase !== 'removing') setRemoveConfirmOpen(false);
        }}
        onConfirm={() => void onRemoveAttached()}
      />
    </li>
  );
}
