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
  secondaryColor: string;
  buttonColor: string;
  headerBgColor: string;
  headingColor: string;
  paragraphColor: string;
  linkColor: string;
  heroImageMode: "cover" | "center";
  heroActiveType: "image" | "video";
  heroOverlayStrength: number;
  heroAutoplaySlider: boolean;
  heroActiveImageCaption: string;
  heroActiveVideoCaption: string;
  heroActiveVideoDescription: string;
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
  secondaryColor: "#fecaca",
  buttonColor: "#a00f20",
  headerBgColor: "#ffffff",
  headingColor: "#0a0a12",
  paragraphColor: "#64748b",
  linkColor: "#1e3a8a",
  heroImageMode: "cover",
  heroActiveType: "image",
  heroOverlayStrength: 62,
  heroAutoplaySlider: true,
  heroActiveImageCaption: "",
  heroActiveVideoCaption: "",
  heroActiveVideoDescription: "",
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
  root.style.setProperty("--secondary", theme.secondaryColor);
  root.style.setProperty("--button-color", theme.buttonColor);
  root.style.setProperty("--header-bg", theme.headerBgColor);
  root.style.setProperty("--heading-color", theme.headingColor);
  root.style.setProperty("--paragraph-color", theme.paragraphColor);
  root.style.setProperty("--link-color", theme.linkColor);

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

  if (path.startsWith(LOGO_SERVE_PATH) || path.startsWith("/api/uploads/logo/") || path.startsWith("/uploads/logo/")) {
    return path.startsWith(LOGO_SERVE_PATH) ? path : LOGO_SERVE_PATH;
  }

  if (path === "/naiosh-logo.png" || path.split("?")[0] === "/naiosh-logo.png") {
    return "";
  }

  return path;
}

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

export const HERO_BANNER_SERVE_PATH = "/api/site-settings/hero-banner";

export function heroBannerCacheKey(updatedAt?: string | Date | null) {
  if (!updatedAt) return null;
  const t = updatedAt instanceof Date ? updatedAt.getTime() : Date.parse(updatedAt);
  return Number.isFinite(t) ? t : null;
}

export function heroBannerPublicUrl(updatedAt?: string | Date | null) {
  const v = heroBannerCacheKey(updatedAt);
  return v ? `${HERO_BANNER_SERVE_PATH}?v=${v}` : HERO_BANNER_SERVE_PATH;
}

export function hasHeroBannerMedia(
  theme: Pick<SiteTheme, "heroBannerPath" | "heroBannerData" | "heroMediaKind">
) {
  return Boolean(
    theme.heroBannerData?.trim() || theme.heroBannerPath?.trim() || theme.heroMediaKind
  );
}

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
    if (path.startsWith("/api/uploads/hero/") || path.startsWith("/uploads/hero/")) {
      return `${HERO_BANNER_SERVE_PATH}${version}`;
    }
    return path;
  }

  if (data) {
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
  secondaryColor?: string | null;
  buttonColor?: string | null;
  headerBgColor?: string | null;
  headingColor?: string | null;
  paragraphColor?: string | null;
  linkColor?: string | null;
  heroImageMode?: string | null;
  heroActiveType?: string | null;
  heroOverlayStrength?: number | null;
  heroAutoplaySlider?: boolean | null;
  heroActiveImageCaption?: string | null;
  heroActiveVideoCaption?: string | null;
  heroActiveVideoDescription?: string | null;
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
    secondaryColor: row.secondaryColor || DEFAULT_SITE_THEME.secondaryColor,
    buttonColor: row.buttonColor || DEFAULT_SITE_THEME.buttonColor,
    headerBgColor: row.headerBgColor || DEFAULT_SITE_THEME.headerBgColor,
    headingColor: row.headingColor || DEFAULT_SITE_THEME.headingColor,
    paragraphColor: row.paragraphColor || DEFAULT_SITE_THEME.paragraphColor,
    linkColor: row.linkColor || DEFAULT_SITE_THEME.linkColor,
    heroImageMode: row.heroImageMode === "center" ? "center" : "cover",
    heroActiveType: row.heroActiveType === "video" ? "video" : "image",
    heroOverlayStrength: Number.isFinite(Number(row.heroOverlayStrength))
      ? Number(row.heroOverlayStrength)
      : DEFAULT_SITE_THEME.heroOverlayStrength,
    heroAutoplaySlider: row.heroAutoplaySlider !== false,
    heroActiveImageCaption: row.heroActiveImageCaption || "",
    heroActiveVideoCaption: row.heroActiveVideoCaption || "",
    heroActiveVideoDescription: row.heroActiveVideoDescription || "",
  };
}
