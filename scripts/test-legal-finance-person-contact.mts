/**
 * Legal-finance person-contact E2E (invoices first) + ModuleShell table columns check.
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/legal-finance-contact";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const stamp = Date.now().toString(36);
const CLIENT_NAME = `موكل اتصال مالي ${stamp}`;

const REQUIRED_HEADERS = [
  "مفتاح الدولة",
  "رقم الجوال",
  "الدولة",
  "المدينة",
  "مفتاح الجوال الإضافي",
  "رقم جوال إضافي",
];

type Row = { check: string; result: "PASS" | "FAIL"; detail: string };
const rows: Row[] = [];
function record(check: string, ok: boolean, detail: string) {
  rows.push({ check, result: ok ? "PASS" : "FAIL", detail });
  console.log(`${ok ? "PASS" : "FAIL"} | ${check} | ${detail}`);
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[type="email"], input[name="email"]', ADMIN.email);
  await page.fill('input[type="password"], input[name="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 60000 });
}

async function fillByFieldKey(
  page: Page,
  key: string,
  value: string,
  type: "text" | "select" | "tel" = "text"
) {
  const el = page.locator(`#modal-field-${key}`);
  if ((await el.count()) === 0) return false;
  if (type === "select") {
    await el.selectOption({ label: value }).catch(async () => {
      await el.selectOption({ value }).catch(() => null);
    });
  } else {
    await el.fill(value);
  }
  return true;
}

async function shot(page: Page, name: string) {
  const p = path.join(OUT, name);
  await page.screenshot({ path: p, fullPage: false });
  return p;
}

async function assertHeaders(page: Page, scope: string) {
  const texts = await page.locator("table thead th").allTextContents();
  const missing = REQUIRED_HEADERS.filter((h) => !texts.some((t) => t.trim() === h));
  record(
    `${scope} — أعمدة الاتصال`,
    missing.length === 0,
    missing.length
      ? `ناقص: ${missing.join(", ")}`
      : texts.filter((t) => REQUIRED_HEADERS.includes(t.trim())).join(" | ")
  );
  return missing.length === 0;
}

fs.mkdirSync(OUT, { recursive: true });
if (fs.existsSync("/opt/cursor/artifacts/legal-finance-invoices-BEFORE.png")) {
  fs.copyFileSync(
    "/opt/cursor/artifacts/legal-finance-invoices-BEFORE.png",
    path.join(OUT, "00-invoices-table-BEFORE.png")
  );
}

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "ar-EG",
});
const page = await context.newPage();
page.setDefaultTimeout(45000);

try {
  await login(page);

  await page.goto(`${BASE}/app/legal-finance`, { waitUntil: "networkidle", timeout: 90000 });
  await page.getByRole("button", { name: /الفواتير/ }).click().catch(() => {});
  await page.waitForTimeout(800);
  await shot(page, "01-invoices-table-AFTER.png");
  await assertHeaders(page, "المالية القانونية ← الفواتير (جدول)");

  const addBtn = page.locator("button").filter({ hasText: /إضافة فاتورة/ }).first();
  await addBtn.waitFor({ state: "visible", timeout: 20000 });
  await addBtn.click();
  await page.waitForSelector("form", { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, "02-invoice-add-form.png");

  const formText = await page.locator("form").first().innerText();
  const formMissing = REQUIRED_HEADERS.filter((h) => !formText.includes(h));
  record(
    "الفواتير — نموذج الإضافة حقول الاتصال",
    formMissing.length === 0,
    formMissing.length ? `ناقص: ${formMissing.join(", ")}` : "كل الحقول ظاهرة"
  );

  await fillByFieldKey(page, "client", CLIENT_NAME, "text");
  await fillByFieldKey(page, "phoneDialCode", "+20 (مصر)", "select");
  await fillByFieldKey(page, "phone", "1555123999", "tel");
  await fillByFieldKey(page, "country", "مصر", "select");
  await fillByFieldKey(page, "city", "القاهرة", "text");
  await fillByFieldKey(page, "phoneSecondaryDialCode", "+20 (مصر)", "select");
  await fillByFieldKey(page, "phoneSecondary", "1001112233", "tel");
  await fillByFieldKey(page, "amount", "3500", "text");

  const saveRes = page.waitForResponse(
    (r) => r.url().includes("/api/financial-records") && r.request().method() === "POST",
    { timeout: 30000 }
  );
  await page.locator("form button.btn-primary, form button").filter({ hasText: /^إضافة$|حفظ/ }).first().click();
  const post = await saveRes.catch(() => null);
  const status = post?.status() ?? 0;
  let body = "";
  try {
    body = post ? JSON.stringify(await post.json()) : "";
  } catch {
    body = "";
  }
  record("الفواتير — حفظ API", status === 201 || status === 200, `status=${status} ${body.slice(0, 120)}`);
  await page.waitForTimeout(1500);
  await shot(page, "03-invoice-after-save.png");

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const rowVisible = await page.getByText(CLIENT_NAME, { exact: false }).first().isVisible().catch(() => false);
  record("الفواتير — ظهور الموكل بعد إعادة التحميل", rowVisible, CLIENT_NAME);
  const phoneVisible = await page
    .getByText(/1555123999|\+20\s*1555123999/)
    .first()
    .isVisible()
    .catch(() => false);
  record("الفواتير — ظهور الجوال في الجدول", phoneVisible, phoneVisible ? "visible" : "not found");
  const cityVisible = await page.getByText("القاهرة").first().isVisible().catch(() => false);
  record("الفواتير — ظهور المدينة في الجدول", cityVisible, cityVisible ? "visible" : "not found");
  const dialVisible = await page.locator("table tbody").getByText("+20", { exact: false }).first().isVisible().catch(() => false);
  record("الفواتير — ظهور مفتاح الدولة في الجدول", dialVisible, dialVisible ? "visible" : "not found");
  await shot(page, "04-invoice-table-reload.png");

  // View modal
  if (rowVisible) {
    const row = page.locator("tr", { hasText: CLIENT_NAME }).first();
    const viewBtn = row.locator("button").filter({ hasText: /عرض|👁|View/i }).first();
    if ((await viewBtn.count()) === 0) {
      // row actions may use title/aria
      await row.locator("button").first().click().catch(() => null);
    } else {
      await viewBtn.click();
    }
    await page.waitForTimeout(700);
    await shot(page, "04b-invoice-view.png");
    const viewText = await page.locator("body").innerText();
    record(
      "الفواتير — عرض بيانات الاتصال",
      viewText.includes("بيانات اتصال") && (viewText.includes("القاهرة") || viewText.includes("1555123999")),
      "view block"
    );
    await page.keyboard.press("Escape").catch(() => null);
    await page.locator("button").filter({ hasText: /✕|إغلاق/ }).first().click().catch(() => null);
  }

  for (const [tab, label] of [
    ["bail", "كفالات مالية"],
    ["personal", "ضمانات شخصية"],
    ["payments", "المدفوعات"],
  ] as const) {
    await page.getByRole("button", { name: new RegExp(label) }).click();
    await page.waitForTimeout(700);
    await shot(page, `05-${tab}-table.png`);
    await assertHeaders(page, `المالية القانونية ← ${label} (جدول)`);
  }

  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  await shot(page, "06-cases-table-contact-cols.png");
  await assertHeaders(page, "إدارة القضايا — جدول");

  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  await shot(page, "07-clients-table-contact-cols.png");
  await assertHeaders(page, "إدارة الموكلين — جدول");
} catch (e) {
  record("runtime", false, String(e));
  await shot(page, "ZZ-error.png").catch(() => "");
} finally {
  await browser.close();
}

const pass = rows.filter((r) => r.result === "PASS").length;
const fail = rows.filter((r) => r.result === "FAIL").length;
const report = [
  `# Legal-finance + ModuleShell person-contact E2E`,
  ``,
  `Generated: ${new Date().toISOString()} (Africa/Cairo ≈ UTC+3)`,
  ``,
  `| # | الفحص | النتيجة | التفاصيل |`,
  `|---|---|---|---|`,
  ...rows.map(
    (r, i) => `| ${i + 1} | ${r.check} | **${r.result}** | ${r.detail.replace(/\|/g, "/")} |`
  ),
  ``,
  `PASS=${pass} FAIL=${fail}`,
  ``,
].join("\n");
fs.writeFileSync(path.join(OUT, "report.md"), report);
fs.writeFileSync("/opt/cursor/artifacts/legal-finance-contact-report.md", report);
console.log(`\nDONE PASS=${pass} FAIL=${fail}`);
if (fail > 0) process.exit(1);
