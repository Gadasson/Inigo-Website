'use client';

import { useTranslations } from 'next-intl';
import { STUDIO_LOCALES, useStudioLocale } from '@/contexts/StudioIntlContext';

export default function StudioLanguageToggle() {
  const t = useTranslations('language');
  const { locale, setLocale } = useStudioLocale();

  return (
    <div className="studio-lang-toggle" role="group" aria-label={t('switch')}>
      {STUDIO_LOCALES.map((option) => (
        <button
          key={option}
          type="button"
          className={`studio-lang-toggle__btn${
            locale === option ? ' studio-lang-toggle__btn--active' : ''
          }`}
          aria-pressed={locale === option}
          onClick={() => setLocale(option)}
        >
          {t(option)}
        </button>
      ))}
    </div>
  );
}
