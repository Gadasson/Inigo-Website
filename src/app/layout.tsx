import type { Metadata } from 'next';
import { getPublicSiteUrl } from '@/lib/publicSiteUrl';
import './globals.css';

const defaultTitle = 'Inigo — Meditation, but social.';
const defaultDescription =
  'Be part of something bigger. A playful social meditation network where presence becomes visible and collective.';

export const metadata: Metadata = {
  metadataBase: new URL(getPublicSiteUrl()),
  title: defaultTitle,
  description: defaultDescription,
  icons: {
    icon: '/images/heart_logo_light.svg',
    apple: '/images/heart_logo_light.svg',
  },
  openGraph: {
    title: defaultTitle,
    description: defaultDescription,
    type: 'website',
    siteName: 'Inigo',
    // Intentionally no default images here: `guided-session` and other leaves set their own
    // `og:image`; duplicate images confuse crawlers (e.g. WhatsApp uses the first tag).
  },
  twitter: {
    card: 'summary_large_image',
    title: defaultTitle,
    description: defaultDescription,
  },
};

// Root layout - must have html and body tags
// Locale-specific attributes are set in [locale]/layout.tsx via template
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var storedLocale = localStorage.getItem('inigo-locale');
                  var html = document.documentElement;
                  if (storedLocale === 'he') {
                    html.setAttribute('dir', 'rtl');
                    html.setAttribute('lang', 'he');
                  } else {
                    html.setAttribute('dir', 'ltr');
                    html.setAttribute('lang', 'en');
                  }
                } catch (e) {
                  // Fallback if localStorage is not available
                  document.documentElement.setAttribute('dir', 'ltr');
                  document.documentElement.setAttribute('lang', 'en');
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
