"use client";

import { useEffect } from "react";
import { Navbar } from "@/components/navbar";
import { LandingPromoBar } from "@/components/landing-promo-bar";
import { ensureErpHomepageStylesheets, setHomepageMode } from "@/components/homepage-route-chrome";

const LANDING_SHARED_HREF = "/newhome/landing-shared.css?v=data-analysis-public-20261028a";
const DA_CSS = "/erp-app/data-analysis-law.css?v=law-da-cta-contrast-20261028b";

export function DataAnalysisPublicShell({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    ensureErpHomepageStylesheets();
    setHomepageMode(true);

    if (!document.querySelector(`link[href="${LANDING_SHARED_HREF}"]`)) {
      const link = document.createElement("link");
      link.rel = "stylesheet";
      link.href = LANDING_SHARED_HREF;
      link.setAttribute("data-erp-home", "1");
      document.head.appendChild(link);
    }
    if (!document.querySelector('link[data-da-law-css]')) {
      const da = document.createElement("link");
      da.rel = "stylesheet";
      da.href = DA_CSS;
      da.setAttribute("data-da-law-css", "1");
      document.head.appendChild(da);
    }
  }, []);

  return (
    <>
      <LandingPromoBar />
      <Navbar variant="landing" />
      <main
        className="container da-law-public-main"
        id="landing-hub-root"
        style={{ paddingTop: 28, paddingBottom: 48 }}
      >
        {children}
      </main>
    </>
  );
}
