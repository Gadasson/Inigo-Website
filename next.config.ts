import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      { source: "/e/:id", destination: "https://api2.inigo.now/api/share/e/:id" },
      { source: "/s/:id", destination: "https://api2.inigo.now/api/share/s/:id" },
      { source: "/event/:id", destination: "https://api2.inigo.now/api/share/event/:id" },
      { source: "/spot/:id", destination: "https://api2.inigo.now/api/share/spot/:id" }
    ];
  }
};

export default withNextIntl(nextConfig);
