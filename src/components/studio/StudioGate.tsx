'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

const LOGIN_PATH = '/studio/login';
const STUDIO_PATH = '/studio';

export default function StudioGate({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
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
    return (
      <div className="studio-loading" role="status" aria-live="polite">
        <span className="studio-loading__text">Loading…</span>
      </div>
    );
  }

  if (!user && !isLoginRoute) {
    return (
      <div className="studio-loading" role="status" aria-live="polite">
        <span className="studio-loading__text">Redirecting to sign in…</span>
      </div>
    );
  }

  if (user && isLoginRoute) {
    return (
      <div className="studio-loading" role="status" aria-live="polite">
        <span className="studio-loading__text">Redirecting…</span>
      </div>
    );
  }

  return <>{children}</>;
}
