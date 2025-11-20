'use client';

import { useState, useEffect, useRef } from 'react';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { locales, type Locale } from '../i18n/config';

function buildHref(targetLocale: Locale, normalizedPath: string) {
  if (normalizedPath === '/' || normalizedPath.length === 0) {
    return `/${targetLocale}`;
  }

  return `/${targetLocale}${normalizedPath}`;
}

export default function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Remove the locale only if it appears at the beginning of the path
  const pathWithoutLocale =
    pathname.replace(new RegExp(`^/(?:${locales.join('|')})`), '') || '/';

  const normalizedPath =
    pathWithoutLocale === '' ? '/' : pathWithoutLocale;

  const isHomePage = locales.some((loc) => pathname === `/${loc}`);

  // Detect mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Check for stored locale preference on mount and redirect if needed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const storedLocale = localStorage.getItem('inigo-locale') as Locale | null;
    
    // Only redirect if:
    // 1. We have a stored preference
    // 2. It's a valid locale
    // 3. We're on the home page (to avoid redirect loops)
    // 4. Current locale doesn't match stored preference
    if (
      storedLocale &&
      locales.includes(storedLocale) &&
      isHomePage &&
      locale !== storedLocale
    ) {
      const targetPath = buildHref(storedLocale, normalizedPath);
      window.location.href = targetPath;
    }
  }, [locale, isHomePage, normalizedPath]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen &&
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target as Node) &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  if (!isHomePage) {
    return null;
  }

  const currentLabel = locale === 'en' ? 'EN' : 'עברית';

  return (
    <div className="language-switcher">
      {/* Mobile: Icon button with popover */}
      {isMobile ? (
        <>
          <button
            ref={buttonRef}
            className="lang-icon-btn"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Change language"
            aria-expanded={isOpen}
            aria-haspopup="true"
          >
            <span className="lang-icon">🌐</span>
            <span className="lang-current-mobile">{currentLabel}</span>
          </button>
          
          {isOpen && (
            <div ref={popoverRef} className="lang-popover">
              {(['en', 'he'] as Locale[]).map((targetLocale) => {
                const isActive = locale === targetLocale;
                const label = targetLocale === 'en' ? 'EN' : 'עברית';

                if (isActive) {
                  return (
                    <span
                      key={targetLocale}
                      className="lang-option active"
                      aria-current="true"
                    >
                      {label}
                    </span>
                  );
                }

                return (
                  <Link
                    key={targetLocale}
                    href={buildHref(targetLocale, normalizedPath)}
                    className="lang-option"
                    aria-label={`Switch to ${targetLocale === 'en' ? 'English' : 'Hebrew'}`}
                    onClick={() => {
                      setIsOpen(false);
                      // Store language preference in localStorage
                      if (typeof window !== 'undefined') {
                        localStorage.setItem('inigo-locale', targetLocale);
                      }
                    }}
                  >
                    {label}
                  </Link>
                );
              })}
            </div>
          )}
        </>
      ) : (
        /* Desktop: Always visible buttons */
        <>
          {(['en', 'he'] as Locale[]).map((targetLocale) => {
            const isActive = locale === targetLocale;
            const label = targetLocale === 'en' ? 'EN' : 'עברית';

            if (isActive) {
              return (
                <span
                  key={targetLocale}
                  className="lang-btn active"
                  aria-current="true"
                >
                  {label}
                </span>
              );
            }

            return (
              <Link
                key={targetLocale}
                href={buildHref(targetLocale, normalizedPath)}
                className="lang-btn"
                aria-label={`Switch to ${targetLocale === 'en' ? 'English' : 'Hebrew'}`}
                onClick={() => {
                  // Store language preference in localStorage
                  if (typeof window !== 'undefined') {
                    localStorage.setItem('inigo-locale', targetLocale);
                  }
                }}
              >
                {label}
              </Link>
            );
          })}
        </>
      )}
    </div>
  );
}

