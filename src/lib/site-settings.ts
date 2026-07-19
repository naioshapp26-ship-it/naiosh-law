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
  heroBannerPath: string | null;
  heroBannerData: string | null;
  heroMediaKind: "image" | "video" | null;
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
  logoPath: "",
  logoData: null,
  heroBannerPath: null,
  heroBannerData: null,
  heroMediaKind: null,
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
  const data = theme.logoData?.trim() || null;
  if (data) {
    if (data.startsWith("data:")) return LOGO_SERVE_PATH;
    return data;
  }

  const path = theme.logoPath?.trim() || null;
  if (!path) return "";

  // المسار الثابت للشعار المخصص (رفع ملف / data قديم)
  if (path.startsWith(LOGO_SERVE_PATH) || path.startsWith("/api/uploads/logo/") || path.startsWith("/uploads/logo/")) {
    return path.startsWith(LOGO_SERVE_PATH) ? path : LOGO_SERVE_PATH;
  }

  // تجاهل الشعار الثابت القديم — حتى يستطيع المستخدم استبداله بحرية
  if (path === "/naiosh-logo.png" || path.split("?")[0] === "/naiosh-logo.png") {
    return "";
  }

  return path;
}

/** مسار ثابت لتقديم الشعار المخصص */
export const LOGO_SERVE_PATH = "/api/site-settings/logo";

export function logoCacheKey(updatedAt?: string | Date | null) {
  if (!updatedAt) return null;
  const t = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(updatedAt);
  return Number.isFinite(t) ? t : null;
}

export function logoPublicUrl(updatedAt?: string | Date | null) {
  const v = logoCacheKey(updatedAt);
  return v ? `${LOGO_SERVE_PATH}?v=${v}` : LOGO_SERVE_PATH;
}

export function hasCustomLogo(theme: Pick<SiteTheme, "logoPath" | "logoData">) {
  if (theme.logoData?.trim()) return true;
  const path = theme.logoPath?.trim() || "";
  if (!path) return false;
  if (path.startsWith(LOGO_SERVE_PATH) || path.startsWith("/api/uploads/logo/") || path.startsWith("/uploads/logo/")) {
    return true;
  }
  if (path === "/naiosh-logo.png" || path.split("?")[0] === "/naiosh-logo.png") return false;
  return true;
}

/** مسار ثابت لتقديم بنر الهيرو (ملف أو نسخة قاعدة البيانات) */
export const HERO_BANNER_SERVE_PATH = "/api/site-settings/hero-banner";

export function heroBannerCacheKey(updatedAt?: string | Date | null) {
  if (!updatedAt) return null;
  const t = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(updatedAt);
  return Number.isFinite(t) ? t : null;
}

/** رابط العرض الثابت لبنر الهيرو مع كسر للكاش بعد التحديث */
export function heroBannerPublicUrl(updatedAt?: string | Date | null) {
  const v = heroBannerCacheKey(updatedAt);
  return v ? `${HERO_BANNER_SERVE_PATH}?v=${v}` : HERO_BANNER_SERVE_PATH;
}

/** هل الإعدادات تحتوي وسائط هيرو محفوظة؟ */
export function hasHeroBannerMedia(
  theme: Pick<SiteTheme, "heroBannerPath" | "heroBannerData" | "heroMediaKind">
) {
  return Boolean(
    theme.heroBannerData?.trim() || theme.heroBannerPath?.trim() || theme.heroMediaKind
  );
}

/**
 * بنر الهيرو للعرض في الواجهة.
 * يفضّل المسار القصير/الثابت — لا يُمرَّر data URL الضخم إلى <img>.
 */
export function getHeroBannerSrc(
  theme: Pick<SiteTheme, "heroBannerPath" | "heroBannerData" | "heroMediaKind">,
  cacheKey?: string | number | null
) {
  const path = theme.heroBannerPath?.trim() || null;
  const data = theme.heroBannerData?.trim() || null;
  const version =
    cacheKey != null && String(cacheKey) ? `?v=${encodeURIComponent(String(cacheKey))}` : "";

  if (path) {
    if (path.startsWith(HERO_BANNER_SERVE_PATH)) return path;
    if (/^https?:\/\//i.test(path)) return path;
    // مسارات الرفع المحلية تُقدَّم عبر endpoint ثابت (مع رجوع لقاعدة البيانات)
    if (path.startsWith("/api/uploads/hero/") || path.startsWith("/uploads/hero/")) {
      return `${HERO_BANNER_SERVE_PATH}${version}`;
    }
    return path;
  }

  if (data) {
    // data URL تُخدم عبر المسار الثابت حتى لا تُحمَّل داخل JSON الواجهة
    if (data.startsWith("data:")) return `${HERO_BANNER_SERVE_PATH}${version}`;
    return data;
  }

  return null;
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
  heroBannerPath?: string | null;
  heroBannerData?: string | null;
  heroMediaKind?: string | null;
  borderRadius: string;
}): SiteTheme {
  const kind = row.heroMediaKind === "video" || row.heroMediaKind === "image" ? row.heroMediaKind : null;
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
    heroBannerPath: row.heroBannerPath ?? null,
    heroBannerData: row.heroBannerData ?? null,
    heroMediaKind: kind,
    borderRadius: row.borderRadius,
  };
}
