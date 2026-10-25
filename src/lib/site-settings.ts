/** إعدادات الموقع الافتراضية — تُطبَّق عبر CSS variables */

import {
  BRAND_IDENTITY,
  GOLD_RGB,
  NAVY_RGB,
  isBrokenPrimary,
  isLegacyBrandRed,
  normalizeHex,
} from "@/lib/brand-identity";

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
  primaryColor: BRAND_IDENTITY.navyPrimary,
  primaryDark: BRAND_IDENTITY.navyDark,
  accentColor: BRAND_IDENTITY.antiqueGold,
  sidebarFrom: BRAND_IDENTITY.navyDark,
  sidebarVia: BRAND_IDENTITY.navyPrimary,
  sidebarTo: BRAND_IDENTITY.navySecondary,
  backgroundColor: BRAND_IDENTITY.ivoryBackground,
  textColor: BRAND_IDENTITY.primaryText,
  brandName: "NAIOSH Law",
  brandNameAr: "نايوش",
  tagline: "النظام القانوني السيادي 360",
  logoPath: "",
  logoData: null,
  heroBannerPath: "/newhome/media/legal-hero-desk.jpg",
  heroBannerData: null,
  heroMediaKind: "image",
  borderRadius: "12",
  secondaryColor: "#E8E0D0",
  buttonColor: BRAND_IDENTITY.navyPrimary,
  headerBgColor: BRAND_IDENTITY.navyDark,
  headingColor: BRAND_IDENTITY.primaryText,
  paragraphColor: BRAND_IDENTITY.secondaryText,
  linkColor: BRAND_IDENTITY.navySecondary,
  heroImageMode: "cover",
  heroActiveType: "image",
  heroOverlayStrength: 18,
  heroAutoplaySlider: true,
  heroActiveImageCaption: "مكتب قانوني فاخر — هوية نايوش",
  heroActiveVideoCaption: "",
  heroActiveVideoDescription: "",
};

function isUploadedOrLogoHeroPath(path: string | null | undefined): boolean {
  const p = String(path || "").trim().toLowerCase();
  if (!p) return true;
  if (p.includes("legal-hero-desk")) return false;
  if (p.includes("/api/site-settings/hero-banner")) return true;
  if (p.includes("/api/uploads/hero/") || p.includes("/uploads/hero/")) return true;
  if (p.includes("logo") || p.includes("naiosh-logo")) return true;
  return false;
}

/** ترقية إعدادات DB القديمة (أحمر/نبيتي/أسود/شعار كخلفية) إلى الهوية القانونية بدون migration */
export function upgradeLegacyBrandTheme(theme: SiteTheme): SiteTheme {
  const primaryBroken = isBrokenPrimary(theme.primaryColor);
  const sidebarIsLegacy = isLegacyBrandRed(theme.sidebarFrom) || isLegacyBrandRed(theme.sidebarVia);
  const headerIsLegacy = isLegacyBrandRed(theme.headerBgColor);
  const heroIsLogoOrUpload = isUploadedOrLogoHeroPath(theme.heroBannerPath) || Boolean(theme.heroBannerData?.trim());
  const headingBroken =
    normalizeHex(theme.headingColor) === "#0a0a12" ||
    normalizeHex(theme.headingColor) === "#0e0ef1" ||
    isLegacyBrandRed(theme.headingColor);

  return {
    ...theme,
    primaryColor: primaryBroken ? DEFAULT_SITE_THEME.primaryColor : theme.primaryColor,
    primaryDark:
      isLegacyBrandRed(theme.primaryDark) || isBrokenPrimary(theme.primaryDark)
        ? DEFAULT_SITE_THEME.primaryDark
        : theme.primaryDark,
    accentColor:
      isLegacyBrandRed(theme.accentColor) ||
      normalizeHex(theme.accentColor) === "#0ea5e9" ||
      !theme.accentColor
        ? DEFAULT_SITE_THEME.accentColor
        : theme.accentColor,
    sidebarFrom: sidebarIsLegacy || !theme.sidebarFrom ? DEFAULT_SITE_THEME.sidebarFrom : theme.sidebarFrom,
    sidebarVia: isLegacyBrandRed(theme.sidebarVia) || !theme.sidebarVia ? DEFAULT_SITE_THEME.sidebarVia : theme.sidebarVia,
    sidebarTo: isLegacyBrandRed(theme.sidebarTo) || !theme.sidebarTo ? DEFAULT_SITE_THEME.sidebarTo : theme.sidebarTo,
    backgroundColor:
      normalizeHex(theme.backgroundColor) === "#f8fafc" ||
      normalizeHex(theme.backgroundColor) === "#f4f7f6" ||
      normalizeHex(theme.backgroundColor) === "#ffffff" ||
      !theme.backgroundColor
        ? DEFAULT_SITE_THEME.backgroundColor
        : theme.backgroundColor,
    buttonColor:
      isLegacyBrandRed(theme.buttonColor) || isBrokenPrimary(theme.buttonColor)
        ? DEFAULT_SITE_THEME.buttonColor
        : theme.buttonColor,
    secondaryColor: isLegacyBrandRed(theme.secondaryColor)
      ? DEFAULT_SITE_THEME.secondaryColor
      : theme.secondaryColor,
    headerBgColor: headerIsLegacy || !theme.headerBgColor ? DEFAULT_SITE_THEME.headerBgColor : theme.headerBgColor,
    textColor:
      normalizeHex(theme.textColor) === "#0a0a12" || !theme.textColor
        ? DEFAULT_SITE_THEME.textColor
        : theme.textColor,
    headingColor: headingBroken ? DEFAULT_SITE_THEME.headingColor : theme.headingColor,
    paragraphColor:
      normalizeHex(theme.paragraphColor) === "#64748b" || !theme.paragraphColor
        ? DEFAULT_SITE_THEME.paragraphColor
        : theme.paragraphColor,
    /* Always prefer the approved legal desk hero — never the uploaded crest/logo */
    heroBannerPath: heroIsLogoOrUpload ? DEFAULT_SITE_THEME.heroBannerPath : theme.heroBannerPath || DEFAULT_SITE_THEME.heroBannerPath,
    heroBannerData: heroIsLogoOrUpload ? null : theme.heroBannerData,
    heroMediaKind: "image",
    heroImageMode: "cover",
    heroOverlayStrength:
      !theme.heroOverlayStrength || theme.heroOverlayStrength < 12
        ? DEFAULT_SITE_THEME.heroOverlayStrength
        : theme.heroOverlayStrength,
  };
}

export function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return null;
  const n = parseInt(clean, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

export function applySiteTheme(theme: SiteTheme) {
  if (typeof document === "undefined") return;
  const resolved = upgradeLegacyBrandTheme(theme);
  const root = document.documentElement;
  const rgb = hexToRgb(resolved.primaryColor);
  const gold = hexToRgb(resolved.accentColor);

  root.style.setProperty("--primary", resolved.primaryColor);
  root.style.setProperty("--primary-dark", resolved.primaryDark);
  root.style.setProperty("--accent", resolved.accentColor);
  root.style.setProperty("--sidebar-from", resolved.sidebarFrom);
  root.style.setProperty("--sidebar-via", resolved.sidebarVia);
  root.style.setProperty("--sidebar-to", resolved.sidebarTo);
  root.style.setProperty("--site-bg", resolved.backgroundColor);
  root.style.setProperty("--dark", resolved.textColor);
  root.style.setProperty("--radius-base", `${resolved.borderRadius}px`);
  root.style.setProperty("--secondary", resolved.secondaryColor);
  root.style.setProperty("--button-color", resolved.buttonColor);
  root.style.setProperty("--header-bg", resolved.headerBgColor);
  root.style.setProperty("--heading-color", resolved.headingColor);
  root.style.setProperty("--paragraph-color", resolved.paragraphColor);
  root.style.setProperty("--link-color", resolved.linkColor);

  // Bridge landing tokens (historically named --brand-red*)
  root.style.setProperty("--brand-red", resolved.primaryColor);
  root.style.setProperty("--brand-red-rgb", rgb ? `${rgb.r}, ${rgb.g}, ${rgb.b}` : NAVY_RGB);
  root.style.setProperty("--brand-red-soft", BRAND_IDENTITY.navySecondary);
  root.style.setProperty("--brand-red-dark", resolved.primaryDark);
  root.style.setProperty("--brand-red-mid", BRAND_IDENTITY.navySecondary);
  root.style.setProperty("--brand-red-deep", BRAND_IDENTITY.navyDark);
  root.style.setProperty("--brand-gold", resolved.accentColor);
  root.style.setProperty("--brand-gold-rgb", gold ? `${gold.r}, ${gold.g}, ${gold.b}` : GOLD_RGB);
  root.style.setProperty("--homepage-button-color", resolved.buttonColor);
  root.style.setProperty("--announcement-bg", resolved.primaryDark);
  root.style.setProperty(
    "--hero-custom-image",
    `url('${resolved.heroBannerPath || "/newhome/media/legal-hero-desk.jpg"}')`
  );

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
/** الشعار المدمج في public — يُستخدم كاحتياطي عند غياب/فشل الشعار المرفوع */
export const DEFAULT_PUBLIC_LOGO = "/naiosh-logo.png?v=full-crest-scales-20260721";

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
export const DEFAULT_HERO_IMAGE = "/newhome/media/legal-hero-desk.jpg";

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
  _cacheKey?: string | number | null
) {
  const resolved = upgradeLegacyBrandTheme({
    ...DEFAULT_SITE_THEME,
    heroBannerPath: theme.heroBannerPath,
    heroBannerData: theme.heroBannerData,
    heroMediaKind: theme.heroMediaKind,
  });
  // Approved legal desk only — never serve the uploaded crest/logo as hero media.
  return resolved.heroBannerPath || DEFAULT_HERO_IMAGE;
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
  const base: SiteTheme = {
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
    heroImageMode: row.heroImageMode === "cover" ? "cover" : "center",
    heroActiveType: row.heroActiveType === "video" ? "video" : "image",
    heroOverlayStrength: Number.isFinite(Number(row.heroOverlayStrength))
      ? Math.min(70, Math.max(0, Math.round(Number(row.heroOverlayStrength))))
      : DEFAULT_SITE_THEME.heroOverlayStrength,
    heroAutoplaySlider: row.heroAutoplaySlider !== false,
    heroActiveImageCaption: row.heroActiveImageCaption || "",
    heroActiveVideoCaption: row.heroActiveVideoCaption || "",
    heroActiveVideoDescription: row.heroActiveVideoDescription || "",
  };
  return upgradeLegacyBrandTheme(base);
}
