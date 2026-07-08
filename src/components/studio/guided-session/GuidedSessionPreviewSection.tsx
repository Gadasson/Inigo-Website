'use client';

import LoadingRemoteImage from '@/components/LoadingRemoteImage';
import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import type { GuidedSessionEditorForm } from '@/lib/studio/guidedSessionEditorForm';
import {
  GUIDED_SESSION_DIFFICULTIES,
  GUIDED_SESSION_LANGUAGES,
} from '@/lib/studio/guidedSessionOptions';
import { guidedSessionDurationDisplayLabel } from '@/lib/studio/guidedSessionDuration';
import {
  guidedSessionMediaUrl,
  hasGuidedSessionCover,
  hasGuidedSessionPrimaryMedia,
  hasGuidedSessionPrimaryMediaConflict,
} from '@/lib/studio/guidedSessionMedia';
import { useTranslations } from 'next-intl';

type Props = {
  session: StudioGuidedSession;
  form: GuidedSessionEditorForm;
};

const LANGUAGE_LABEL_KEYS: Record<string, string> = {
  en: 'languageEn',
  he: 'languageHe',
};

const DIFFICULTY_LABEL_KEYS: Record<string, string> = {
  beginner: 'difficultyBeginner',
  intermediate: 'difficultyIntermediate',
  advanced: 'difficultyAdvanced',
};

const STATUS_LABEL_KEYS: Record<string, string> = {
  draft: 'draft',
  available: 'available',
  archived: 'archived',
};

function optionLabel(
  options: readonly { value: string; label: string }[],
  labelKeys: Record<string, string>,
  value: string,
  t: (key: string) => string,
): string {
  const key = labelKeys[value];
  return key ? t(key) : options.find((opt) => opt.value === value)?.label ?? value;
}

export default function GuidedSessionPreviewSection({ session, form }: Props) {
  const t = useTranslations('preview');
  const tm = useTranslations('media');
  const to = useTranslations('options');
  const ts = useTranslations('status');

  const coverUrl = guidedSessionMediaUrl(session, 'thumbnail');
  const audioUrl = guidedSessionMediaUrl(session, 'audio');
  const title = form.title.trim() || t('untitled');
  const description = form.description.trim() || t('descriptionPlaceholder');

  const statusLabel = STATUS_LABEL_KEYS[session.status]
    ? ts(STATUS_LABEL_KEYS[session.status])
    : session.status;

  const metaParts = [
    guidedSessionDurationDisplayLabel(session, form),
    optionLabel(GUIDED_SESSION_DIFFICULTIES, DIFFICULTY_LABEL_KEYS, form.difficulty, to),
    optionLabel(GUIDED_SESSION_LANGUAGES, LANGUAGE_LABEL_KEYS, form.language, to),
    form.instructor.trim() || null,
  ].filter(Boolean);

  const mediaStateLabel = (() => {
    const hasAudio = Boolean(guidedSessionMediaUrl(session, 'audio'));
    const hasVideo = Boolean(guidedSessionMediaUrl(session, 'video'));
    if (hasAudio && hasVideo) return t('mediaConflict');
    if (hasAudio) return t('mediaAudio');
    if (hasVideo) return t('mediaVideo');
    return t('mediaNone');
  })();

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-preview-heading">
      <h2 id="workspace-preview-heading" className="creator-workspace__section-title">
        {t('title')}
      </h2>
      <p className="creator-workspace__section-lede">{t('lede')}</p>

      <article className="guided-session-preview" aria-label={t('cardAria')}>
        <div className="guided-session-preview__cover">
          {coverUrl ? (
            <LoadingRemoteImage
              src={coverUrl}
              className="guided-session-preview__cover-img"
            />
          ) : (
            <div className="guided-session-preview__cover-placeholder" aria-hidden>
              <span>Inigo</span>
            </div>
          )}
        </div>

        <div className="guided-session-preview__body">
          <div className="guided-session-preview__heading-row">
            <h3 className="guided-session-preview__title">{title}</h3>
            <span
              className={`guided-session-preview__status guided-session-preview__status--${session.status}`}
            >
              {statusLabel}
            </span>
          </div>
          <p className="guided-session-preview__description">{description}</p>

          <p className="guided-session-preview__meta">{metaParts.join(' · ')}</p>

          <p className="guided-session-preview__media-state">{mediaStateLabel}</p>

          {audioUrl ? (
            <audio
              className="guided-session-preview__audio"
              controls
              preload="metadata"
              src={audioUrl}
            >
              {tm('audioUnsupported')}
            </audio>
          ) : null}
        </div>
      </article>

      {!hasGuidedSessionPrimaryMedia(session) && !hasGuidedSessionPrimaryMediaConflict(session) ? (
        <p className="guided-session-preview__note">{t('notePrimary')}</p>
      ) : null}

      {hasGuidedSessionPrimaryMediaConflict(session) ? (
        <p className="guided-session-preview__note">{t('notePrimaryConflict')}</p>
      ) : null}

      {!hasGuidedSessionCover(session) ? (
        <p className="guided-session-preview__note">{t('noteCover')}</p>
      ) : null}
    </section>
  );
}
