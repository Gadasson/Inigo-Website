'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { CHALLENGES_CAPABILITY } from '@/lib/api/studioBootstrap';
import { useStudioAccess } from '@/contexts/StudioAccessContext';
import { shouldLoadStudioArea } from '@/lib/studio/studioAreas';

/** Blocks every challenges screen, including a direct URL, before content requests. */
export default function ChallengeCapabilityGate({ children }: { children: React.ReactNode }) {
  const { status, enabled, capabilities } = useStudioAccess();
  const t = useTranslations('challenges');

  if (status.state !== 'connected' || !enabled) return null;

  if (!shouldLoadStudioArea(CHALLENGES_CAPABILITY, { enabled, capabilities })) {
    return (
      <main className="studio-workspace">
        <div className="studio-workspace__container">
          <div className="studio-session-list__empty">
            <p className="studio-session-list__empty-title">{t('unavailableTitle')}</p>
            <p className="studio-session-list__empty-text">{t('unavailableBody')}</p>
            <Link href="/studio" className="studio-form-page__back">
              <span className="studio-back-arrow" aria-hidden>
                ←
              </span>{' '}
              {t('backToStudio')}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return children;
}
