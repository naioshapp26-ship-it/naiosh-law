"use client";

import type { ReactNode } from "react";

export type PageLayoutProps = {
  children: ReactNode;
  /** Extra class names (e.g. hq-dashboard, erp-workspace) */
  className?: string;
  /** Optional data attribute for audits */
  pageId?: string;
  style?: React.CSSProperties;
};

/**
 * Central full-width layout for all internal NAIOSH LAW pages.
 * Fills the AppShell content column; no artificial max-width.
 */
export function PageLayout({ children, className, pageId, style }: PageLayoutProps) {
  return (
    <div
      className={["law-page", "erp-page", className].filter(Boolean).join(" ")}
      data-law-page="1"
      data-erp-page={pageId}
      style={{ width: "100%", maxWidth: "100%", boxSizing: "border-box", ...style }}
    >
      {children}
    </div>
  );
}
