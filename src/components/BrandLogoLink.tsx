'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';

export default function BrandLogoLink() {
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
      className="brand-logo-link"
      aria-label="Back to home"
    >
      <Image
        src="/images/heart_logo.svg"
        alt="Inigo logo"
        width={36}
        height={36}
        priority
      />
      <span className="brand-logo-text">Inigo</span>
    </Link>
  );
}


