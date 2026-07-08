'use client';

import type { GuidedSessionDurationMediaSource } from '@/lib/studio/guidedSessionDuration';
import { useTranslations } from 'next-intl';

type Props = {
  title: string;
  description: string;
  durationLabel: string;
  durationFromMedia: boolean;
  durationMediaSource: GuidedSessionDurationMediaSource | null;
  statusLabel: string;
  lastUpdated: string | null;
  creator: string;
};

export default function WorkspaceOverview({
  title,
  description,
  durationLabel,
  durationFromMedia,
  durationMediaSource,
  statusLabel,
  lastUpdated,
  creator,
}: Props) {
  const t = useTranslations('overview');
  const td = useTranslations('duration');

  return (
    <section className="creator-workspace__section" aria-labelledby="workspace-overview-heading">
      <h2 id="workspace-overview-heading" className="creator-workspace__section-title">
        {t('title')}
      </h2>
      <p className="creator-workspace__section-lede">{t('lede')}</p>

      <dl className="creator-workspace__overview">
        <div className="creator-workspace__overview-item">
          <dt>{t('fieldTitle')}</dt>
          <dd>{title.trim() || t('untitled')}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>{t('fieldDescription')}</dt>
          <dd>{description.trim() || t('noDescription')}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>{t('fieldDuration')}</dt>
          <dd>
            {durationLabel}
            {durationFromMedia && durationMediaSource ? (
              <span className="creator-workspace__overview-duration-note">
                {durationMediaSource === 'audio' ? td('detectedAudio') : td('detectedVideo')}
              </span>
            ) : null}
          </dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>{t('fieldStatus')}</dt>
          <dd>{statusLabel}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>{t('fieldLastUpdated')}</dt>
          <dd>{lastUpdated ?? t('empty')}</dd>
        </div>
        <div className="creator-workspace__overview-item">
          <dt>{t('fieldCreator')}</dt>
          <dd>{creator.trim() || t('empty')}</dd>
        </div>
      </dl>
    </section>
  );
}
