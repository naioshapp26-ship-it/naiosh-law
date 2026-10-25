/**
 * هوية NAIOSH Law القانونية المعتمدة:
 * كحلي قضائي + ذهبي معتّق + عاجي
 */
export const BRAND_IDENTITY = {
  navyPrimary: "#101D32",
  navyDark: "#0B1424",
  navySecondary: "#1A304D",
  antiqueGold: "#B79A61",
  ivoryBackground: "#F5F1E8",
  whiteSurface: "#FFFFFF",
  primaryText: "#172338",
  secondaryText: "#526071",
  border: "#D9DEE5",
  /** Functional — do not use as brand chrome */
  danger: "#DC2626",
  success: "#16A34A",
  warning: "#EA580C",
} as const;

export const NAVY_RGB = "16, 29, 50";
export const GOLD_RGB = "183, 154, 97";

/** Old brand hexes that should be auto-upgraded to the legal palette */
export const LEGACY_BRAND_REDS = new Set(
  [
    "#c3152a",
    "#d70000",
    "#b91c1c",
    "#a00f20",
    "#8b0000",
    "#450a0a",
    "#7f1d1d",
    "#991b1b",
    "#fecaca",
    "#e50914",
    "#ff0000",
    "#c50712",
  ].map((h) => h.toLowerCase())
);

export function normalizeHex(hex: string): string {
  const t = String(hex || "").trim().toLowerCase();
  if (/^#[0-9a-f]{6}$/.test(t)) return t;
  if (/^#[0-9a-f]{3}$/.test(t)) {
    return `#${t[1]}${t[1]}${t[2]}${t[2]}${t[3]}${t[3]}`;
  }
  return t;
}

export function isLegacyBrandRed(hex: string): boolean {
  return LEGACY_BRAND_REDS.has(normalizeHex(hex));
}
