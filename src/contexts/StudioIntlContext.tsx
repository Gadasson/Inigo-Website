'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { NextIntlClientProvider } from 'next-intl';
import enMessages from '../../messages/studio.en.json';
import heMessages from '../../messages/studio.he.json';

/**
 * Studio UI locale — independent from the marketing site locale and from the
 * guided session *content* language field. Studio lives outside the `[locale]`
 * route tree, so it manages its own locale, persistence, and text direction.
 */
export type StudioLocale = 'en' | 'he';

export const STUDIO_LOCALES: StudioLocale[] = ['en', 'he'];

const STORAGE_KEY = 'inigo-studio-locale';
const DEFAULT_LOCALE: StudioLocale = 'en';
/** Fixed timezone so SSR and client date formatting stay in sync. */
const STUDIO_TIME_ZONE = 'Asia/Jerusalem';

const MESSAGES: Record<StudioLocale, Record<string, unknown>> = {
  en: enMessages,
  he: heMessages,
};

type StudioLocaleContextValue = {
  locale: StudioLocale;
  setLocale: (locale: StudioLocale) => void;
  toggleLocale: () => void;
};

const StudioLocaleContext = createContext<StudioLocaleContextValue | undefined>(undefined);

function isStudioLocale(value: unknown): value is StudioLocale {
  return value === 'en' || value === 'he';
}

/** Match next-intl / Accept-Language: Hebrew browsers → he, otherwise en. */
function detectBrowserStudioLocale(): StudioLocale {
  if (typeof navigator === 'undefined') {
    return DEFAULT_LOCALE;
  }

  const languages = navigator.languages?.length
    ? navigator.languages
    : [navigator.language];

  for (const language of languages) {
    const code = language.toLowerCase().split('-')[0];
    if (code === 'he' || code === 'iw') {
      return 'he';
    }
  }

  return DEFAULT_LOCALE;
}

function readPersistedStudioLocale(): StudioLocale | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (isStudioLocale(stored)) {
      return stored;
    }

    // Honor marketing-site language when the user already chose one there.
    const siteLocale = localStorage.getItem('inigo-locale');
    if (isStudioLocale(siteLocale)) {
      return siteLocale;
    }
  } catch {
    /* localStorage unavailable */
  }

  return null;
}

export function StudioIntlProvider({ children }: { children: ReactNode }) {
  // Deterministic on server + first client render to avoid hydration mismatch;
  // locale is resolved from storage or browser language right after mount.
  const [locale, setLocaleState] = useState<StudioLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    setLocaleState(readPersistedStudioLocale() ?? detectBrowserStudioLocale());
  }, []);

  const setLocale = useCallback((next: StudioLocale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* ignore persistence failures */
    }
  }, []);

  const toggleLocale = useCallback(() => {
    setLocale(locale === 'en' ? 'he' : 'en');
  }, [locale, setLocale]);

  const dir: 'rtl' | 'ltr' = locale === 'he' ? 'rtl' : 'ltr';

  const value = useMemo(
    () => ({ locale, setLocale, toggleLocale }),
    [locale, setLocale, toggleLocale],
  );

  return (
    <StudioLocaleContext.Provider value={value}>
      <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]} timeZone={STUDIO_TIME_ZONE}>
        <div className="studio-root" dir={dir} lang={locale}>
          {children}
        </div>
      </NextIntlClientProvider>
    </StudioLocaleContext.Provider>
  );
}

export function useStudioLocale(): StudioLocaleContextValue {
  const context = useContext(StudioLocaleContext);
  if (context === undefined) {
    throw new Error('useStudioLocale must be used within a StudioIntlProvider');
  }
  return context;
}
