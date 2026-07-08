'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/contexts/AuthContext';

export default function StudioSignIn() {
  const { signInWithGoogle, configError } = useAuth();
  const t = useTranslations('signIn');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSignIn = async () => {
    setSubmitting(true);
    setError(null);

    try {
      await signInWithGoogle();
    } catch (err) {
      const message = err instanceof Error ? err.message : t('errorFailed');
      setError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="studio-signin">
      <div className="studio-signin__card">
        <div className="studio-signin__brand">
          <Image
            src="/images/heart_logo_last.svg"
            alt="Inigo logo"
            width={40}
            height={40}
            priority
          />
          <span className="studio-signin__brand-name">Inigo</span>
        </div>

        <h1 className="studio-signin__title">{t('title')}</h1>
        <p className="studio-signin__subtitle">{t('subtitle')}</p>

        {configError ? (
          <p className="studio-signin__error" role="alert">
            {configError}
          </p>
        ) : null}

        {error ? (
          <p className="studio-signin__error" role="alert">
            {error}
          </p>
        ) : null}

        <button
          type="button"
          className="studio-signin__google-btn"
          onClick={onSignIn}
          disabled={submitting || Boolean(configError)}
        >
          {submitting ? t('googleBusy') : t('google')}
        </button>
      </div>
    </div>
  );
}
