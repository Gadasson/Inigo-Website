'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import { useStudioAccess } from '@/contexts/StudioAccessContext';
import StudioAccessNotice from '@/components/studio/StudioAccessNotice';

const LOGIN_PATH = '/studio/login';
const STUDIO_PATH = '/studio';

function StudioLoading({ label }: { label: string }) {
  return (
    <div className="studio-loading" role="status" aria-live="polite">
      <span className="studio-loading__text">{label}</span>
    </div>
  );
}

export default function StudioGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const { status, retry } = useStudioAccess();
  const t = useTranslations('gate');
  const pathname = usePathname();
  const router = useRouter();

  const isLoginRoute = pathname === LOGIN_PATH;

  useEffect(() => {
    if (loading) return;

    if (!user && !isLoginRoute) {
      router.replace(LOGIN_PATH);
      return;
    }

    if (user && isLoginRoute) {
      router.replace(STUDIO_PATH);
    }
  }, [user, loading, isLoginRoute, router]);

  if (loading) {
    return <StudioLoading label={t('loading')} />;
  }

  if (!user && !isLoginRoute) {
    return <StudioLoading label={t('redirectingToSignIn')} />;
  }

  if (user && isLoginRoute) {
    return <StudioLoading label={t('redirecting')} />;
  }

  // Login route (signed out): render sign-in without an access check.
  if (isLoginRoute) {
    return <>{children}</>;
  }

  // Authenticated Studio routes: gate on the bootstrap/access signal so the
  // workspace never renders (or flashes) before access is known.
  if (status.state === 'idle' || status.state === 'loading') {
    return <StudioLoading label={t('checkingAccess')} />;
  }

  if (status.state === 'denied') {
    return (
      <StudioAccessNotice
        variant="denied"
        message={status.message}
        onRetry={retry}
      />
    );
  }

  if (status.state === 'offline' || status.state === 'error') {
    return <StudioAccessNotice variant="error" message={status.message} onRetry={retry} />;
  }

  return <>{children}</>;
}
