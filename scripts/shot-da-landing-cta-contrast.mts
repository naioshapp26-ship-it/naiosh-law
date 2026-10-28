import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/da-landing-cta-contrast";
fs.mkdirSync(OUT, { recursive: true });

async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  await page.goto(`${BASE}/data-analysis`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForSelector("#da-law-hero-title", { timeout: 15000 });
  await page.waitForTimeout(700);

  const titleColor = await page.locator("#da-law-hero-title").evaluate((el) => {
    const s = getComputedStyle(el);
    return { color: s.color, fill: (s as CSSStyleDeclaration).webkitTextFillColor };
  });
  const leadColor = await page.locator(".da-law-hero__lead").evaluate((el) => getComputedStyle(el).color);

  const start = page.locator('a.da-law-btn.primary', { hasText: "ابدأ التحليل" }).first();
  const login = page.locator("a.da-law-btn", { hasText: "تسجيل الدخول إلى نظام التحليل" }).first();
  const startHref = await start.getAttribute("href");
  const loginHref = await login.getAttribute("href");

  await page.screenshot({ path: path.join(OUT, "01-desktop-after-contrast.png"), fullPage: false });

  // Mobile
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "02-mobile-after-contrast.png"), fullPage: false });

  // Dark mode if toggle exists
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/data-analysis`, { waitUntil: "networkidle" });
  const toggle = page.locator('button[aria-label*="ليل"], button[aria-label*="وضع"], .dark-mode-toggle, [data-theme-toggle]').first();
  if (await toggle.count()) {
    await toggle.click().catch(() => null);
    await page.waitForTimeout(500);
  } else {
    await page.evaluate(() => document.body.classList.add("dark-mode"));
    await page.waitForTimeout(300);
  }
  await page.screenshot({ path: path.join(OUT, "03-dark-mode-hero.png"), fullPage: false });

  const titleDark = await page.locator("#da-law-hero-title").evaluate((el) => getComputedStyle(el).color);

  const summary = {
    ok:
      startHref === "https://www.naioshai.com/" &&
      (loginHref === "https://www.naioshai.com/#login" || loginHref === "https://www.naioshai.com/") &&
      !startHref.includes("/app/") &&
      !loginHref?.includes("/app/"),
    startHref,
    loginHref,
    titleColor,
    leadColor,
    titleDark,
  };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  await browser.close();
  if (!summary.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
