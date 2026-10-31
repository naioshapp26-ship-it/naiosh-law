"use client";

import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";
import { BRAND_IDENTITY } from "@/lib/brand-identity";

export type PageHeroProps = {
  /** Page title — always rendered in brand gold */
  title: string;
  /** Supporting description under the title */
  subtitle?: ReactNode;
  /** Small line above the title (eyebrow / breadcrumb / kicker) */
  eyebrow?: ReactNode;
  /** Footer meta line (e.g. welcome + date) */
  meta?: ReactNode;
  /** Emoji, FA icon, or custom node shown in the icon tile */
  icon?: ReactNode;
  /** When true, show the NAIOSH Law brand logo instead of icon */
  showLogo?: boolean;
  /** Optional page actions (settings, add, reports…) */
  actions?: ReactNode;
  /** Heading level for a11y */
  headingLevel?: "h1" | "h2";
  className?: string;
  children?: ReactNode;
};

/**
 * Central internal Page Hero — navy banner + gold title.
 * Used by every staff/ERP operational surface (not public marketing).
 */
export function PageHero({
  title,
  subtitle,
  eyebrow,
  meta,
  icon,
  showLogo = false,
  actions,
  headingLevel = "h1",
  className,
  children,
}: PageHeroProps) {
  const Heading = headingLevel;

  return (
    <header
      className={["page-hero", "hq-hero", className].filter(Boolean).join(" ")}
      data-page-hero="1"
      style={{
        // Inline fallbacks so first paint matches even if CSS sheet is late
        background: BRAND_IDENTITY.navyDark,
        backgroundImage: "linear-gradient(135deg, #0B1424, #101D32, #1A304D)",
        border: `1px solid rgba(183, 154, 97, 0.28)`,
        color: "#fff",
      }}
    >
      <div className="page-hero__glow page-hero__glow--tr" aria-hidden />
      <div className="page-hero__glow page-hero__glow--bl" aria-hidden />

      <div className="page-hero__inner">
        <div className="page-hero__main">
          {showLogo ? (
            <div className="page-hero__logo" aria-hidden>
              <BrandLogo size={60} showText={false} animated />
            </div>
          ) : icon ? (
            <div className="page-hero__icon" aria-hidden>
              {icon}
            </div>
          ) : null}

          <div className="page-hero__copy">
            {eyebrow ? <div className="page-hero__eyebrow">{eyebrow}</div> : null}
            <Heading className="page-hero__title">{title}</Heading>
            {subtitle ? <div className="page-hero__subtitle">{subtitle}</div> : null}
            {meta ? <div className="page-hero__meta">{meta}</div> : null}
            {children}
          </div>
        </div>

        {actions ? <div className="page-hero__actions">{actions}</div> : null}
      </div>
    </header>
  );
}
