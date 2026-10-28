/**
 * Evidence: public header link + public data-analysis page (not admin shell).
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/law-data-analysis-public";
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // 1) Public homepage — header must show the link (no admin login)
  await page.goto(`${BASE}/`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(1200);
  const headerLink = page.locator("header a, .top-nav a", {
    hasText: "نايوش لتحليل البيانات",
  }).first();
  await headerLink.waitFor({ state: "visible", timeout: 15000 });
  await page.screenshot({ path: path.join(OUT, "01-public-header-link.png"), fullPage: false });

  // 2) Open from public header (guest) — intro page, not /app shell
  await headerLink.click();
  await page.waitForURL(/\/data-analysis\/?$/, { timeout: 15000 });
  await page.waitForSelector("text=نايوش لتحليل البيانات", { timeout: 15000 });
  // Must NOT be inside admin AppShell sidebar
  const adminSidebar = await page.locator('aside, .erp-sidebar, [class*="sidebar"]').filter({
    hasText: "لوحة التحكم",
  }).count();
  const publicNav = await page.locator(".top-nav, header.top-nav").count();
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "02-public-data-analysis-page.png"), fullPage: false });

  // Mobile header still shows (menu may collapse — open toggle)
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const toggle = page.locator(".mobile-nav-toggle").first();
  if (await toggle.count()) await toggle.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "03-public-header-mobile.png"), fullPage: false });

  const summary = {
    ok: publicNav > 0,
    adminSidebarPresentOnPublicPage: adminSidebar > 0,
    url: page.url(),
  };
  // Re-check desktop URL after mobile nav
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/data-analysis`, { waitUntil: "domcontentloaded" });
  const finalUrl = page.url();
  const hasAppShellBrand = await page.locator("text=النظام القانوني الذكي").count();
  summary.ok = finalUrl.includes("/data-analysis") && !finalUrl.includes("/app/");
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify({ ...summary, finalUrl, hasAppShellBrand }, null, 2));
  console.log(JSON.stringify({ ...summary, finalUrl, hasAppShellBrand }, null, 2));

  await browser.close();
  if (!summary.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
