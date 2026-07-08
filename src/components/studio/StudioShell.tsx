'use client';

import { Suspense } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';
import CreatorHome from './CreatorHome';
import StudioBackendStatus from './StudioBackendStatus';
import StudioLanguageToggle from './StudioLanguageToggle';

export default function StudioShell() {
  const { user, signOut } = useAuth();
  const t = useTranslations();

  return (
    <div className="studio-shell">
      <header className="studio-shell__header">
        <div className="studio-shell__header-inner">
          <div className="studio-shell__brand">
            <Image
              src="/images/heart_logo_last.svg"
              alt="Inigo logo"
              width={28}
              height={28}
              priority
            />
            <span className="studio-shell__brand-name">Inigo</span>
            <span className="studio-shell__product">{t('shell.product')}</span>
          </div>

          <div className="studio-shell__lang">
            <StudioLanguageToggle />
          </div>

          <div className="studio-shell__user">
            {user?.email ? (
              <span className="studio-shell__email">{user.email}</span>
            ) : null}
            <button type="button" className="studio-shell__logout" onClick={() => signOut()}>
              {t('shell.logOut')}
            </button>
          </div>
        </div>
      </header>

      <Suspense
        fallback={
          <main className="studio-workspace">
            <div className="studio-workspace__container">
              <p className="studio-session-list__status" role="status">
                {t('gate.loading')}
              </p>
            </div>
          </main>
        }
      >
        <CreatorHome />
      </Suspense>

      <footer className="studio-shell__dev-footer">
        <div className="studio-shell__header-inner">
          <StudioBackendStatus />
        </div>
      </footer>
    </div>
  );
}
