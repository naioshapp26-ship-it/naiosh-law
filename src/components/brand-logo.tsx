"use client";

import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";
import { useSiteTheme } from "@/components/theme-provider";

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
  const height = Math.round(size * 1.2);
  const isDataUrl = logoSrc.startsWith("data:");

  const img = isDataUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={logoSrc}
      alt={BRAND.logoAlt}
      className={`object-contain shrink-0 ${animated ? "logo-float" : ""}`}
      style={{
        width: size,
        height: height,
        filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))",
      }}
    />
  ) : (
    <Image
      src={logoSrc}
      alt={BRAND.logoAlt}
      width={size}
      height={height}
      priority
      unoptimized
      className={`object-contain shrink-0 ${animated ? "logo-float" : ""}`}
      style={{
        width: size,
        height: height,
        filter: "drop-shadow(0 6px 18px rgba(0,0,0,0.35))",
      }}
    />
  );

  const content = (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      {img}
      {showText && (
        <div className="min-w-0 leading-tight flex-1">
          <p className={`font-black text-base truncate tracking-tight ${textColor}`}>{displayName}</p>
          {displaySubtitle && (
            <p className={`text-[10px] truncate mt-0.5 ${subColor}`}>{displaySubtitle}</p>
          )}
        </div>
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block hover:opacity-95 transition-opacity">
        {content}
      </Link>
    );
  }

  return content;
}
