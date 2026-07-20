"use client";

import { useLayoutEffect } from "react";

const STYLESHEETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css",
  "/newhome/styles.css?v=erp-copy-20260720b",
  "/newhome/homepage-premium.css?v=erp-copy-20260720b",
  "/newhome/dark-mode.css?v=erp-copy-20260720b",
  "/newhome/homepage-dark-fix.css?v=erp-copy-20260720b",
  "/newhome/mobile-header.css?v=erp-copy-20260720b",
];

/**
 * Loads NAIOSH ERP /newhome stylesheets and marks body as `.homepage`
 * so the landing chrome matches the ERP public homepage 1:1.
 */
export function ErpHomepageStyles() {
  useLayoutEffect(() => {
    document.body.classList.add("homepage");
    document.documentElement.classList.add("homepage-root");

    const created: HTMLLinkElement[] = [];
    STYLESHEETS.forEach((href) => {
      const id = `erp-home-${href.replace(/[^a-z0-9]+/gi, "-")}`;
      if (document.getElementById(id)) return;
      const link = document.createElement("link");
      link.id = id;
      link.rel = "stylesheet";
      link.href = href;
      document.head.appendChild(link);
      created.push(link);
    });

    return () => {
      document.body.classList.remove("homepage");
      document.documentElement.classList.remove("homepage-root");
      created.forEach((link) => link.remove());
    };
  }, []);

  return (
    <>
      {STYLESHEETS.map((href) => (
        <link key={href} rel="stylesheet" href={href} />
      ))}
      <style>{`
        body.homepage {
          font-family: var(--font-cairo), Cairo, Tajawal, sans-serif !important;
        }
        body.homepage .container-max {
          width: 100%;
          max-width: 1200px;
          margin-inline: auto;
          padding-inline: 20px;
        }
      `}</style>
    </>
  );
}
