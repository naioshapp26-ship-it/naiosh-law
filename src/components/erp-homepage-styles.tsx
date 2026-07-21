"use client";

import { useLayoutEffect } from "react";
import {
  ensureErpHomepageStylesheets,
  setHomepageMode,
} from "@/components/homepage-route-chrome";

/**
 * Landing-only helper: ensure homepage class + persistent ERP stylesheets.
 * Stylesheets are injected once into <head> and never removed, so returning
 * from /login does not flash an unstyled / wrongly themed page.
 */
export function ErpHomepageStyles() {
  useLayoutEffect(() => {
    ensureErpHomepageStylesheets();
    setHomepageMode(true);
  }, []);

  return (
    <style>{`
      body.homepage {
        font-family: var(--font-cairo), Cairo, Tajawal, sans-serif !important;
        background: #ffffff !important;
        color: #0f172a !important;
      }
      body.homepage .container-max {
        width: 100%;
        max-width: 1200px;
        margin-inline: auto;
        padding-inline: 20px;
      }
    `}</style>
  );
}
