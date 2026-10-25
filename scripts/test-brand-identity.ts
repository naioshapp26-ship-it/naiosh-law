/**
 * Verify legal navy/gold/ivory brand identity tokens and hero asset.
 * Run: npx tsx scripts/test-brand-identity.ts
 */
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { BRAND_IDENTITY, isLegacyBrandRed } from "../src/lib/brand-identity";
import {
  DEFAULT_HERO_IMAGE,
  DEFAULT_SITE_THEME,
  upgradeLegacyBrandTheme,
} from "../src/lib/site-settings";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

assert(BRAND_IDENTITY.navyPrimary === "#101D32", "navy primary mismatch");
assert(BRAND_IDENTITY.antiqueGold === "#B79A61", "gold mismatch");
assert(BRAND_IDENTITY.ivoryBackground === "#F5F1E8", "ivory mismatch");
assert(DEFAULT_SITE_THEME.primaryColor === "#101D32", "default theme primary");
assert(DEFAULT_SITE_THEME.accentColor === "#B79A61", "default theme gold");
assert(DEFAULT_SITE_THEME.backgroundColor === "#F5F1E8", "default theme ivory");
assert(DEFAULT_SITE_THEME.sidebarFrom === "#0B1424", "sidebar navy");
assert(DEFAULT_HERO_IMAGE.includes("legal-hero-desk.jpg"), "default hero path");
assert(existsSync(join("public", "newhome", "media", "legal-hero-desk.jpg")), "hero jpg missing");

const upgraded = upgradeLegacyBrandTheme({
  ...DEFAULT_SITE_THEME,
  primaryColor: "#c3152a",
  primaryDark: "#a00f20",
  sidebarFrom: "#450a0a",
  sidebarVia: "#7f1d1d",
  sidebarTo: "#450a0a",
  buttonColor: "#a00f20",
  secondaryColor: "#fecaca",
  accentColor: "#0ea5e9",
  backgroundColor: "#f8fafc",
  heroBannerPath: null,
  heroMediaKind: null,
});
assert(upgraded.primaryColor === "#101D32", "legacy primary not upgraded");
assert(upgraded.accentColor === "#B79A61", "legacy accent not upgraded");
assert(upgraded.sidebarFrom === "#0B1424", "legacy sidebar not upgraded");
assert(upgraded.heroBannerPath?.includes("legal-hero-desk"), "legacy hero path not filled");
assert(isLegacyBrandRed("#d70000"), "d70000 should be legacy");
assert(!isLegacyBrandRed("#101D32"), "navy should not be legacy");

const broken = upgradeLegacyBrandTheme({
  ...DEFAULT_SITE_THEME,
  primaryColor: "#000000",
  headerBgColor: "#250404",
  headingColor: "#0e0ef1",
  heroBannerPath: "/api/site-settings/hero-banner?v=1",
  heroBannerData: "data:image/jpeg;base64,xxx",
  heroOverlayStrength: 0,
});
assert(broken.primaryColor === "#101D32", "black primary not upgraded");
assert(broken.headerBgColor === "#0B1424", "burgundy header not upgraded");
assert(broken.headingColor === "#172338", "broken heading not upgraded");
assert(broken.heroBannerPath?.includes("legal-hero-desk"), "logo hero path not forced to desk");
assert(broken.heroBannerData == null, "logo hero data not cleared");

const styles = readFileSync("public/newhome/styles.css", "utf8");
assert(styles.includes("--brand-red: #101D32"), "landing brand token not navy");
assert(styles.includes("linear-gradient(135deg, #0B1424, #101D32, #1A304D)"), "hero gradient missing");
assert(styles.includes("legal-hero-desk.jpg"), "hero image token missing");

const globals = readFileSync("src/app/globals.css", "utf8");
assert(globals.includes("--primary: #101D32"), "globals primary");
assert(globals.includes("--site-bg: #F5F1E8"), "globals ivory");

const layout = readFileSync("src/app/layout.tsx", "utf8");
assert(layout.includes("identity-purge-20261026"), "layout cache bust missing");
assert(existsSync("public/newhome/legal-identity-overrides.css"), "identity overrides missing");

const dash = readFileSync("src/app/app/dashboard/page.tsx", "utf8");
assert(dash.includes("linear-gradient(135deg, #0B1424, #101D32, #1A304D)"), "dashboard banner not navy");
assert(!dash.includes("#1a0505"), "dashboard still has burgundy banner");

console.log("✅ brand identity verified");
console.log(`   palette: ${BRAND_IDENTITY.navyPrimary} · ${BRAND_IDENTITY.antiqueGold} · ${BRAND_IDENTITY.ivoryBackground}`);
console.log(`   hero: ${DEFAULT_HERO_IMAGE}`);
console.log("   legacy red upgrade: OK");
