import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/brand";

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
  const textColor = variant === "light" ? "text-white" : "text-slate-900";
  const subColor = variant === "light" ? "text-red-100/90" : "text-slate-500";
  const height = Math.round(size * 1.2);

  const img = (
    <Image
      src={BRAND.logoPath}
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
        <div className="min-w-0 leading-tight">
          <p className={`font-black text-sm sm:text-base truncate ${textColor}`}>{BRAND.name}</p>
          <p className={`text-[10px] sm:text-[11px] truncate ${subColor}`}>
            {subtitle ?? BRAND.tagline}
          </p>
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
