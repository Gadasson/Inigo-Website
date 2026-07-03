'use client';

import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import CreatorHome from './CreatorHome';
import StudioBackendStatus from './StudioBackendStatus';

export default function StudioShell() {
  const { user, signOut } = useAuth();

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
            <span className="studio-shell__product">Studio</span>
          </div>

          <div className="studio-shell__user">
            {user?.email ? (
              <span className="studio-shell__email">{user.email}</span>
            ) : null}
            <button type="button" className="studio-shell__logout" onClick={() => signOut()}>
              Log out
            </button>
          </div>
        </div>
      </header>

      <CreatorHome />

      <footer className="studio-shell__dev-footer">
        <div className="studio-shell__header-inner">
          <StudioBackendStatus />
        </div>
      </footer>
    </div>
  );
}
