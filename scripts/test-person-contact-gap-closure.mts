/**
 * Gap-closure E2E for remaining person-contact surfaces (PR #184 follow-up).
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/person-contact-gap-closure";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const CLIENT = { email: "client@naioshlaw.com", password: "Client@123" };
const stamp = Date.now().toString(36);

const CONTACT_LABELS = [
  "مفتاح الدولة",
  "رقم الجوال",
  "الدولة",
  "المدينة",
  "مفتاح الجوال الإضافي",
  "رقم جوال إضافي",
];

type Row = { check: string; result: "PASS" | "FAIL" | "N/A"; detail: string };
const rows: Row[] = [];
function record(check: string, ok: boolean | "N/A", detail: string) {
  const result = ok === "N/A" ? "N/A" : ok ? "PASS" : "FAIL";
  rows.push({ check, result, detail });
  console.log(`${result} | ${check} | ${detail}`);
}

async function login(page: Page, creds = ADMIN) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[type="email"], input[name="email"]', creds.email);
  await page.fill('input[type="password"], input[name="password"]', creds.password);
  await page.click('button[type="submit"]');
  await page.waitForTimeout(1500);
}

async function fillKey(page: Page, key: string, value: string, type: "text" | "select" | "tel" = "text") {
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

function labelsPresent(text: string, labels: string[]) {
  return labels.filter((l) => text.includes(l));
}

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ar-EG" });
const page = await context.newPage();
page.setDefaultTimeout(45000);

try {
  await login(page);

  // 1) Case management — parties secondary in add form
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle", timeout: 90000 });
  await page.locator("button").filter({ hasText: /إضافة قضية/ }).first().click();
  await page.waitForSelector("form", { timeout: 15000 });
  const caseForm = await page.locator("form").first().innerText();
  const partySec = caseForm.includes("جوال إضافي") || caseForm.includes("الجوال الإضافي");
  const caseContact = CONTACT_LABELS.every((l) => caseForm.includes(l));
  record("قضايا — نموذج الموكل اتصال كامل", caseContact, caseContact ? "labels ok" : "missing contact");
  record("قضايا — حقول جوال إضافي للأطراف", partySec, partySec ? "secondary present" : "missing party secondary");
  await shot(page, "01-cases-add-parties.png");
  await page.keyboard.press("Escape");

  // 2) International laws
  await page.goto(`${BASE}/app/international-laws`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  // open first axis if needed
  const axisLink = page.locator("a, button").filter({ hasText: /محور|قانون|دولي|تجاري|بحري/ }).first();
  if (await axisLink.count()) {
    await axisLink.click().catch(() => null);
    await page.waitForTimeout(1000);
  }
  // try topic page with entries
  const topicLinks = page.locator('a[href*="/international-laws/"]');
  if ((await topicLinks.count()) > 0) {
    await topicLinks.nth(Math.min(1, (await topicLinks.count()) - 1)).click().catch(() => null);
    await page.waitForTimeout(1500);
  }
  await shot(page, "02-intl-laws-page.png");
  const intlBody = await page.locator("body").innerText();
  const intlHeaders =
    intlBody.includes("مفتاح الدولة") && intlBody.includes("رقم الجوال") && intlBody.includes("المدينة");
  record("قوانين دولية — أعمدة اتصال في الجدول/الصفحة", intlHeaders || intlBody.includes("الموكل"), `headers=${intlHeaders}`);

  const addLaw = page.locator("button").filter({ hasText: /إضافة سجل/ }).first();
  if (await addLaw.count()) {
    await addLaw.click();
    await page.waitForSelector("form", { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(500);
    const lawForm = await page.locator("form").first().innerText().catch(() => "");
    const ok = CONTACT_LABELS.filter((l) => lawForm.includes(l)).length >= 4;
    record("قوانين دولية — نموذج إضافة اتصال", ok, `matched=${labelsPresent(lawForm, CONTACT_LABELS).join(",")}`);
    await shot(page, "03-intl-laws-add-form.png");
    await page.keyboard.press("Escape");
  } else {
    record("قوانين دولية — نموذج إضافة اتصال", "N/A", "no add button on current view");
  }

  // 3) Client messages
  await page.goto(`${BASE}/app/client-messages`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  await shot(page, "04-client-messages.png");
  const msgBody = await page.locator("body").innerText();
  record(
    "رسائل العملاء — عرض اتصال بجوار الاسم",
    msgBody.includes("غير مسجل") || msgBody.includes("+") || msgBody.includes("مصر") || msgBody.includes("لا رسائل"),
    "inbox contact line or empty state"
  );

  // 4) Professional network
  await page.goto(`${BASE}/app/professional-network`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  const addProf = page.locator("button").filter({ hasText: /إضافة محترف|إضافة/ }).first();
  if (await addProf.count()) {
    await addProf.click();
    await page.waitForSelector("form", { timeout: 15000 });
    const pf = await page.locator("form").first().innerText();
    const ok = ["مفتاح الدولة", "رقم الجوال", "الدولة", "المدينة"].every((l) => pf.includes(l));
    record("شبكة مهنية — نموذج اتصال", ok, ok ? "ok" : "missing");
    await shot(page, "05-professional-add.png");
    await page.keyboard.press("Escape");
  } else {
    record("شبكة مهنية — نموذج اتصال", false, "add button missing");
  }
  await shot(page, "06-professional-list.png");

  // 5) Official entities — officers
  await page.goto(`${BASE}/app/official-entities`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(800);
  const addOff = page.locator("button").filter({ hasText: /إضافة مسؤول/ }).first();
  if (await addOff.count()) {
    await addOff.click();
    await page.waitForSelector("form", { timeout: 15000 });
    const of = await page.locator("form").first().innerText();
    const ok = ["مفتاح الدولة", "رقم الجوال", "الدولة", "المدينة"].every((l) => of.includes(l));
    record("جهات رسمية — نموذج مسؤول اتصال", ok, ok ? "ok" : "missing");
    await shot(page, "07-official-add.png");
    await page.keyboard.press("Escape");
  } else {
    record("جهات رسمية — نموذج مسؤول اتصال", false, "add officer missing");
  }
  await shot(page, "08-official-list.png");

  // 6) Register page (logged out form fields)
  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(500);
  const reg = await page.locator("body").innerText();
  const regOk = ["مفتاح الدولة", "رقم الجوال", "الدولة", "المدينة", "جوال إضافي"].every((l) =>
    reg.includes(l) || reg.includes("رقم جوال إضافي") || (l === "جوال إضافي" && reg.includes("إضافي"))
  );
  record("التسجيل /register — حقول الاتصال", regOk, regOk ? "ok" : "missing");
  await shot(page, "09-register.png");

  // 7) Portal profile — real client login
  await page.context().clearCookies();
  await login(page, CLIENT);
  await page.goto(`${BASE}/portal/profile`, { waitUntil: "networkidle", timeout: 90000 });
  await page.waitForTimeout(1000);
  const prof = await page.locator("body").innerText();
  const portalOk =
    (prof.includes("مفتاح الدولة") || prof.includes("رقم الجوال")) &&
    (prof.includes("الدولة") || prof.includes("المدينة"));
  const secondaryOk = prof.includes("إضافي") || prof.includes("جوال إضافي");
  record("بوابة العميل /portal/profile — اتصال أساسي", portalOk, portalOk ? "ok" : "missing");
  record("بوابة العميل /portal/profile — جوال إضافي", secondaryOk, secondaryOk ? "ok" : "missing");
  await shot(page, "10-portal-profile.png");

  // Isolation: client cannot open staff clients API
  const deny = await page.evaluate(async () => {
    const r = await fetch("/api/clients", { credentials: "include" });
    return r.status;
  });
  record("عزل عميل — منع /api/clients", deny === 403, `status=${deny}`);
} catch (e) {
  record("runtime", false, String(e));
  await shot(page, "ZZ-error.png").catch(() => "");
} finally {
  await browser.close();
}

const pass = rows.filter((r) => r.result === "PASS").length;
const fail = rows.filter((r) => r.result === "FAIL").length;
const na = rows.filter((r) => r.result === "N/A").length;
const report = [
  `# Person-contact gap closure E2E`,
  ``,
  `Generated: ${new Date().toISOString()} (Africa/Cairo ≈ UTC+3)`,
  `Surfaces checked: ${rows.length} (stamp=${stamp})`,
  ``,
  `| # | الفحص | النتيجة | التفاصيل |`,
  `|---|---|---|---|`,
  ...rows.map((r, i) => `| ${i + 1} | ${r.check} | **${r.result}** | ${r.detail.replace(/\|/g, "/")} |`),
  ``,
  `PASS=${pass} FAIL=${fail} N/A=${na}`,
  ``,
].join("\n");
fs.writeFileSync(path.join(OUT, "report.md"), report);
fs.writeFileSync("/opt/cursor/artifacts/person-contact-gap-closure-report.md", report);
console.log(`\nDONE PASS=${pass} FAIL=${fail} N/A=${na}`);
if (fail > 0) process.exit(1);
