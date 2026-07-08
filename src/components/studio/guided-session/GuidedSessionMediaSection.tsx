'use client';

import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import { GUIDED_SESSION_MEDIA_SLOTS } from '@/lib/studio/guidedSessionMedia';
import type { OnGuidedSessionMediaUpdated } from '@/lib/studio/guidedSessionMediaTypes';
import GuidedSessionMediaSlot from '@/components/studio/guided-session/GuidedSessionMediaSlot';
import { useTranslations } from 'next-intl';

type Props = {
  session: StudioGuidedSession;
  isEditable: boolean;
  onSessionUpdated: OnGuidedSessionMediaUpdated;
};

export default function GuidedSessionMediaSection({
  session,
  isEditable,
  onSessionUpdated,
}: Props) {
  const t = useTranslations('media');

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-media-heading">
      <h2 id="workspace-media-heading" className="creator-workspace__section-title">
        {t('title')}
      </h2>
      <p className="creator-workspace__section-lede">{t('lede')}</p>

      {!isEditable ? (
        <p className="creator-workspace__media-readonly" role="status">
          {t('readonly')}
        </p>
      ) : null}

      <ul className="creator-workspace__media-list">
        {GUIDED_SESSION_MEDIA_SLOTS.map((slot) => (
          <GuidedSessionMediaSlot
            key={slot.id}
            slot={slot}
            session={session}
            disabled={!isEditable}
            onSessionUpdated={onSessionUpdated}
          />
        ))}
      </ul>
    </section>
  );
}
