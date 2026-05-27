'use client';

import { useLayoutEffect, useRef, RefObject } from 'react';

function isInViewport(element: Element): boolean {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight && rect.bottom > 0;
}

export function useScrollAnimation(): RefObject<HTMLElement | null> {
  const ref = useRef<HTMLElement | null>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;

    // Show immediately if already on screen — avoids a blank/frozen feel after navigation
    // while IntersectionObserver hasn't fired yet (common on mobile during hydration).
    if (isInViewport(element)) {
      element.classList.add('visible');
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px',
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, []);

  return ref;
}
