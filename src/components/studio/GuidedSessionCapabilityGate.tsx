'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { GUIDED_SESSIONS_CAPABILITY } from '@/lib/api/studioBootstrap';
import { useStudioAccess } from '@/contexts/StudioAccessContext';
import { shouldLoadStudioArea } from '@/lib/studio/studioAreas';

/**
 * Blocks every guided-session screen, including a direct URL, until the
 * parsed capability allows it. Children stay unmounted, so they do not fetch.
 */
export default function GuidedSessionCapabilityGate({ children }: { children: React.ReactNode }) {
  const { status, enabled, capabilities } = useStudioAccess();
  const t = useTranslations('capability');

  if (status.state !== 'connected' || !enabled) return null;

  if (
    !shouldLoadStudioArea(GUIDED_SESSIONS_CAPABILITY, {
      enabled,
      capabilities,
    })
  ) {
    return (
      <main className="studio-workspace">
        <div className="studio-workspace__container">
          <div className="studio-session-list__empty">
            <p className="studio-session-list__empty-title">{t('guidedSessionsTitle')}</p>
            <p className="studio-session-list__empty-text">{t('guidedSessionsBody')}</p>
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
