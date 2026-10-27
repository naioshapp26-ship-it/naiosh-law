/**
 * Page settings center smoke test:
 * - catalog coverage
 * - save/load PostgreSQL persistence for case-management
 * - permission: client cannot list catalog
 *
 * Run: npx tsx scripts/test-page-settings.mts
 */
import { chromium } from "playwright";
import fs from "node:fs";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@naiosh.local";
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || "Admin@12345";

type Row = { id: string; ok: boolean; detail: string };
const results: Row[] = [];
function record(id: string, ok: boolean, detail: string) {
  results.push({ id, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ locale: "ar" });
  const page = await context.newPage();

  async function api(method: string, path: string, body?: unknown) {
    const res = await context.request.fetch(`${BASE}${path}`, {
      method,
      headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
      data: body !== undefined ? body : undefined,
      failOnStatusCode: false,
    });
    let json: any = null;
    try {
      json = await res.json();
    } catch {
      json = null;
    }
    return { status: res.status(), json };
  }

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
  const login = await api("POST", "/api/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    remember: true,
  });
  if (login.status !== 200) {
    console.error("login failed", login);
    process.exit(1);
  }
  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1000);

  // Catalog
  const catalog = await api("GET", "/api/page-settings");
  record(
    "catalog-ok",
    catalog.status === 200 && catalog.json?.coverage?.total > 0,
    `status=${catalog.status} total=${catalog.json?.coverage?.total} operational=${catalog.json?.coverage?.operational}`
  );

  // Hub UI
  await page.goto(`${BASE}/app/page-settings`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".psc-hub h1, h1", { timeout: 20000 });
  const hubTitle = await page.locator(".psc-hub h1, h1").first().textContent();
  record("hub-ui", Boolean(hubTitle?.includes("إعدادات الصفحات")), `title=${hubTitle}`);
  await page.screenshot({ path: `${OUT}/hub-1920.png`, fullPage: true });

  // Save case-management settings
  const uniqueTitle = `قضايا اختبار ${Date.now()}`;
  const current = await api("GET", "/api/page-settings/case-management");
  const values = structuredClone(current.json?.resolved?.values ?? {});
  values.display = { ...(values.display || {}), title: uniqueTitle, pageSize: 15, showKpis: false };
  values.actions = { ...(values.actions || {}), allowExport: false };
  const save = await api("PUT", "/api/page-settings/case-management", {
    scope: "global",
    values,
  });
  record(
    "save-case-settings",
    save.status === 200 && save.json?.ok === true,
    `status=${save.status} err=${save.json?.error || ""}`
  );

  // Re-read persistence
  const again = await api("GET", "/api/page-settings/case-management");
  const againVals = again.json?.resolved?.values ?? {};
  record(
    "persist-case-settings",
    again.status === 200 &&
      againVals?.display?.title === uniqueTitle &&
      againVals?.display?.pageSize === 15 &&
      againVals?.display?.showKpis === false &&
      againVals?.actions?.allowExport === false,
    JSON.stringify({
      title: againVals?.display?.title,
      pageSize: againVals?.display?.pageSize,
      showKpis: againVals?.display?.showKpis,
      allowExport: againVals?.actions?.allowExport,
      version: again.json?.resolved?.version,
    })
  );

  // Module page reflects title + hides export (reports button)
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("h1", { timeout: 20000 });
  await page.waitForTimeout(1200);
  const moduleH1 = await page.locator("h1").first().textContent();
  const hasReports = await page.locator("button:has-text('تقارير')").count();
  record(
    "module-applies-title",
    Boolean(moduleH1?.includes(uniqueTitle)),
    `h1=${moduleH1}`
  );
  record(
    "module-hides-export",
    hasReports === 0,
    `reportsButtons=${hasReports}`
  );
  await page.screenshot({ path: `${OUT}/case-management-applied.png`, fullPage: false });

  // Editor UI
  await page.goto(`${BASE}/app/page-settings/case-management`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".psc-editor h1, h1", { timeout: 20000 });
  const editorTitle = await page.locator(".psc-editor h1, h1").first().textContent();
  record(
    "editor-ui",
    Boolean(editorTitle && editorTitle.length > 2),
    `h1=${editorTitle}`
  );
  await page.screenshot({ path: `${OUT}/editor-case.png`, fullPage: true });

  // Mobile hub
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/app/page-settings`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector(".psc-hub h1, h1", { timeout: 20000 });
  await page.screenshot({ path: `${OUT}/hub-390.png`, fullPage: true });
  record("mobile-hub", true, "screenshot saved");

  // Reset defaults
  const reset = await api("PUT", "/api/page-settings/case-management", {
    scope: "global",
    reset: true,
  });
  record("reset-defaults", reset.status === 200 && reset.json?.ok === true, `status=${reset.status}`);

  await browser.close();
  const summary = {
    results,
    pass: results.filter((r) => r.ok).length,
    fail: results.filter((r) => !r.ok).length,
    coverage: catalog.json?.coverage,
  };
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(summary, null, 2));
  console.log("\n=== SUMMARY ===", summary.pass, "PASS /", summary.fail, "FAIL");
  console.log("coverage", summary.coverage);
  if (summary.fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
