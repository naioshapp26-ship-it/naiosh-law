"use client";

import { useLayoutEffect } from "react";
import { usePathname } from "next/navigation";

const STYLESHEETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "/newhome/styles.css?v=erp-copy-20260721-flashfix2",
  "/newhome/homepage-premium.css?v=erp-copy-20260721-flashfix2",
  "/newhome/dark-mode.css?v=erp-copy-20260721-flashfix2",
  "/newhome/homepage-dark-fix.css?v=erp-copy-20260721-flashfix2",
  "/newhome/mobile-header.css?v=erp-copy-20260721-flashfix2",
] as const;

function stylesheetId(href: string) {
  return `erp-home-${href.replace(/[^a-z0-9]+/gi, "-")}`;
}

/**
 * Backup injector: root layout already owns the <link>s, but Next head
 * reconciliation can still drop them on some client navigations — re-add ASAP.
 */
export function ensureErpHomepageStylesheets() {
  if (typeof document === "undefined") return;
  STYLESHEETS.forEach((href) => {
    if (document.querySelector(`link[data-erp-home][href="${href}"]`)) return;
    const id = stylesheetId(href);
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = href;
    link.setAttribute("data-erp-home", "1");
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
 * Stylesheets stay in layout <head>; this toggles body.homepage by pathname
 * and re-ensures links if Next drops them during soft nav.
 */
export function HomepageRouteChrome() {
  const pathname = usePathname();

  useLayoutEffect(() => {
    ensureErpHomepageStylesheets();
    const observer = new MutationObserver(() => {
      ensureErpHomepageStylesheets();
    });
    observer.observe(document.head, { childList: true });
    return () => observer.disconnect();
  }, []);

  useLayoutEffect(() => {
    ensureErpHomepageStylesheets();
    setHomepageMode(pathname === "/");
  }, [pathname]);

  return null;
}

export { STYLESHEETS as ERP_HOMEPAGE_STYLESHEETS };
