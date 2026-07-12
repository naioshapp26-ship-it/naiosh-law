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
};

export function BrandLogo({
  size = 48,
  showText = true,
  href,
  variant = "light",
  className = "",
  subtitle,
}: Props) {
  const textColor = variant === "light" ? "text-white" : "text-slate-900";
  const subColor = variant === "light" ? "text-red-100/90" : "text-slate-500";

  const content = (
    <div className={`flex items-center gap-3 min-w-0 ${className}`}>
      <div
        className="shrink-0 rounded-xl bg-white p-1 shadow-lg ring-1 ring-white/40"
        style={{ width: size, height: Math.round(size * 1.15) }}
      >
        <Image
          src={BRAND.logoPath}
          alt={BRAND.logoAlt}
          width={size}
          height={Math.round(size * 1.15)}
          priority
          className="object-contain w-full h-full"
        />
      </div>
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
