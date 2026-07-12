/** إعدادات الموقع الافتراضية — تُطبَّق عبر CSS variables */

export type SiteTheme = {
  primaryColor: string;
  primaryDark: string;
  accentColor: string;
  sidebarFrom: string;
  sidebarVia: string;
  sidebarTo: string;
  backgroundColor: string;
  textColor: string;
  brandName: string;
  brandNameAr: string;
  tagline: string;
  logoPath: string;
  logoData: string | null;
  borderRadius: string;
};

export const DEFAULT_SITE_THEME: SiteTheme = {
  primaryColor: "#c3152a",
  primaryDark: "#a00f20",
  accentColor: "#0ea5e9",
  sidebarFrom: "#450a0a",
  sidebarVia: "#7f1d1d",
  sidebarTo: "#450a0a",
  backgroundColor: "#f8fafc",
  textColor: "#0a0a12",
  brandName: "NAIOSH Law",
  brandNameAr: "نايوش",
  tagline: "النظام القانوني السيادي 360",
  logoPath: "/naiosh-logo.png",
  logoData: null,
  borderRadius: "12",
};

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function applySiteTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const rgb = hexToRgb(theme.primaryColor);

  root.style.setProperty("--primary", theme.primaryColor);
  root.style.setProperty("--primary-dark", theme.primaryDark);
  root.style.setProperty("--accent", theme.accentColor);
  root.style.setProperty("--sidebar-from", theme.sidebarFrom);
  root.style.setProperty("--sidebar-via", theme.sidebarVia);
  root.style.setProperty("--sidebar-to", theme.sidebarTo);
  root.style.setProperty("--site-bg", theme.backgroundColor);
  root.style.setProperty("--dark", theme.textColor);
  root.style.setProperty("--radius-base", `${theme.borderRadius}px`);

  if (rgb) {
    root.style.setProperty("--primary-glow", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35)`);
    root.style.setProperty("--primary-soft", `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.08)`);
  }
}

export function getLogoSrc(theme: Pick<SiteTheme, "logoPath" | "logoData">) {
  return theme.logoData?.trim() || theme.logoPath || DEFAULT_SITE_THEME.logoPath;
}

export type SiteSettingsRecord = SiteTheme & {
  id: string;
  updatedBy: string | null;
  updatedAt: string;
};

export function recordToTheme(row: {
  primaryColor: string;
  primaryDark: string;
  accentColor: string;
  sidebarFrom: string;
  sidebarVia: string;
  sidebarTo: string;
  backgroundColor: string;
  textColor: string;
  brandName: string;
  brandNameAr: string;
  tagline: string;
  logoPath: string;
  logoData: string | null;
  borderRadius: string;
}): SiteTheme {
  return {
    primaryColor: row.primaryColor,
    primaryDark: row.primaryDark,
    accentColor: row.accentColor,
    sidebarFrom: row.sidebarFrom,
    sidebarVia: row.sidebarVia,
    sidebarTo: row.sidebarTo,
    backgroundColor: row.backgroundColor,
    textColor: row.textColor,
    brandName: row.brandName,
    brandNameAr: row.brandNameAr,
    tagline: row.tagline,
    logoPath: row.logoPath,
    logoData: row.logoData,
    borderRadius: row.borderRadius,
  };
}
