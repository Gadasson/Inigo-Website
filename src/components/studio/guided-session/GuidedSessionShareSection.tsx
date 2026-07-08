'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import {
  publishGuidedSession,
  type StudioGuidedSession,
} from '@/lib/api/studioGuidedSessions';
import { StudioApiError } from '@/lib/api/studioApiClient';
import { formatPublishAvailableAt } from '@/lib/studio/formatPublishAvailableAt';
import { parseStudioApiError } from '@/lib/studio/parseStudioApiError';
import {
  parsePublishControlError,
  type PublishControlError,
} from '@/lib/studio/parsePublishControlError';
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
  const t = useTranslations('publish');
  const locale = useLocale();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishControlError, setPublishControlError] = useState<PublishControlError | null>(null);
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
    setPublishControlError(null);
    setConfirmOpen(true);
  };

  const onCancelConfirm = () => {
    if (publishing) return;
    setConfirmOpen(false);
  };

  const onConfirmPublish = async () => {
    setPublishing(true);
    setPublishError(null);
    setPublishControlError(null);

    try {
      const token = await getIdToken();
      const updated = await publishGuidedSession(sessionId, token);
      setPublishedSlug(updated.session_id ?? sessionSlug);
      onSessionPublished(updated);
      setConfirmOpen(false);
    } catch (err) {
      const controlError = parsePublishControlError(err);
      if (controlError) {
        setPublishControlError(controlError);
      } else if (err instanceof StudioApiError && (err.status === 403 || err.status === 404)) {
        setPublishError(t('noAccess'));
      } else {
        setPublishError(parseStudioApiError(err));
      }
      setConfirmOpen(false);
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
          {t('publishedTitle')}
        </h2>

        <div className="creator-workspace__published" role="status">
          <p className="creator-workspace__published-title">{t('publishedHeading')}</p>
          <p className="creator-workspace__published-text">{t('publishedText')}</p>

          {publicPath ? (
            <div className="creator-workspace__published-actions">
              <a
                className="studio-form__submit creator-workspace__published-link"
                href={publicPath}
                target="_blank"
                rel="noopener noreferrer"
              >
                {t('viewPublicPage')}
              </a>
              {publicUrl ? (
                <button
                  type="button"
                  className="creator-workspace__published-btn"
                  onClick={() => void onCopyLink()}
                >
                  {copied ? t('linkCopied') : t('copyLink')}
                </button>
              ) : null}
              <Link href="/studio?tab=sessions" className="creator-workspace__published-btn">
                {t('backToSessions')}
              </Link>
            </div>
          ) : (
            <div className="creator-workspace__published-actions">
              <Link href="/studio?tab=sessions" className="creator-workspace__published-btn">
                {t('backToSessions')}
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
        {t('readyTitle')}
      </h2>

      <p className="creator-workspace__section-lede">
        {publishable ? t('readyLede') : t('notReadyLede')}
      </p>

      <WorkspaceReadinessChecklist readiness={readiness} />

      {publishControlError?.kind === 'cooldown' ? (
        <div className="creator-workspace__publish-notice" role="status">
          <p className="creator-workspace__publish-notice-title">
            {publishControlError.retryAfterAt
              ? t('cooldownWithTime', {
                  time: formatPublishAvailableAt(publishControlError.retryAfterAt, locale),
                })
              : t('cooldownNoTime')}
          </p>
        </div>
      ) : null}

      {publishControlError?.kind === 'limit' ? (
        <div className="creator-workspace__publish-notice" role="status">
          <p className="creator-workspace__publish-notice-title">{t('limitTitle')}</p>
          <p className="creator-workspace__publish-notice-text">{t('limitBody')}</p>
        </div>
      ) : null}

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
            {publishable ? t('publish') : t('completeFirst')}
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
              {t('confirmTitle')}
            </h3>
            <p className="creator-workspace__dialog-text">{t('confirmText')}</p>
            <div className="creator-workspace__dialog-actions">
              <button
                type="button"
                className="creator-workspace__dialog-btn creator-workspace__dialog-btn--secondary"
                disabled={publishing}
                onClick={onCancelConfirm}
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                className="studio-form__submit creator-workspace__dialog-btn"
                disabled={publishing}
                onClick={() => void onConfirmPublish()}
              >
                {publishing ? t('publishing') : t('publish')}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
