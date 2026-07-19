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

  const imgStyle: React.CSSProperties = {
    width: dimension,
    height: dimension,
    objectFit: "contain",
    filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))",
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
        background: variant === "light" ? "rgba(255,255,255,0.14)" : "rgba(195,21,42,0.1)",
        border: variant === "light" ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(195,21,42,0.2)",
        display: "grid",
        placeItems: "center",
        color: variant === "light" ? "#fff" : "#c3152a",
        fontWeight: 900,
        fontSize: Math.max(12, dimension * 0.34),
        fontFamily: "var(--font-cairo)",
      }}
      aria-label={BRAND.logoAlt}
    >
      {(displayName || "N").trim().charAt(0)}
    </div>
  );

  const img = !hasLogo ? (
    placeholder
  ) : isDataUrl || isRemoteApi ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={resolvedSrc}
      src={resolvedSrc}
      alt={BRAND.logoAlt}
      className={`shrink-0 ${animated ? "logo-float" : ""}`}
      style={imgStyle}
      onError={onImgError}
    />
  ) : (
    <Image
      key={resolvedSrc}
      src={resolvedSrc}
      alt={BRAND.logoAlt}
      width={dimension}
      height={dimension}
      priority
      unoptimized
      className={`shrink-0 ${animated ? "logo-float" : ""}`}
      style={imgStyle}
      onError={onImgError}
    />
  );

  const content = (
    <div className={`flex items-center gap-2.5 min-w-0 ${className}`} style={{ maxWidth: "100%" }}>
      {img}
      {showText && (
        <div className="min-w-0 leading-tight" style={{ maxWidth: "100%" }}>
          <p className={`font-black text-sm truncate tracking-tight ${textColor}`}>{displayName}</p>
          {displaySubtitle && (
            <p className={`text-[10px] truncate mt-0.5 ${subColor}`}>{displaySubtitle}</p>
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
