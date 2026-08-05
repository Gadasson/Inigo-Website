'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { StudioGuidedSession } from '@/lib/api/studioGuidedSessions';
import {
  GUIDED_SESSION_MEDIA_SLOTS,
  hasGuidedSessionPrimaryMediaConflict,
  mergeGuidedSessionMediaActivity,
  type GuidedSessionMediaActivity,
} from '@/lib/studio/guidedSessionMedia';
import type { OnGuidedSessionMediaUpdated } from '@/lib/studio/guidedSessionMediaTypes';
import GuidedSessionMediaSlot from '@/components/studio/guided-session/GuidedSessionMediaSlot';
import { useTranslations } from 'next-intl';

type Props = {
  session: StudioGuidedSession;
  isEditable: boolean;
  onSessionUpdated: OnGuidedSessionMediaUpdated;
  onMediaActivityChange?: (activity: GuidedSessionMediaActivity) => void;
};

const IDLE_ACTIVITY: GuidedSessionMediaActivity = {
  uploading: false,
  attachPending: false,
};

export default function GuidedSessionMediaSection({
  session,
  isEditable,
  onSessionUpdated,
  onMediaActivityChange,
}: Props) {
  const t = useTranslations('media');
  const activityBySlotRef = useRef<Record<string, GuidedSessionMediaActivity>>({});
  const onMediaActivityChangeRef = useRef(onMediaActivityChange);
  onMediaActivityChangeRef.current = onMediaActivityChange;
  const [activityEpoch, setActivityEpoch] = useState(0);

  const reportSlotActivity = useCallback((slotId: string, activity: GuidedSessionMediaActivity) => {
    const previous = activityBySlotRef.current[slotId];
    if (
      previous &&
      previous.uploading === activity.uploading &&
      previous.attachPending === activity.attachPending
    ) {
      return;
    }
    activityBySlotRef.current[slotId] = activity;
    setActivityEpoch((value) => value + 1);
  }, []);

  useEffect(() => {
    const merged = mergeGuidedSessionMediaActivity(
      Object.values(activityBySlotRef.current),
    );
    onMediaActivityChangeRef.current?.(merged);
  }, [activityEpoch]);

  useEffect(() => {
    return () => {
      onMediaActivityChangeRef.current?.(IDLE_ACTIVITY);
    };
  }, []);

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-media-heading">
      <h2 id="workspace-media-heading" className="creator-workspace__section-title">
        {t('title')}
      </h2>
      <p className="creator-workspace__section-lede">{t('lede')}</p>
      <p className="creator-workspace__section-note">{t('uploadFlowNote')}</p>

      {hasGuidedSessionPrimaryMediaConflict(session) ? (
        <p className="studio-form__error" role="alert">
          {t('primaryConflict')}
        </p>
      ) : null}

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
            onActivityChange={reportSlotActivity}
          />
        ))}
      </ul>
    </section>
  );
}
