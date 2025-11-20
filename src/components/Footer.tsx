'use client';

import { useTranslations, useLocale } from 'next-intl';
import Link from 'next/link';

export default function Footer() {
  const t = useTranslations();
  const locale = useLocale();

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-nav">
            <Link href={`/${locale}/about`}>{t('common.about')}</Link>
            <Link href={`/${locale}/terms`}>{t('common.terms')}</Link>
            <Link href={`/${locale}/privacy`}>{t('common.privacy')}</Link>
            <Link href={`/${locale}/contact`}>{t('common.contact')}</Link>
          </div>
          

        </div>
        
        <div className="footer-bottom">
          <p>{t('footer.tagline')}</p>
          <p>{t('footer.hashtags')}</p>
        </div>
      </div>
    </footer>
  );
}
