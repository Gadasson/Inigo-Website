import type { Metadata } from "next";
import "./globals.css";
import ScrollToTop from "../components/ScrollToTop";
import { WorldStateProvider } from "../contexts/WorldStateContext";

export const metadata: Metadata = {
  title: "Inigo — From inner to beyond",
  description: "From fake to real. From numb to now. From inner to beyond.",
  icons: { 
    icon: "/images/heart_logo.svg",
    apple: "/images/heart_logo.svg"
  },
  openGraph: {
    title: "Inigo — From inner to beyond",
    description: "Quiet is the new revolution. Join the frequency.",
    type: "website",
    url: "https://inigo.now",
    siteName: "Inigo",
    images: [
      {
        url: "/images/heart_logo.svg",
        width: 512,
        height: 512,
        alt: "Inigo - Heart Logo"
      }
    ],
    locale: "en_US"
  },
  twitter: {
    card: "summary_large_image",
    title: "Inigo — From inner to beyond",
    description: "Quiet is the new revolution. Join the frequency.",
    images: ["/images/heart_logo.svg"],
    creator: "@inigo",
    site: "@inigo"
  },
  other: {
    "msapplication-TileColor": "#4F7942",
    "theme-color": "#4F7942"
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta property="og:image" content="/images/heart_logo.svg" />
        <meta property="og:image:width" content="512" />
        <meta property="og:image:height" content="512" />
        <meta property="og:image:alt" content="Inigo - Heart Logo" />
        <meta name="twitter:image" content="/images/heart_logo.svg" />
        <link rel="icon" type="image/svg+xml" href="/images/heart_logo.svg" />
        <link rel="apple-touch-icon" href="/images/heart_logo.svg" />
      </head>
      <body className="antialiased">
        <WorldStateProvider>
          {children}
          <ScrollToTop />
        </WorldStateProvider>
      </body>
    </html>
  );
}
