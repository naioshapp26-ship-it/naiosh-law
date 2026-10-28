import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Playwright / agents hitting the app via 127.0.0.1 in local/dev
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  images: {
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  experimental: {
    // بدون حد معلن للشعار/الصورة/الفيديو — ارفع سقف البروكسي لاستيعاب الملفات الكبيرة
    serverActions: {
      bodySizeLimit: "2gb",
    },
    proxyClientMaxBodySize: "2gb",
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
