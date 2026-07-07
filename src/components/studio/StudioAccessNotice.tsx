'use client';

import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';

type Props =
  | { variant: 'denied'; message?: string }
  | { variant: 'error'; message?: string; onRetry: () => void };

/**
 * Calm, full-screen notice shown instead of the Studio workspace when a
 * signed-in user is not an approved creator (`denied`) or the access check
 * could not complete (`error`). The workspace is never rendered in these states.
 */
export default function StudioAccessNotice(props: Props) {
  const { user, signOut } = useAuth();

  const title =
    props.variant === 'denied' ? 'Creator Studio is by invitation' : 'We could not confirm your access';

  const body =
    props.variant === 'denied'
      ? 'Creator Studio is currently available by invitation. If you believe you should have access, please reach out to the Inigo team.'
      : props.message || 'Something went wrong while checking your access. Please try again in a moment.';

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
            Signed in as <span>{user.email}</span>
          </p>
        ) : null}

        <div className="studio-access__actions">
          {props.variant === 'error' ? (
            <button
              type="button"
              className="studio-access__btn studio-access__btn--primary"
              onClick={props.onRetry}
            >
              Try again
            </button>
          ) : null}

          <button
            type="button"
            className="studio-access__btn"
            onClick={() => signOut()}
          >
            {props.variant === 'denied' ? 'Sign out' : 'Sign in with a different account'}
          </button>
        </div>
      </div>
    </div>
  );
}
