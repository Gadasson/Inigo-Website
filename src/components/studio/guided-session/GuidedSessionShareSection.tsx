'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  publishGuidedSession,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import type { WorkspaceReadiness } from '@/lib/studio/workspaceReadiness';
import WorkspaceReadinessChecklist from '@/components/studio/workspace/WorkspaceReadinessChecklist';

type Props = {
  sessionId: number;
  status: string;
  readiness: WorkspaceReadiness;
  onSessionPublished: (session: StudioGuidedSession) => void;
};

export default function GuidedSessionShareSection({
  sessionId,
  status,
  readiness,
  onSessionPublished,
}: Props) {
  const { getIdToken } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [shareError, setShareError] = useState<string | null>(null);
  const [shareSuccess, setShareSuccess] = useState(false);

  const isDraft = status === 'draft';
  const isShared = status === 'available';
  const { publishable } = readiness;

  const onShareClick = () => {
    setShareError(null);
    setConfirmOpen(true);
  };

  const onCancelConfirm = () => {
    if (publishing) return;
    setConfirmOpen(false);
  };

  const onConfirmShare = async () => {
    setPublishing(true);
    setShareError(null);

    try {
      const token = await getIdToken();
      const updated = await publishGuidedSession(sessionId, token);
      onSessionPublished(updated);
      setShareSuccess(true);
      setConfirmOpen(false);
    } catch (err) {
      if (err instanceof StudioApiError && (err.status === 403 || err.status === 404)) {
        setShareError('You do not have access to share this session.');
      } else {
        setShareError(parseStudioApiError(err));
      }
    } finally {
      setPublishing(false);
    }
  };

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-share-heading">
      <h2 id="workspace-share-heading" className="creator-workspace__section-title">
        Ready to share
      </h2>

      {isShared ? (
        <p className="creator-workspace__section-lede">
          This session has been shared with Inigo.
        </p>
      ) : (
        <p className="creator-workspace__section-lede">
          {publishable
            ? 'Everything required is ready.'
            : 'Complete the missing items before sharing.'}
        </p>
      )}

      <WorkspaceReadinessChecklist readiness={readiness} />

      {shareSuccess ? (
        <p className="creator-workspace__share-success" role="status">
          Your session is now shared with Inigo.
        </p>
      ) : null}

      {shareError ? (
        <p className="studio-form__error" role="alert">
          {shareError}
        </p>
      ) : null}

      {isDraft ? (
        <div className="creator-workspace__share-actions">
          <button
            type="button"
            className="studio-form__submit creator-workspace__share-btn"
            disabled={!publishable || publishing}
            onClick={onShareClick}
          >
            {publishable ? 'Share with Inigo' : 'Complete required items first'}
          </button>
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="creator-workspace__dialog-backdrop" onClick={onCancelConfirm}>
          <div
            className="creator-workspace__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="share-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="share-confirm-title" className="creator-workspace__dialog-title">
              Share this session?
            </h3>
            <p className="creator-workspace__dialog-text">
              Once shared, this session will appear in the Inigo library and can no longer be
              edited in Studio V1.
            </p>
            <div className="creator-workspace__dialog-actions">
              <button
                type="button"
                className="creator-workspace__dialog-btn creator-workspace__dialog-btn--secondary"
                disabled={publishing}
                onClick={onCancelConfirm}
              >
                Cancel
              </button>
              <button
                type="button"
                className="studio-form__submit creator-workspace__dialog-btn"
                disabled={publishing}
                onClick={() => void onConfirmShare()}
              >
                {publishing ? 'Sharing…' : 'Share session'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
