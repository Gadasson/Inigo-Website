'use client';

import { useStudioAccess } from '@/contexts/StudioAccessContext';

export default function StudioBackendStatus() {
  const { status } = useStudioAccess();

  if (status.state === 'idle' || status.state === 'loading') {
    return (
      <p className="studio-backend-status studio-backend-status--loading" role="status">
        Checking backend…
      </p>
    );
  }

  if (status.state === 'connected') {
    return (
      <p className="studio-backend-status studio-backend-status--connected" role="status">
        Backend connected
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
