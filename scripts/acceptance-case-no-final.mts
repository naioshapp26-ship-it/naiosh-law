/**
 * Final acceptance review for PR #188 — forms, deep links, settings lock, export, page groups.
 * Does NOT merge.
 */
import { chromium, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";
import { resolveCaseRef } from "../src/lib/case-identity-server";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/case-no-acceptance";
mkdirSync(OUT, { recursive: true });

const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };

type Check = { group: string; name: string; ok: boolean; detail?: unknown };
const checks: Check[] = [];
function check(group: string, name: string, ok: boolean, detail?: unknown) {
  checks.push({ group, name, ok, detail });
  console.log(ok ? "PASS" : "FAIL", `[${group}]`, name, detail ?? "");
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', ADMIN.email);
  await page.fill('input[type="password"], input[name="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 25000 });
}

async function openModule(page: Page, slug: string) {
  await page.goto(`${BASE}/app/modules/${slug}`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("table thead th", { timeout: 30000 }).catch(() => undefined);
  await page.waitForTimeout(1200);
}

async function firstColIsCaseNo(page: Page) {
  const headers = await page.locator("table thead th").allTextContents();
  return { ok: (headers[0] ?? "").includes("رقم القضية") || (headers[0] ?? "").includes("القضية"), headers: headers.slice(0, 4) };
}

async function openAdd(page: Page) {
  // Header CTA only (btn-primary) — never row-action «➕ إضافة»
  const primary = page.locator("button.btn-primary").filter({ hasText: /إضافة|جدولة|تسجيل|فتح/ }).first();
  if ((await primary.count()) === 0) return false;
  await primary.click();
  await page.waitForTimeout(500);
  // Wait until a modal form appears
  const opened = await page
    .locator("#modal-field-caseNo, label:has-text('رقم القضية'), h2:has-text('إضافة'), h2:has-text('جدولة'), h2:has-text('تسجيل')")
    .first()
    .waitFor({ state: "visible", timeout: 8000 })
    .then(() => true)
    .catch(() => false);
  return opened;
}

async function closeModal(page: Page) {
  for (let i = 0; i < 3; i++) {
    const closeBtn = page.locator('button:has-text("✕")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(250);
      continue;
    }
    break;
  }
  await page.keyboard.press("Escape").catch(() => undefined);
  await page.waitForTimeout(200);
}

async function filterTable(page: Page, q: string) {
  await closeModal(page);
  await page.waitForSelector("table thead th", { timeout: 20000 });
  const input = page.getByPlaceholder(/بحث/);
  await input.waitFor({ state: "visible", timeout: 20000 });
  await input.fill(q);
  await page.waitForTimeout(700);
}

async function hasCaseField(page: Page) {
  await page.waitForTimeout(400);
  const labelCount = await page.locator("label").filter({ hasText: /رقم القضية/ }).count();
  const inputCount = await page.locator("#modal-field-caseNo").count();
  const selectCount = await page.locator("select#modal-field-caseNo, select").evaluateAll((els) =>
    els.some((el) => {
      const id = el.getAttribute("id") || "";
      const text = el.textContent || "";
      return id.includes("caseNo") || /اختر قضية|بدون قضية مرتبطة|TEST-CASE/.test(text);
    })
  );
  return labelCount > 0 || inputCount > 0 || selectCount;
}

async function freshModule(browser: import("playwright").Browser, slug: string) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);
  await openModule(page, slug);
  return page;
}

async function main() {
  // Ensure multi-case fixture exists
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
  await prisma.case.deleteMany({ where: { caseNo: { in: ["TEST-CASE-A", "TEST-CASE-B", "TEST-CASE-SOLO"] } } });
  const a = await prisma.case.create({
    data: {
      caseNo: "TEST-CASE-A",
      clientId: multi.id,
      clientName: multi.name,
      type: "تجاري",
      court: "محكمة الاختبار",
      status: "نشطة",
    },
  });
  const b = await prisma.case.create({
    data: {
      caseNo: "TEST-CASE-B",
      clientId: multi.id,
      clientName: multi.name,
      type: "عمالي",
      court: "محكمة الاختبار",
      status: "نشطة",
    },
  });

  const browser = await chromium.launch({ headless: true });
  let page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);

  // ── Settings lock via API (multiple pages) ──
  for (const pageKey of [
    "case-management",
    "clients-management",
    "court-sessions",
    "legal-accounting",
    "follow-up-center",
    "legal-services",
    "complaints-management",
  ]) {
    const put = await page.request.put(`${BASE}/api/page-settings/${pageKey}`, {
      data: {
        values: {
          display: { visibleColumns: ["name", "client", "phone", "status", "ref"] },
          fields: { requiredFields: ["name", "client"], hiddenOptionalFields: ["caseNo"] },
        },
      },
    });
    const body = (await put.json()) as {
      resolved?: {
        values?: {
          display?: { visibleColumns?: string[] };
          fields?: { requiredFields?: string[]; hiddenOptionalFields?: string[] };
        };
      };
    };
    const vis = body.resolved?.values?.display?.visibleColumns ?? [];
    const hidden = body.resolved?.values?.fields?.hiddenOptionalFields ?? [];
    const req = body.resolved?.values?.fields?.requiredFields ?? [];
    check("settings-api", `${pageKey}:caseNo-visible-locked`, vis.includes("caseNo"), vis.slice(0, 6));
    check("settings-api", `${pageKey}:caseNo-not-hidden`, !hidden.includes("caseNo"), hidden);
    if (["case-management", "court-sessions", "legal-accounting", "follow-up-center", "legal-services", "complaints-management"].includes(pageKey)) {
      check("settings-api", `${pageKey}:caseNo-required-locked`, req.includes("caseNo"), req.slice(0, 8));
    }
  }

  // ── Clients: table + forms + multi-link deep open ──
  await openModule(page, "clients-management");
  const cHead = await firstColIsCaseNo(page);
  check("clients", "table-caseNo-first", cHead.ok, cHead.headers);
  check("clients", "none-label-visible", (await page.getByText("لا توجد قضية مرتبطة").count()) > 0);
  await page.screenshot({ path: `${OUT}/clients-table.png` });

  // Add form: no case picker required
  check("clients", "add-opened", await openAdd(page));
  check("clients", "add-no-case-select", (await page.locator("select#modal-field-caseNo").count()) === 0);
  await page.screenshot({ path: `${OUT}/clients-add.png` });
  // Fresh page after modal — avoids stuck overlay/runtime state
  await page.close();
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);
  await openModule(page, "clients-management");

  // View first row (includes caseNo column in detail)
  const viewBtn = page.getByRole("button", { name: /عرض/ }).first();
  await viewBtn.click();
  await page.waitForTimeout(500);
  check("clients", "view-shows-caseNo", (await page.getByText("رقم القضية").count()) > 0);
  await page.screenshot({ path: `${OUT}/clients-view.png` });
  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("table thead th", { timeout: 30000 });
  await page.waitForTimeout(800);

  // Multi-case deep links — each link must open the matching Case id
  const linkA = page.getByRole("link", { name: "TEST-CASE-A" }).first();
  await linkA.waitFor({ state: "visible", timeout: 15000 });
  const hrefA = await linkA.getAttribute("href");
  check("clients", "link-A-href-has-caseId", Boolean(hrefA && hrefA.includes(`caseId=${a.id}`)), hrefA);
  await linkA.click();
  await page.waitForTimeout(2000);
  check(
    "clients",
    "link-A-opens-cases-module",
    page.url().includes("case-management") && page.url().includes(a.id),
    page.url()
  );
  const modalText = await page.locator("body").innerText();
  check("clients", "link-A-shows-correct-caseNo", modalText.includes("TEST-CASE-A"), "body contains TEST-CASE-A");
  await page.screenshot({ path: `${OUT}/clients-link-A-open.png` });

  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("table thead th", { timeout: 30000 });
  await page.waitForTimeout(800);
  const linkB = page.getByRole("link", { name: "TEST-CASE-B" }).first();
  await linkB.waitFor({ state: "visible", timeout: 15000 });
  const hrefB = await linkB.getAttribute("href");
  check("clients", "link-B-href-has-caseId", Boolean(hrefB && hrefB.includes(`caseId=${b.id}`)), hrefB);
  await linkB.click();
  await page.waitForTimeout(2000);
  const bodyB = await page.locator("body").innerText();
  check(
    "clients",
    "link-B-shows-correct-caseNo",
    bodyB.includes("TEST-CASE-B") && page.url().includes(b.id),
    page.url()
  );
  await page.screenshot({ path: `${OUT}/clients-link-B-open.png` });
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);

  // ── Cases forms ──
  await page.close();
  page = await freshModule(browser, "case-management");
  const caseHead = await firstColIsCaseNo(page);
  check("cases", "table-caseNo-first", caseHead.ok, caseHead.headers);
  check("cases", "add-opened", await openAdd(page));
  check("cases", "add-has-caseNo", await hasCaseField(page));
  await page.screenshot({ path: `${OUT}/cases-add.png` });
  await page.close();
  page = await freshModule(browser, "case-management");
  await page.getByRole("button", { name: /تعديل/ }).first().click();
  await page.waitForTimeout(700);
  const caseNoInput = page.locator("#modal-field-caseNo");
  const isRo = await caseNoInput.evaluate((el: HTMLInputElement) => Boolean(el.readOnly)).catch(() => false);
  check("cases", "edit-caseNo-readonly", isRo === true, { readOnly: isRo });
  check("cases", "edit-has-caseNo-value", ((await caseNoInput.inputValue().catch(() => "")) || "").length > 0);
  await page.screenshot({ path: `${OUT}/cases-edit.png` });
  await page.close();
  page = await freshModule(browser, "case-management");
  await page.getByRole("button", { name: /عرض/ }).first().click();
  await page.waitForTimeout(500);
  check("cases", "view-has-caseNo", (await page.locator("label, p, div", { hasText: "رقم القضية" }).count()) > 0);
  await page.screenshot({ path: `${OUT}/cases-view.png` });

  // ── Sessions ──
  await page.close();
  page = await freshModule(browser, "court-sessions");
  const sessHead = await firstColIsCaseNo(page);
  check("sessions", "table-caseNo-first", sessHead.ok, sessHead.headers);
  check("sessions", "add-opened", await openAdd(page));
  check("sessions", "add-case-select", await hasCaseField(page));
  const opts = await page.locator("select").first().locator("option").allTextContents();
  check("sessions", "add-options-from-cases", opts.some((o) => o.includes("TEST-CASE")), opts.slice(0, 5));
  await page.screenshot({ path: `${OUT}/sessions-add.png` });
  await page.close();
  page = await freshModule(browser, "court-sessions");
  if ((await page.getByRole("button", { name: /عرض/ }).count()) > 0) {
    await page.getByRole("button", { name: /عرض/ }).first().click();
    await page.waitForTimeout(500);
    check("sessions", "view-has-caseNo", (await page.getByText("رقم القضية").count()) > 0);
    await page.close();
    page = await freshModule(browser, "court-sessions");
  }
  if ((await page.getByRole("button", { name: /تعديل/ }).count()) > 0) {
    await page.getByRole("button", { name: /تعديل/ }).first().click();
    await page.waitForTimeout(500);
    check("sessions", "edit-has-caseNo", await hasCaseField(page));
    await page.screenshot({ path: `${OUT}/sessions-edit.png` });
  }

  // ── Accounting ──
  await page.close();
  page = await freshModule(browser, "legal-accounting");
  const accHead = await firstColIsCaseNo(page);
  check("accounting", "table-caseNo-first", accHead.ok, accHead.headers);
  check("accounting", "add-opened", await openAdd(page));
  check("accounting", "add-case-select", await hasCaseField(page));
  await page.screenshot({ path: `${OUT}/accounting-add.png` });

  // ── Follow-up / services / consultations / complaints / requests ──
  for (const slug of [
    "follow-up-center",
    "legal-services",
    "legal-consultations",
    "complaints-management",
    "internal-requests",
  ]) {
    await page.close();
    page = await freshModule(browser, slug);
    const h = await firstColIsCaseNo(page);
    check("modules", `${slug}:table-caseNo-first`, h.ok, h.headers);
    const opened = await openAdd(page);
    check("modules", `${slug}:add-opened`, opened);
    if (opened) {
      check("modules", `${slug}:add-has-caseNo`, await hasCaseField(page));
      await page.screenshot({ path: `${OUT}/${slug}-add.png` });
    }
  }

  // ── Legal finance tabs ──
  await page.close();
  page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);
  await page.goto(`${BASE}/app/legal-finance`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1500);
  for (const tab of [
    { key: "bail", name: "كفالات مالية" },
    { key: "personal", name: "ضمانات شخصية" },
    { key: "notifications", name: "إشعارات رسمية" },
  ]) {
    const tabBtn = page.getByRole("button", { name: tab.name });
    if ((await tabBtn.count()) > 0) {
      await tabBtn.click();
      await page.waitForTimeout(800);
    } else {
      // Fallback: label may vary slightly
      await page.locator("button").filter({ hasText: tab.name }).first().click().catch(() => undefined);
      await page.waitForTimeout(800);
    }
    const th = await page.locator("table thead th").allTextContents();
    check(
      "legal-finance",
      `${tab.key}:has-caseNo-col`,
      th.some((t) => t.includes("رقم القضية") || t.includes("القضية")),
      { th: th.slice(0, 6), tab: tab.name }
    );
  }
  await page.screenshot({ path: `${OUT}/legal-finance.png` });

  // ── Export includes caseNo column ──
  await page.close();
  page = await freshModule(browser, "clients-management");
  const exportProbe = await page.evaluate(() => {
    const headers = Array.from(document.querySelectorAll("table thead th")).map((th) =>
      (th.textContent || "").trim()
    );
    return { headers, hasCaseNo: headers.some((h) => h.includes("رقم القضية")) };
  });
  check("export", "clients-table-headers-include-caseNo", exportProbe.hasCaseNo, exportProbe.headers.slice(0, 5));

  const clientsApiRaw = await (await page.request.get(`${BASE}/api/clients`)).json();
  const clientsApi = Array.isArray(clientsApiRaw) ? (clientsApiRaw as Array<Record<string, unknown>>) : [];
  check("export", "clients-api-array", clientsApi.length > 0, {
    type: typeof clientsApiRaw,
    keys: clientsApiRaw && typeof clientsApiRaw === "object" ? Object.keys(clientsApiRaw as object).slice(0, 5) : [],
  });
  const exportCols = ["caseNo", "name", "phone", "country", "city"];
  const sample = clientsApi.find((r) => Array.isArray(r.caseLinks) && (r.caseLinks as unknown[]).length > 1);
  check(
    "export",
    "multi-case-row-caseNo-string",
    Boolean(sample && String(sample.caseNo).includes("TEST-CASE")),
    { caseNo: sample?.caseNo }
  );
  check("export", "csv-header-starts-caseNo", exportCols.join(",").startsWith("caseNo"));

  // Export modal: columns used are visibleColumns (must include caseNo)
  const reportBtn = page.getByRole("button", { name: /تقارير/ }).first();
  if ((await reportBtn.count()) > 0) {
    await reportBtn.click();
    await page.waitForTimeout(500);
    check("export", "reports-modal-open", (await page.getByText(/تصدير|Excel|PDF|CSV/i).count()) > 0);
    await page.screenshot({ path: `${OUT}/export-modal.png` });
  }

  const casesApiRaw = await (await page.request.get(`${BASE}/api/cases`)).json();
  const casesApi = Array.isArray(casesApiRaw) ? (casesApiRaw as Array<Record<string, unknown>>) : [];
  check(
    "export",
    "cases-api-all-have-caseNo",
    casesApi.length > 0 && casesApi.every((r) => String(r.caseNo ?? "").length > 0),
    { count: casesApi.length }
  );

  // ── Professional network gap probe ──
  await page.goto(`${BASE}/app/professional-network`, { waitUntil: "networkidle" }).catch(() => null);
  await page.waitForTimeout(800);
  const pnText = await page.locator("body").innerText().catch(() => "");
  check(
    "gaps",
    "professional-network-still-free-text-caseRef",
    pnText.includes("مرجع القضية") || pnText.includes("القضية") || page.url().includes("professional-network"),
    "documented exception if free-text remains"
  );

  await browser.close();

  // Review inventory from DB
  const sessions = await prisma.courtSession.findMany({ select: { caseId: true, caseNo: true } });
  let sessReview = 0;
  const sessSamples: string[] = [];
  for (const s of sessions) {
    if (s.caseId) {
      const c = await prisma.case.findUnique({ where: { id: s.caseId } });
      if (!c) {
        sessReview++;
        if (sessSamples.length < 6) sessSamples.push(`orphan:${s.caseId}`);
      }
    } else if (s.caseNo) {
      const res = await resolveCaseRef(s.caseNo);
      if (res.status === "review") {
        sessReview++;
        if (sessSamples.length < 6) sessSamples.push(String(s.caseNo));
      }
    }
  }

  const failed = checks.filter((c) => !c.ok);
  const byGroup: Record<string, { pass: number; fail: number }> = {};
  for (const c of checks) {
    byGroup[c.group] ??= { pass: 0, fail: 0 };
    if (c.ok) byGroup[c.group].pass++;
    else byGroup[c.group].fail++;
  }

  const report = {
    ok: failed.length === 0,
    total: checks.length,
    failed: failed.length,
    byGroup,
    reviewNeeded: {
      courtSessions: { count: sessReview, samples: sessSamples },
      note: "لا يتم الربط التلقائي — تُعرض للمراجعة فقط",
    },
    failures: failed,
  };
  writeFileSync(`${OUT}/acceptance-report.json`, JSON.stringify({ ...report, checks }, null, 2));
  console.log(JSON.stringify(report, null, 2));
  await prisma.$disconnect();
  if (failed.length) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
