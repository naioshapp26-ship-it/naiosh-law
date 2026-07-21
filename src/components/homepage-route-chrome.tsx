"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const STYLESHEETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "/newhome/styles.css?v=erp-copy-20260721-flashfix",
  "/newhome/homepage-premium.css?v=erp-copy-20260721-flashfix",
  "/newhome/dark-mode.css?v=erp-copy-20260721-flashfix",
  "/newhome/homepage-dark-fix.css?v=erp-copy-20260721-flashfix",
  "/newhome/mobile-header.css?v=erp-copy-20260721-flashfix",
] as const;

function stylesheetId(href: string) {
  return `erp-home-${href.replace(/[^a-z0-9]+/gi, "-")}`;
}

/** Inject once and keep forever so client navigations never FOUC. */
export function ensureErpHomepageStylesheets() {
  if (typeof document === "undefined") return;
  STYLESHEETS.forEach((href) => {
    const id = stylesheetId(href);
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    document.head.appendChild(link);
  });
}

export function setHomepageMode(on: boolean) {
  if (typeof document === "undefined") return;
  document.body.classList.toggle("homepage", on);
  document.documentElement.classList.toggle("homepage-root", on);
  if (on) {
    // ThemeProvider / layout may leave inline colors — strip them so ERP CSS wins immediately.
    document.body.style.removeProperty("background");
    document.body.style.removeProperty("background-color");
    document.body.style.removeProperty("color");
    ensureErpHomepageStylesheets();
  }
}

/**
 * Keeps ERP homepage chrome stable across client navigations.
 * Stylesheets stay injected on every route (selectors are scoped to body.homepage),
 * so /login → / never waits on CSS reload.
 */
export function HomepageRouteChrome() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    // Always re-ensure: Next head reconciliation can drop manually added <link>s on nav.
    ensureErpHomepageStylesheets();
    setHomepageMode(pathname === "/");
  }, [pathname]);

  return null;
}

export { STYLESHEETS as ERP_HOMEPAGE_STYLESHEETS };
