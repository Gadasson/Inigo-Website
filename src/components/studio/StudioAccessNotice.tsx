'use client';

import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

type Props =
  | { variant: 'denied'; message?: string; onRetry: () => void }
  | { variant: 'error'; message?: string; onRetry: () => void };

/**
 * Calm, full-screen notice shown instead of the Studio workspace when a
 * signed-in user is not an approved creator (`denied`) or the access check
 * could not complete (`error`). The workspace is never rendered in these states.
 */
export default function StudioAccessNotice(props: Props) {
  const { user, signOut } = useAuth();
  const t = useTranslations('access');

  const title = props.variant === 'denied' ? t('deniedTitle') : t('errorTitle');

  const body =
    props.variant === 'denied'
      ? t('deniedBody')
      : props.message || t('errorBody');

  return (
    <div className="studio-access">
      <div className="studio-access__card">
        <div className="studio-access__brand">
          <Image
            src="/images/heart_logo_last.svg"
            alt="Inigo logo"
            width={40}
            height={40}
            priority
          />
          <span className="studio-access__brand-name">Inigo</span>
        </div>

        <h1 className="studio-access__title">{title}</h1>
        <p className="studio-access__subtitle">{body}</p>

        {user?.email ? (
          <p className="studio-access__account">
            {t('signedInAs')} <span>{user.email}</span>
          </p>
        ) : null}

        <div className="studio-access__actions">
          <button
            type="button"
            className="studio-access__btn studio-access__btn--primary"
            onClick={props.onRetry}
          >
            {t('tryAgain')}
          </button>

          <button
            type="button"
            className="studio-access__btn"
            onClick={() => signOut()}
          >
            {props.variant === 'denied' ? t('signOut') : t('signInDifferent')}
          </button>
        </div>
      </div>
    </div>
  );
}
