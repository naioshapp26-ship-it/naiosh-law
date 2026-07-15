import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // فيديو/بنر الهيرو حتى 100MB — بدون هذا الحد البروكسي يقطع عند 10MB
    serverActions: {
      bodySizeLimit: "110mb",
    },
    proxyClientMaxBodySize: "110mb",
  },
  async redirects() {
    return [
      { source: "/app/cases", destination: "/app/modules/case-management", permanent: false },
      { source: "/app/clients", destination: "/app/modules/clients-management", permanent: false },
      { source: "/app/documents", destination: "/app/legal-library", permanent: false },
      { source: "/app/calendar", destination: "/app/modules/court-sessions", permanent: false },
      { source: "/app/billing", destination: "/app/legal-finance", permanent: false },
      { source: "/app/reports", destination: "/app/modules/reports-center", permanent: false },
      { source: "/app/settings", destination: "/app/modules/administration", permanent: false },
    ];
  },
};

export default nextConfig;
