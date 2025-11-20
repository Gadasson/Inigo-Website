import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inigo — From inner to beyond",
  description: "From fake to real. From numb to now. From inner to beyond.",
  icons: { 
    icon: "/images/heart_logo.svg",
    apple: "/images/heart_logo.svg"
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
        <meta property="og:image" content="/images/heart_logo.svg" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="Inigo - Heart Logo" />
        <meta name="twitter:image" content="/images/heart_logo.svg" />
        <link rel="icon" type="image/svg+xml" href="/images/heart_logo.svg" />
        <link rel="apple-touch-icon" href="/images/heart_logo.svg" />
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
