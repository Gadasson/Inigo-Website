import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'freerangestock.com',
      },
      {
        protocol: 'https',
        hostname: 'i.pinimg.com',
      },
      {
        protocol: 'https',
        hostname: 'us.images.westend61.de',
      },
      {
        protocol: 'https',
        hostname: 'images.presentationgo.com',
      },
      {
        protocol: 'https',
        hostname: 'mysolluna.com',
      },
    ],
  },
  async rewrites() {
    return [
      // Canonical share routes - proxy directly to backend (with trailing slash to match backend)
      { source: "/e/:id", destination: "https://api2.inigo.now/api/share/e/:id/" },
      { source: "/s/:id", destination: "https://api2.inigo.now/api/share/s/:id/" },
      { source: "/event/:id", destination: "https://api2.inigo.now/api/share/event/:id/" },
      { source: "/spot/:id", destination: "https://api2.inigo.now/api/share/spot/:id/" },
      // Defensive catch-all: if anything redirects to /api/share/..., proxy it to backend
      { source: "/api/share/:path*", destination: "https://api2.inigo.now/api/share/:path*" }
    ];
  }
};

export default withNextIntl(nextConfig);
