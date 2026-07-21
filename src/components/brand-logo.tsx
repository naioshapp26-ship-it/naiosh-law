"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import { useSiteTheme } from "@/components/theme-provider";
import { DEFAULT_PUBLIC_LOGO } from "@/lib/site-settings";

type Props = {
  size?: number;
  showText?: boolean;
  href?: string;
  variant?: "light" | "dark";
  className?: string;
  subtitle?: string;
  animated?: boolean;
};

export function BrandLogo({
  size = 56,
  showText = true,
  href,
  variant = "light",
  className = "",
  subtitle,
  animated = false,
}: Props) {
  const { theme, logoSrc } = useSiteTheme();
  const displayName = theme.brandName || BRAND.name;
  const displaySubtitle = subtitle ?? theme.tagline ?? BRAND.tagline;
  const textColor = variant === "light" ? "text-white" : "text-slate-900";
  const subColor = variant === "light" ? "text-white/80" : "text-slate-500";
  const dimension = size;
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc =
    failedSrc && logoSrc === failedSrc
      ? DEFAULT_PUBLIC_LOGO
      : logoSrc?.trim() || DEFAULT_PUBLIC_LOGO;
  const hasLogo = Boolean(resolvedSrc);
  const isDataUrl = hasLogo && resolvedSrc.startsWith("data:");
  const isRemoteApi = hasLogo && (resolvedSrc.startsWith("/api/") || resolvedSrc.startsWith("http"));

  const onDarkChrome = variant === "light";
  const pad = Math.max(4, Math.round(dimension * 0.08));
  const inner = Math.max(20, dimension - pad * 2);

  const imgStyle: React.CSSProperties = {
    width: inner,
    height: inner,
    objectFit: "contain",
    objectPosition: "center",
    display: "block",
    filter: onDarkChrome
      ? "drop-shadow(0 1px 2px rgba(0,0,0,0.18))"
      : "drop-shadow(0 4px 12px rgba(0,0,0,0.22))",
  };

  const frameStyle: React.CSSProperties = onDarkChrome
    ? {
        width: dimension,
        height: dimension,
        borderRadius: Math.max(10, Math.round(dimension * 0.22)),
        background: "linear-gradient(160deg, #ffffff 0%, #f8fafc 55%, #f1f5f9 100%)",
        border: "1px solid rgba(255,255,255,0.95)",
        boxShadow: "0 6px 18px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.95)",
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
        overflow: "hidden",
        padding: pad,
      }
    : {
        width: dimension,
        height: dimension,
        display: "grid",
        placeItems: "center",
        flexShrink: 0,
      };

  const onImgError = () => {
    if (resolvedSrc !== DEFAULT_PUBLIC_LOGO) setFailedSrc(logoSrc || resolvedSrc);
  };

  const placeholder = (
    <div
      className={`shrink-0 ${animated ? "logo-float" : ""}`}
      style={{
        width: dimension,
        height: dimension,
        borderRadius: "14px",
        background: onDarkChrome ? "#ffffff" : "rgba(195,21,42,0.1)",
        border: onDarkChrome ? "1px solid rgba(255,255,255,0.95)" : "1px solid rgba(195,21,42,0.2)",
        display: "grid",
        placeItems: "center",
        color: onDarkChrome ? "#c3152a" : "#c3152a",
        fontWeight: 900,
        fontSize: Math.max(12, dimension * 0.34),
        fontFamily: "var(--font-cairo)",
      }}
      aria-label={BRAND.logoAlt}
    >
      {(displayName || "N").trim().charAt(0)}
    </div>
  );

  const logoImage = !hasLogo ? null : isDataUrl || isRemoteApi ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={resolvedSrc}
      src={resolvedSrc}
      alt={BRAND.logoAlt}
      style={imgStyle}
      onError={onImgError}
    />
  ) : (
    <Image
      key={resolvedSrc}
      src={resolvedSrc}
      alt={BRAND.logoAlt}
      width={inner}
      height={inner}
      priority
      unoptimized
      style={imgStyle}
      onError={onImgError}
    />
  );

  const img = !hasLogo ? (
    placeholder
  ) : (
    <div className={`shrink-0 ${animated ? "logo-float" : ""}`} style={frameStyle}>
      {logoImage}
    </div>
  );

  const content = (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`} style={{ maxWidth: "100%" }}>
      {img}
      {showText && (
        <div className="min-w-0 leading-tight" style={{ maxWidth: "100%" }}>
          <p
            className={`font-black text-sm truncate tracking-tight ${textColor}`}
            style={onDarkChrome ? { color: "#ffffff" } : undefined}
          >
            {displayName}
          </p>
          {displaySubtitle && (
            <p
              className={`text-[10px] truncate mt-0.5 ${subColor}`}
              style={onDarkChrome ? { color: "rgba(255,255,255,0.88)" } : undefined}
            >
              {displaySubtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block min-w-0 max-w-full hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
