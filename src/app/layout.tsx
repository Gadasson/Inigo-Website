import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inigo — Plastic to Ecstatic",
  description: "From fake to real. From numb to now. Plastic → Ecstatic.",
  icons: { icon: "/favicon.ico" },
  openGraph: {
    title: "Inigo — Plastic to Ecstatic",
    description: "Quiet is the new revolution. Join the frequency.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Inigo — Plastic to Ecstatic",
    description: "Quiet is the new revolution. Join the frequency.",
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
