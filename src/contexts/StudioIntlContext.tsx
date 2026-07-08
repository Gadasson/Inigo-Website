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

export function StudioIntlProvider({ children }: { children: ReactNode }) {
  // Deterministic on server + first client render to avoid hydration mismatch;
  // the stored preference is applied in an effect right after mount.
  const [locale, setLocaleState] = useState<StudioLocale>(DEFAULT_LOCALE);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (isStudioLocale(stored)) {
        setLocaleState(stored);
      }
    } catch {
      /* localStorage unavailable — keep default */
    }
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
