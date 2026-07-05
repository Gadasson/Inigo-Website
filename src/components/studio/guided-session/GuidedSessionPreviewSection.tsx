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
} from '@/lib/studio/guidedSessionMedia';

type Props = {
  session: StudioGuidedSession;
  form: GuidedSessionEditorForm;
};

function optionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
): string {
  return options.find((opt) => opt.value === value)?.label ?? value;
}

function mediaStateLabel(session: StudioGuidedSession): string {
  const hasAudio = Boolean(guidedSessionMediaUrl(session, 'audio'));
  const hasVideo = Boolean(guidedSessionMediaUrl(session, 'video'));

  if (hasAudio && hasVideo) return 'Audio and video attached';
  if (hasAudio) return 'Audio attached';
  if (hasVideo) return 'Video attached';
  return 'Add audio or video in Media';
}

export default function GuidedSessionPreviewSection({ session, form }: Props) {
  const coverUrl = guidedSessionMediaUrl(session, 'thumbnail');
  const audioUrl = guidedSessionMediaUrl(session, 'audio');
  const title = form.title.trim() || 'Untitled session';
  const description =
    form.description.trim() || 'Your description will appear here in the library.';

  const metaParts = [
    guidedSessionDurationDisplayLabel(session, form),
    optionLabel(GUIDED_SESSION_DIFFICULTIES, form.difficulty),
    optionLabel(GUIDED_SESSION_LANGUAGES, form.language),
    form.instructor.trim() || null,
  ].filter(Boolean);

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-preview-heading">
      <h2 id="workspace-preview-heading" className="creator-workspace__section-title">
        Preview
      </h2>
      <p className="creator-workspace__section-lede">
        A glimpse of how this session may feel in the Inigo library.
      </p>

      <article className="guided-session-preview" aria-label="Session library preview">
        <div className="guided-session-preview__cover">
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverUrl} alt="" className="guided-session-preview__cover-img" />
          ) : (
            <div className="guided-session-preview__cover-placeholder" aria-hidden>
              <span>Inigo</span>
            </div>
          )}
        </div>

        <div className="guided-session-preview__body">
          <h3 className="guided-session-preview__title">{title}</h3>
          <p className="guided-session-preview__description">{description}</p>

          <p className="guided-session-preview__meta">{metaParts.join(' · ')}</p>

          <p className="guided-session-preview__media-state">{mediaStateLabel(session)}</p>

          {audioUrl ? (
            <audio
              className="guided-session-preview__audio"
              controls
              preload="metadata"
              src={audioUrl}
            >
              Your browser does not support audio playback.
            </audio>
          ) : null}
        </div>
      </article>

      {!hasGuidedSessionPrimaryMedia(session) ? (
        <p className="guided-session-preview__note">
          Add audio or video in Media to complete the experience preview.
        </p>
      ) : null}

      {!hasGuidedSessionCover(session) ? (
        <p className="guided-session-preview__note">
          A cover image is optional but helps this session stand out in the library.
        </p>
      ) : null}
    </section>
  );
}
