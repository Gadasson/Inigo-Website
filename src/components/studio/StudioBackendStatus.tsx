'use client';

import { useTranslations } from 'next-intl';
import { useStudioAccess } from '@/contexts/StudioAccessContext';

export default function StudioBackendStatus() {
  const { status } = useStudioAccess();
  const t = useTranslations('backend');

  if (status.state === 'idle' || status.state === 'loading') {
    return (
      <p className="studio-backend-status studio-backend-status--loading" role="status">
        {t('checking')}
      </p>
    );
  }

  if (status.state === 'connected') {
    return (
      <p className="studio-backend-status studio-backend-status--connected" role="status">
        {t('connected')}
      </p>
    );
  }

  const modifier =
    status.state === 'denied'
      ? 'denied'
      : status.state === 'offline'
        ? 'offline'
        : 'error';

  return (
    <p className={`studio-backend-status studio-backend-status--${modifier}`} role="status">
      {status.message}
    </p>
  );
}
