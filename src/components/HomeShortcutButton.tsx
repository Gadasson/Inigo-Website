'use client';

import Link from 'next/link';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function HomeShortcutButton() {
  const locale = useLocale();
  const pathname = usePathname();

  const isHome =
    pathname === `/${locale}` || pathname === `/${locale}/` || pathname === '/';

  if (isHome) {
    return null;
  }

  return (
    <Link
      href={`/${locale}`}
      className="home-shortcut-btn"
      aria-label="Back to home"
    >
      <span className="home-shortcut-icon">⌂</span>
    </Link>
  );
}


