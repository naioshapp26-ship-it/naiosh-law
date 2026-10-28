/**
 * Mandatory caseNo verification + screenshots.
 * Cases covered: client with 0 / 1 / many cases; table order; settings lock; forms.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/mandatory-case-no";
mkdirSync(OUT, { recursive: true });

const results: Array<Record<string, unknown>> = [];
function check(name: string, ok: boolean, detail?: unknown) {
  results.push({ name, ok, detail });
  console.log(ok ? "PASS" : "FAIL", name, detail ?? "");
}

async function login(page: import("playwright").Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', "admin@naioshlaw.com");
  await page.fill('input[type="password"], input[name="password"]', "Admin@123");
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 20000 });
}

async function main() {
  // --- DB fixtures ---
  const solo = await prisma.client.upsert({
    where: { id: "case-no-test-solo" },
    update: { name: "موكل قضية واحدة", casesCount: 1 },
    create: {
      id: "case-no-test-solo",
      name: "موكل قضية واحدة",
      type: "فرد",
      phone: "512345678",
      phoneDialCode: "+966",
      country: "السعودية",
      city: "الرياض",
      status: "نشط",
      casesCount: 1,
    },
  });
  const multi = await prisma.client.upsert({
    where: { id: "case-no-test-multi" },
    update: { name: "موكل قضايا متعددة", casesCount: 2 },
    create: {
      id: "case-no-test-multi",
      name: "موكل قضايا متعددة",
      type: "فرد",
      phone: "512345679",
      phoneDialCode: "+966",
      country: "السعودية",
      city: "جدة",
      status: "نشط",
      casesCount: 2,
    },
  });
  const none = await prisma.client.upsert({
    where: { id: "case-no-test-none" },
    update: { name: "موكل بلا قضية", casesCount: 0 },
    create: {
      id: "case-no-test-none",
      name: "موكل بلا قضية",
      type: "فرد",
      phone: "512345680",
      phoneDialCode: "+966",
      country: "السعودية",
      city: "الدمام",
      status: "نشط",
      casesCount: 0,
    },
  });

  await prisma.case.deleteMany({
    where: { caseNo: { in: ["TEST-CASE-SOLO", "TEST-CASE-A", "TEST-CASE-B"] } },
  });
  const c1 = await prisma.case.create({
    data: {
      caseNo: "TEST-CASE-SOLO",
      clientId: solo.id,
      clientName: solo.name,
      type: "مدني",
      court: "محكمة الاختبار",
      status: "نشطة",
    },
  });
  const c2 = await prisma.case.create({
    data: {
      caseNo: "TEST-CASE-A",
      clientId: multi.id,
      clientName: multi.name,
      type: "تجاري",
      court: "محكمة الاختبار",
      status: "نشطة",
    },
  });
  const c3 = await prisma.case.create({
    data: {
      caseNo: "TEST-CASE-B",
      clientId: multi.id,
      clientName: multi.name,
      type: "عمالي",
      court: "محكمة الاختبار",
      status: "نشطة",
    },
  });
  void c1;
  void c2;
  void c3;
  void none;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);

  // Clients API shape
  const clientsRes = await page.request.get(`${BASE}/api/clients`);
  const clients = (await clientsRes.json()) as Array<Record<string, unknown>>;
  const soloRow = clients.find((r) => r.id === solo.id);
  const multiRow = clients.find((r) => r.id === multi.id);
  const noneRow = clients.find((r) => r.id === none.id);
  check("api-solo-one-case", Array.isArray(soloRow?.caseLinks) && (soloRow!.caseLinks as unknown[]).length === 1, soloRow?.caseNo);
  check(
    "api-multi-two-cases",
    Array.isArray(multiRow?.caseLinks) && (multiRow!.caseLinks as unknown[]).length === 2,
    multiRow?.caseNo
  );
  check("api-none-label", String(noneRow?.caseNo) === "لا توجد قضية مرتبطة", noneRow?.caseNo);

  // Page settings lock — try hide caseNo; server must re-add via lockedValues
  const put = await page.request.put(`${BASE}/api/page-settings/clients-management`, {
    data: {
      values: {
        display: { visibleColumns: ["name", "phone", "country", "city", "status"] },
      },
    },
  });
  check("settings-put-ok", put.ok(), put.status());
  const putBody = (await put.json()) as {
    resolved?: { values?: { display?: { visibleColumns?: string[] } } };
  };
  const afterCols = putBody.resolved?.values?.display?.visibleColumns ?? [];
  check("settings-caseNo-reforced", afterCols.includes("caseNo") && afterCols[0] === "caseNo", afterCols);

  // UI: clients
  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const clientHeaders = await page.locator("table thead th").allTextContents();
  check("ui-clients-caseNo-first", clientHeaders[0]?.includes("رقم القضية"), clientHeaders.slice(0, 3));
  check("ui-clients-none-label", await page.getByText("لا توجد قضية مرتبطة").count() > 0);
  check("ui-clients-multi-links", await page.getByRole("link", { name: "TEST-CASE-A" }).count() > 0);
  await page.screenshot({ path: `${OUT}/01-clients-table.png`, fullPage: false });

  // Add client form — no required caseNo
  await page.getByRole("button", { name: /إضافة موكل/ }).first().click();
  await page.waitForTimeout(500);
  const caseSelectInClient = await page.locator('select#modal-field-caseNo, select[id*="caseNo"]').count();
  check("form-client-no-case-select", caseSelectInClient === 0);
  await page.screenshot({ path: `${OUT}/02-clients-add-form.png`, fullPage: false });
  await page.keyboard.press("Escape");

  // Cases
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const caseHeaders = await page.locator("table thead th").allTextContents();
  check("ui-cases-caseNo-first", caseHeaders[0]?.includes("رقم القضية"), caseHeaders.slice(0, 3));
  check("ui-cases-real-numbers", await page.getByText("TEST-CASE-SOLO").count() > 0);
  await page.screenshot({ path: `${OUT}/03-cases-table.png`, fullPage: false });
  await page.getByRole("button", { name: /إضافة|قضية/ }).first().click();
  await page.waitForTimeout(600);
  check("form-cases-has-caseNo", await page.locator("#modal-field-caseNo, label:has-text('رقم القضية')").count() > 0);
  await page.screenshot({ path: `${OUT}/04-cases-add-form.png`, fullPage: false });
  await page.keyboard.press("Escape");

  // Sessions
  await page.goto(`${BASE}/app/modules/court-sessions`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const sessHeaders = await page.locator("table thead th").allTextContents();
  check("ui-sessions-caseNo-first", sessHeaders[0]?.includes("رقم القضية") || sessHeaders[0]?.includes("القضية"), sessHeaders.slice(0, 3));
  await page.screenshot({ path: `${OUT}/05-sessions-table.png`, fullPage: false });
  await page.getByRole("button", { name: /جدولة|إضافة|جلسة/ }).first().click();
  await page.waitForTimeout(800);
  const caseSelect = page.locator("select").filter({ has: page.locator("option", { hasText: "TEST-CASE" }) }).first();
  check("form-sessions-case-select", (await page.locator("select").count()) > 0 && (await page.getByText("رقم القضية").count()) > 0);
  await page.screenshot({ path: `${OUT}/06-sessions-add-form.png`, fullPage: false });
  // try save without case
  const beforeCount = await page.locator("table tbody tr").count();
  void beforeCount;
  void caseSelect;
  await page.keyboard.press("Escape");

  // Legal accounting
  await page.goto(`${BASE}/app/modules/legal-accounting`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  const finHeaders = await page.locator("table thead th").allTextContents();
  check("ui-accounting-caseNo-first", finHeaders[0]?.includes("رقم القضية"), finHeaders.slice(0, 3));
  await page.screenshot({ path: `${OUT}/07-accounting-table.png`, fullPage: false });
  await page.getByRole("button", { name: /إضافة|سجل/ }).first().click();
  await page.waitForTimeout(600);
  check("form-accounting-case", await page.getByText("رقم القضية").count() > 0);
  await page.screenshot({ path: `${OUT}/08-accounting-add-form.png`, fullPage: false });
  await page.keyboard.press("Escape");

  await browser.close();

  const failed = results.filter((r) => !r.ok);
  writeFileSync(`${OUT}/results.json`, JSON.stringify({ ok: failed.length === 0, results }, null, 2));
  console.log(JSON.stringify({ ok: failed.length === 0, failed: failed.length, total: results.length }, null, 2));
  if (failed.length) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
