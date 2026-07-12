import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
