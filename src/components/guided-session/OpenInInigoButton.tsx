'use client';

import type { MouseEvent, ReactNode } from 'react';
import { PLAY_STORE_URL } from '@/lib/appLinks';
import { detectAppDownloadPlatform } from '@/lib/appDownloadRedirect';
import { resolveOpenInAppHref } from '@/lib/openInApp';

type Props = {
  /** Public https canonical / Universal Link (SSR href + iOS / non-Android). */
  httpsUrl: string;
  className?: string;
  children?: ReactNode;
};

/**
 * Share-landing primary CTA.
 *
 * Default href is always the public https URL (Universal Links, crawlers, SSR).
 * On Android, click is intercepted and sent through an Intent URL so Chrome /
 * WhatsApp in-app browsers can open the installed app — same-origin https will not.
 */
export default function OpenInInigoButton({
  httpsUrl,
  className,
  children = 'Open in Inigo',
}: Props) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (detectAppDownloadPlatform(navigator.userAgent) !== 'android') return;
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (event.button !== 0) return;

    event.preventDefault();
    window.location.href = resolveOpenInAppHref(httpsUrl, navigator.userAgent, PLAY_STORE_URL);
  }

  return (
    <a className={className} href={httpsUrl} onClick={handleClick}>
      {children}
    </a>
  );
}
