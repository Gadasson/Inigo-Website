'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
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
  sessionSlug: string;
  status: string;
  readiness: WorkspaceReadiness;
  onSessionPublished: (session: StudioGuidedSession) => void;
};

function publicSessionPath(slug: string): string {
  return `/guided-session/${slug}`;
}

export default function GuidedSessionShareSection({
  sessionId,
  sessionSlug,
  status,
  readiness,
  onSessionPublished,
}: Props) {
  const { getIdToken } = useAuth();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const isDraft = status === 'draft';
  const isPublished = status === 'available';
  const { publishable } = readiness;

  const slug = publishedSlug ?? sessionSlug;
  const publicPath = slug ? publicSessionPath(slug) : null;

  const publicUrl = useMemo(() => {
    if (!publicPath) return null;
    if (typeof window === 'undefined') return publicPath;
    return `${window.location.origin}${publicPath}`;
  }, [publicPath]);

  const onPublishClick = () => {
    setPublishError(null);
    setConfirmOpen(true);
  };

  const onCancelConfirm = () => {
    if (publishing) return;
    setConfirmOpen(false);
  };

  const onConfirmPublish = async () => {
    setPublishing(true);
    setPublishError(null);

    try {
      const token = await getIdToken();
      const updated = await publishGuidedSession(sessionId, token);
      setPublishedSlug(updated.session_id ?? sessionSlug);
      onSessionPublished(updated);
      setConfirmOpen(false);
    } catch (err) {
      if (err instanceof StudioApiError && (err.status === 403 || err.status === 404)) {
        setPublishError('You do not have access to publish this session.');
      } else {
        setPublishError(parseStudioApiError(err));
      }
    } finally {
      setPublishing(false);
    }
  };

  const onCopyLink = async () => {
    if (!publicUrl) return;
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  if (isPublished) {
    return (
      <section className="creator-workspace__section" aria-labelledby="workspace-publish-heading">
        <h2 id="workspace-publish-heading" className="creator-workspace__section-title">
          Published to Inigo
        </h2>

        <div className="creator-workspace__published" role="status">
          <p className="creator-workspace__published-title">Published to the Inigo library</p>
          <p className="creator-workspace__published-text">
            This session is live in Inigo. In Studio V1, published sessions are read-only — you can
            still view and share this page anytime.
          </p>

          {publicPath ? (
            <div className="creator-workspace__published-actions">
              <a
                className="studio-form__submit creator-workspace__published-link"
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
              >
                View public page
              </a>
              {publicUrl ? (
                <button
                  type="button"
                  className="creator-workspace__published-btn"
                  onClick={() => void onCopyLink()}
                >
                  {copied ? 'Link copied' : 'Copy link'}
                </button>
              ) : null}
              <Link href="/studio?tab=sessions" className="creator-workspace__published-btn">
                Back to sessions
              </Link>
            </div>
          ) : (
            <div className="creator-workspace__published-actions">
              <Link href="/studio?tab=sessions" className="creator-workspace__published-btn">
                Back to sessions
              </Link>
            </div>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-publish-heading">
      <h2 id="workspace-publish-heading" className="creator-workspace__section-title">
        Ready to publish
      </h2>

      <p className="creator-workspace__section-lede">
        {publishable
          ? 'Everything required is ready. Publish to add this session to the Inigo library.'
          : 'Complete the missing items before publishing.'}
      </p>

      <WorkspaceReadinessChecklist readiness={readiness} />

      {publishError ? (
        <p className="studio-form__error" role="alert">
          {publishError}
        </p>
      ) : null}

      {isDraft ? (
        <div className="creator-workspace__share-actions">
          <button
            type="button"
            className="studio-form__submit creator-workspace__share-btn"
            disabled={!publishable || publishing}
            onClick={onPublishClick}
          >
            {publishable ? 'Publish' : 'Complete required items first'}
          </button>
        </div>
      ) : null}

      {confirmOpen ? (
        <div className="creator-workspace__dialog-backdrop" onClick={onCancelConfirm}>
          <div
            className="creator-workspace__dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="publish-confirm-title"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 id="publish-confirm-title" className="creator-workspace__dialog-title">
              Publish this session?
            </h3>
            <p className="creator-workspace__dialog-text">
              This session will appear in the Inigo library. In Studio V1, published sessions are
              read-only and can no longer be edited — but you can still view and share the published
              session page.
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
                onClick={() => void onConfirmPublish()}
              >
                {publishing ? 'Publishing…' : 'Publish'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
