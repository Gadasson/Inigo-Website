'use client';

import { useLayoutEffect, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { resetScroll } from '@/lib/resetScroll';

function isInternalPath(href: string): boolean {
  if (!href || href.startsWith('#')) return false;
  if (href.startsWith('mailto:') || href.startsWith('tel:')) return false;
  if (href.startsWith('http://') || href.startsWith('https://')) return false;
  return href.startsWith('/');
}

/** Reset scroll before paint on route change so the new page isn't stuck at the old scroll position. */
export default function ScrollOnNavigate() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    if (typeof window === 'undefined') return;

    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }

    resetScroll();
  }, [pathname]);

  // Reset as soon as an internal link is tapped — before the next page finishes loading.
  useEffect(() => {
    const onDocumentClick = (event: MouseEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest('a[href]') as HTMLAnchorElement | null;
      if (!anchor || anchor.target === '_blank') return;

      const href = anchor.getAttribute('href');
      if (!href || !isInternalPath(href)) return;

      resetScroll();
    };

    document.addEventListener('click', onDocumentClick, true);
    return () => document.removeEventListener('click', onDocumentClick, true);
  }, []);

  return null;
}
