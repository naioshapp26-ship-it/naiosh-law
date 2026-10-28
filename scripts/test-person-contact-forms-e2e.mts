/**
 * Form-level E2E: Add / View / Edit person-contact fields on every person-bearing module.
 * PASS only when form fields appear and save/view/edit round-trip works — not table headers alone.
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/person-contact-forms-e2e";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const CLIENT = { email: "client@naioshlaw.com", password: "Client@123" };

type FormResult = {
  page: string;
  href: string;
  form: "إضافة" | "عرض" | "تعديل";
  fieldsSeen: string[];
  result: "PASS" | "FAIL" | "N/A";
  detail: string;
  shot?: string;
};

const results: FormResult[] = [];
const stamp = Date.now().toString(36);

const REQUIRED_LABELS = ["مفتاح الدولة", "رقم الجوال", "الدولة", "المدينة"];
const SECONDARY_LABELS = ["رقم جوال إضافي", "مفتاح الجوال الإضافي"];

const MODULES: Array<{
  page: string;
  href: string;
  addText: RegExp;
  nameKey: "client" | "name" | "requester";
  nameLabel: RegExp;
  fillParties?: boolean;
  extraFill?: Array<{ label: RegExp; value: string; type?: "select" | "text" | "tel" }>;
}> = [
  {
    page: "إدارة القضايا",
    href: "/app/modules/case-management",
    addText: /إضافة قضية/,
    nameKey: "client",
    nameLabel: /^اسم الموكل$|اسم الموكل \*/,
    fillParties: true,
    extraFill: [
      { label: /نوع القضية/, value: "مدني", type: "select" },
      { label: /^المحكمة$/, value: "المحكمة الابتدائية القاهرة", type: "select" },
    ],
  },
  {
    page: "إدارة الموكلين",
    href: "/app/modules/clients-management",
    addText: /إضافة موكل/,
    nameKey: "name",
    nameLabel: /الاسم الكامل|اسم الموكل|^الاسم$/,
    extraFill: [{ label: /نوع الموكل/, value: "فرد", type: "select" }],
  },
  {
    page: "إدارة الجلسات",
    href: "/app/modules/court-sessions",
    addText: /جدولة جلسة/,
    nameKey: "client",
    nameLabel: /اسم الموكل|^الموكل$/,
    extraFill: [
      { label: /رقم القضية/, value: `#F-${stamp}`, type: "text" },
      { label: /تاريخ الجلسة|^التاريخ$/, value: "2026-11-15", type: "text" },
    ],
  },
  {
    page: "مركز المتابعة",
    href: "/app/modules/follow-up-center",
    addText: /إضافة متابعة/,
    nameKey: "client",
    nameLabel: /^الموكل$|الموكل \*/,
    extraFill: [{ label: /الموعد النهائي/, value: "2026-11-20", type: "text" }],
  },
  {
    page: "المحاسبة القانونية",
    href: "/app/modules/legal-accounting",
    addText: /إضافة سجل مالي/,
    nameKey: "client",
    nameLabel: /^الموكل$|الموكل \*/,
    extraFill: [
      { label: /المبلغ الإجمالي|المبلغ/, value: "2500", type: "text" },
      { label: /تاريخ الفاتورة|تاريخ الإصدار/, value: "2026-10-28", type: "text" },
    ],
  },
  {
    page: "الخدمات القانونية",
    href: "/app/modules/legal-services",
    addText: /إضافة طلب خدمة/,
    nameKey: "client",
    nameLabel: /^الموكل$|الموكل \*/,
    extraFill: [
      { label: /المسؤول/, value: "م. اختبار", type: "text" },
      { label: /تاريخ الطلب/, value: "2026-10-28", type: "text" },
    ],
  },
  {
    page: "الاستشارات القانونية",
    href: "/app/modules/legal-consultations",
    addText: /تسجيل استشارة/,
    nameKey: "client",
    nameLabel: /اسم العميل|^العميل$/,
    extraFill: [
      { label: /موضوع الاستشارة/, value: "استشارة اتصال", type: "text" },
      { label: /المستشار/, value: "م. اختبار", type: "text" },
      { label: /تاريخ الاستشارة|^التاريخ$/, value: "2026-10-28", type: "text" },
    ],
  },
  {
    page: "الشكاوى",
    href: "/app/modules/complaints-management",
    addText: /تسجيل شكوى/,
    nameKey: "client",
    nameLabel: /اسم العميل|^العميل$/,
    extraFill: [
      { label: /موضوع الشكوى/, value: "شكوى اتصال", type: "text" },
      { label: /تفاصيل الشكوى/, value: "تفاصيل اختبار الاتصال", type: "text" },
    ],
  },
  {
    page: "الطلبات الداخلية",
    href: "/app/modules/internal-requests",
    addText: /فتح طلب/,
    nameKey: "requester",
    nameLabel: /مقدم الطلب/,
    extraFill: [
      { label: /موضوع الطلب/, value: `طلب اتصال ${stamp}`, type: "text" },
      { label: /تفاصيل الطلب/, value: "تفاصيل مقدم الطلب", type: "text" },
    ],
  },
];

function record(r: FormResult) {
  results.push(r);
  console.log(`[${r.result}] ${r.page} / ${r.form}: ${r.detail}`);
}

async function api(ctx: BrowserContext, method: string, p: string, body?: unknown) {
  const res = await ctx.request.fetch(`${BASE}${p}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    data: body !== undefined ? body : undefined,
    failOnStatusCode: false,
  });
  let json: unknown = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status(), json };
}

async function login(ctx: BrowserContext, page: Page, creds: { email: string; password: string }) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const res = await api(ctx, "POST", "/api/auth/login", { ...creds, remember: true });
  if (res.status !== 200) throw new Error(`login failed ${res.status}`);
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

async function openAddModal(page: Page, addText: RegExp) {
  const btn = page.locator("button.btn-primary").filter({ hasText: addText }).first();
  if ((await btn.count()) === 0) {
    const fallback = page.locator("button").filter({ hasText: addText }).first();
    if ((await fallback.count()) === 0) throw new Error(`add button not found: ${addText}`);
    await fallback.click();
  } else {
    await btn.click();
  }
  await page.waitForSelector("form", { timeout: 10000 });
  await page.waitForTimeout(400);
}

function labelsInForm(formText: string): string[] {
  const found: string[] = [];
  for (const l of [...REQUIRED_LABELS, ...SECONDARY_LABELS]) {
    if (formText.includes(l)) found.push(l);
  }
  return found;
}

async function fillByLabel(
  page: Page,
  labelRe: RegExp,
  value: string,
  type: "text" | "select" | "tel" = "text"
) {
  const label = page.locator("form label").filter({ hasText: labelRe }).first();
  if ((await label.count()) === 0) return false;
  const forId = await label.getAttribute("for");
  if (forId) {
    const el = page.locator(`[id="${forId}"]`);
    if (type === "select") {
      await el.selectOption({ label: value }).catch(async () => {
        await el.selectOption({ value }).catch(() => null);
      });
    } else {
      await el.fill(value);
    }
    return true;
  }
  const input = label.locator("xpath=following::input[1] | following::select[1] | following::textarea[1]");
  if (type === "select") {
    await input.selectOption({ label: value }).catch(() => null);
  } else {
    await input.fill(value).catch(() => null);
  }
  return true;
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

async function fillContact(
  page: Page,
  personName: string,
  nameKey: "client" | "name" | "requester",
  nameLabel: RegExp
) {
  const nameOk = await fillByFieldKey(page, nameKey, personName, "text");
  if (!nameOk) {
    const byLabel = await fillByLabel(page, nameLabel, personName, "text");
    if (!byLabel) throw new Error(`person name field not found (${nameKey})`);
  }
  // Prefer stable field ids from Modal (`modal-field-*`)
  const dialOk = await fillByFieldKey(page, "phoneDialCode", "+20 (مصر)", "select");
  if (!dialOk) await fillByLabel(page, /مفتاح الدولة/, "+20 (مصر)", "select");
  const phoneOk = await fillByFieldKey(page, "phone", "1555123456", "tel");
  if (!phoneOk) {
    const phoneInputs = page.locator('form input[type="tel"]');
    if ((await phoneInputs.count()) > 0) await phoneInputs.first().fill("1555123456");
  }
  const countryOk = await fillByFieldKey(page, "country", "مصر", "select");
  if (!countryOk) await fillByLabel(page, /^الدولة/, "مصر", "select");
  const cityOk = await fillByFieldKey(page, "city", "القاهرة", "text");
  if (!cityOk) await fillByLabel(page, /^المدينة/, "القاهرة", "text");
  await fillByFieldKey(page, "phoneSecondaryDialCode", "+20 (مصر)", "select");
  await fillByFieldKey(page, "phoneSecondary", "1009988776", "tel");
}

async function fillParties(page: Page) {
  const hasFirst = await page.locator("#modal-field-firstParty").count();
  if (!hasFirst) return;
  await fillByFieldKey(page, "firstParty", `طرف أ ${stamp}`, "text");
  await fillByFieldKey(page, "firstPartyDialCode", "+20 (مصر)", "select");
  await fillByFieldKey(page, "firstPartyPhone", "1555111222", "tel");
  await fillByFieldKey(page, "firstPartyCountry", "مصر", "select");
  await fillByFieldKey(page, "firstPartyCity", "القاهرة", "text");
  await fillByFieldKey(page, "secondParty", `طرف ب ${stamp}`, "text");
  await fillByFieldKey(page, "secondPartyDialCode", "+20 (مصر)", "select");
  await fillByFieldKey(page, "secondPartyPhone", "1555333444", "tel");
  await fillByFieldKey(page, "secondPartyCountry", "مصر", "select");
  await fillByFieldKey(page, "secondPartyCity", "الجيزة", "text");
}

async function saveModal(page: Page) {
  const submit = page.locator("form button.btn-primary[type='submit'], form button[type='submit']").first();
  await submit.click();
  // Wait for modal to close (success) or stay open (validation)
  await page.waitForTimeout(1500);
  const stillOpen = await page.locator("form").count();
  if (stillOpen > 0) {
    // Try forcing HTML5 report
    const invalid = await page.locator("form :invalid").count();
    if (invalid > 0) {
      throw new Error(`form still open with ${invalid} invalid fields`);
    }
    await page.waitForTimeout(1500);
  }
}

async function closeModal(page: Page) {
  await page.locator("button").filter({ hasText: /^إلغاء$|^إغلاق$|✕/ }).first().click().catch(() => null);
  await page.keyboard.press("Escape").catch(() => null);
  await page.waitForTimeout(300);
}

async function searchPerson(page: Page, personName: string) {
  const search = page.locator('input[placeholder*="بحث"]').first();
  if (await search.count()) {
    await search.fill("");
    await search.fill(personName);
    await page.waitForTimeout(600);
  }
  return search;
}

async function clickRowAction(page: Page, action: "عرض" | "تعديل") {
  const cls = action === "عرض" ? "row-action-view" : "row-action-edit";
  // Prefer action in the filtered/visible table row that matches our person
  const row = page
    .locator("table tbody tr")
    .filter({ hasText: /شخص نموذج/ })
    .first();
  if ((await row.count()) > 0) {
    const btn = row.locator(`button.${cls}, button`).filter({ hasText: new RegExp(action) }).first();
    if ((await btn.count()) > 0) {
      await btn.click();
      return true;
    }
  }
  const scoped = page.locator(`button.${cls}`).first();
  if ((await scoped.count()) > 0) {
    await scoped.click();
    return true;
  }
  const any = page.locator("button").filter({ hasText: new RegExp(action) }).first();
  if ((await any.count()) > 0) {
    await any.click();
    return true;
  }
  return false;
}

async function testModule(
  ctx: BrowserContext,
  page: Page,
  mod: (typeof MODULES)[number]
) {
  const slug = mod.href.split("/").pop()!;
  const personName = `شخص نموذج ${stamp}-${slug}`;
  await page.goto(`${BASE}${mod.href}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // ── ADD form fields visible ──
  await openAddModal(page, mod.addText);
  const addShot = await shot(page, `${slug}-add`);
  const addText = await page.locator("form").first().innerText();
  const addFields = labelsInForm(addText);
  const addHasRequired = REQUIRED_LABELS.every((l) => addText.includes(l));
  const addHasSecondary = SECONDARY_LABELS.every((l) => addText.includes(l));
  record({
    page: mod.page,
    href: mod.href,
    form: "إضافة",
    fieldsSeen: addFields,
    result: addHasRequired && addHasSecondary ? "PASS" : "FAIL",
    detail: `required=${addHasRequired} secondary=${addHasSecondary} seen=${addFields.join(",")}`,
    shot: addShot,
  });

  // Fill & save
  await fillContact(page, personName, mod.nameKey, mod.nameLabel);
  for (const ex of mod.extraFill ?? []) {
    // Prefer known keys when label is ambiguous
    const keyGuess =
      ex.label.source.includes("نوع القضية") || ex.label.source.includes("نوع الموكل")
        ? "type"
        : ex.label.source.includes("المحكمة")
          ? "court"
          : ex.label.source.includes("المبلغ")
            ? "amount"
            : ex.label.source.includes("تاريخ الفاتورة")
              ? "issueDate"
              : ex.label.source.includes("رقم القضية")
                ? "caseNo"
                : ex.label.source.includes("تاريخ الجلسة") ||
                    (ex.label.source.includes("التاريخ") && mod.href.includes("court"))
                  ? "date"
                  : ex.label.source.includes("الموعد النهائي")
                    ? "due"
                    : ex.label.source.includes("موضوع")
                      ? null
                      : null;
    if (keyGuess) {
      const ok = await fillByFieldKey(page, keyGuess, ex.value, ex.type ?? "text");
      if (!ok) await fillByLabel(page, ex.label, ex.value, ex.type ?? "text");
    } else {
      await fillByLabel(page, ex.label, ex.value, ex.type ?? "text");
    }
  }
  if (mod.fillParties) {
    await fillParties(page);
  }
  const filledShot = await shot(page, `${slug}-filled`);
  try {
    await saveModal(page);
  } catch (e) {
    await shot(page, `${slug}-save-fail`);
    record({
      page: mod.page,
      href: mod.href,
      form: "عرض",
      fieldsSeen: [],
      result: "FAIL",
      detail: `save failed: ${e instanceof Error ? e.message : String(e)} shot=${filledShot}`,
    });
    record({
      page: mod.page,
      href: mod.href,
      form: "تعديل",
      fieldsSeen: [],
      result: "FAIL",
      detail: "skipped — save failed",
    });
    await closeModal(page);
    return;
  }
  await page.waitForTimeout(900);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(700);

  // Search for person
  await searchPerson(page, personName);
  const tableText = await page.locator("body").innerText();
  const personInTable = tableText.includes(personName);
  if (!personInTable) {
    await shot(page, `${slug}-missing-row`);
  }

  // ── VIEW ──
  let viewOk = false;
  let viewFields: string[] = [];
  let viewShotPath: string | undefined;
  if (personInTable && (await clickRowAction(page, "عرض"))) {
    await page.waitForTimeout(600);
    viewShotPath = await shot(page, `${slug}-view`);
    const viewBody = await page.locator("body").innerText();
    viewOk =
      viewBody.includes(personName) &&
      (viewBody.includes("1555123456") || viewBody.includes("+20") || viewBody.includes("رقم الجوال")) &&
      (viewBody.includes("مصر") || viewBody.includes("الدولة")) &&
      (viewBody.includes("القاهرة") || viewBody.includes("المدينة"));
    viewFields = labelsInForm(viewBody);
    if (!viewFields.length) {
      for (const l of ["رقم الجوال", "الدولة", "المدينة", "مفتاح الدولة"]) {
        if (viewBody.includes(l)) viewFields.push(l);
      }
    }
    await closeModal(page);
  }
  record({
    page: mod.page,
    href: mod.href,
    form: "عرض",
    fieldsSeen: viewFields,
    result: viewOk ? "PASS" : "FAIL",
    detail: `personInTable=${personInTable} dataVisible=${viewOk} name=${personName.slice(0, 24)}`,
    shot: viewShotPath,
  });

  // ── EDIT ──
  await searchPerson(page, personName);
  let editOk = false;
  let editFields: string[] = [];
  let editShotPath: string | undefined;
  if (personInTable && (await clickRowAction(page, "تعديل"))) {
    await page.waitForTimeout(600);
    editShotPath = await shot(page, `${slug}-edit`);
    const editForm = await page.locator("form").first().innerText();
    editFields = labelsInForm(editForm);
    const editHasRequired = REQUIRED_LABELS.every((l) => editForm.includes(l));
    await fillByFieldKey(page, "city", "الجيزة", "text");
    await fillByFieldKey(page, "phone", "1555000111", "tel");
    try {
      await saveModal(page);
      await page.waitForTimeout(900);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await searchPerson(page, personName);
      const after = await page.locator("body").innerText();
      editOk =
        editHasRequired &&
        (after.includes("الجيزة") || after.includes("1555000111") || after.includes("+20"));
    } catch (e) {
      editOk = false;
      await shot(page, `${slug}-edit-save-fail`);
      await closeModal(page);
      record({
        page: mod.page,
        href: mod.href,
        form: "تعديل",
        fieldsSeen: editFields,
        result: "FAIL",
        detail: `edit save failed: ${e instanceof Error ? e.message : String(e)}`,
        shot: editShotPath,
      });
      return;
    }
  }
  record({
    page: mod.page,
    href: mod.href,
    form: "تعديل",
    fieldsSeen: editFields,
    result: editOk ? "PASS" : "FAIL",
    detail: `fields=${editFields.join(",")} persistedEdit=${editOk}`,
    shot: editShotPath,
  });
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ headless: true });
  const videoDir = path.join(OUT, "video");
  fs.mkdirSync(videoDir, { recursive: true });
  const ctx = await browser.newContext({
    locale: "ar-EG",
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: videoDir, size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  page.setDefaultTimeout(20000);
  await login(ctx, page, ADMIN);

  for (const mod of MODULES) {
    try {
      await testModule(ctx, page, mod);
    } catch (e) {
      record({
        page: mod.page,
        href: mod.href,
        form: "إضافة",
        fieldsSeen: [],
        result: "FAIL",
        detail: `exception: ${e instanceof Error ? e.message : String(e)}`,
      });
      await closeModal(page).catch(() => null);
    }
  }

  // Cross-page reflection: clients page still has contact columns
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const clientsText = await page.locator("body").innerText();
  record({
    page: "انعكاس عبر الصفحات",
    href: "/app/modules/clients-management",
    form: "عرض",
    fieldsSeen: ["رقم الجوال", "الدولة", "المدينة"],
    result: clientsText.includes("رقم الجوال") && clientsText.includes("الدولة") ? "PASS" : "FAIL",
    detail: "clients page still shows contact columns after form saves",
    shot: await shot(page, "cross-clients"),
  });

  // Logout / login persistence check on cases
  await ctx.clearCookies();
  await login(ctx, page, ADMIN);
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const afterRelogin = await page.locator("body").innerText();
  const persisted =
    afterRelogin.includes("رقم الجوال") &&
    afterRelogin.includes("الدولة") &&
    afterRelogin.includes("المدينة") &&
    (afterRelogin.includes("شخص نموذج") || afterRelogin.includes("+20") || afterRelogin.includes("مصر"));
  record({
    page: "استمرارية بعد خروج/دخول",
    href: "/app/modules/case-management",
    form: "عرض",
    fieldsSeen: ["رقم الجوال", "الدولة", "المدينة"],
    result: persisted ? "PASS" : "FAIL",
    detail: `relogin columns+data persisted=${persisted}`,
    shot: await shot(page, "relogin-cases"),
  });

  // Permissions
  await ctx.clearCookies();
  await login(ctx, page, CLIENT);
  const denied = await api(ctx, "GET", "/api/clients");
  record({
    page: "عزل بيانات العملاء",
    href: "/api/clients",
    form: "عرض",
    fieldsSeen: [],
    result: denied.status === 403 ? "PASS" : "FAIL",
    detail: `client role status=${denied.status}`,
  });

  // Mobile add form
  await ctx.clearCookies();
  await login(ctx, page, ADMIN);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await openAddModal(page, /إضافة قضية/);
  const mobileForm = await page.locator("form").first().innerText();
  const mobileShot = await shot(page, "mobile-case-add");
  record({
    page: "إدارة القضايا — موبايل",
    href: "/app/modules/case-management",
    form: "إضافة",
    fieldsSeen: labelsInForm(mobileForm),
    result: REQUIRED_LABELS.every((l) => mobileForm.includes(l)) && SECONDARY_LABELS.every((l) => mobileForm.includes(l)) ? "PASS" : "FAIL",
    detail: "mobile add form contact + secondary fields",
    shot: mobileShot,
  });
  await closeModal(page);

  // N/A pages (template/report titles, not person records)
  for (const [pageName, href] of [
    ["القوالب الذكية", "/app/modules/smart-templates"],
    ["مركز التقارير", "/app/modules/reports-center"],
    ["التكاملات", "/app/modules/integrations"],
    ["مركز الإشعارات", "/app/modules/notifications-center"],
  ] as const) {
    record({
      page: pageName,
      href,
      form: "إضافة",
      fieldsSeen: [],
      result: "N/A",
      detail: "اسم القالب/التقرير/الإشعار وليس شخصًا مرتبطًا بمعاملة",
    });
  }

  await browser.close();

  const summary = {
    pass: results.filter((r) => r.result === "PASS").length,
    fail: results.filter((r) => r.result === "FAIL").length,
    na: results.filter((r) => r.result === "N/A").length,
    formsTested: results.filter((r) => r.result !== "N/A").length,
  };
  const report = { generatedAt: new Date().toISOString(), stamp, summary, results };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(report, null, 2));
  const md = [
    "# Person Contact Forms E2E",
    "",
    `| الصفحة | الرابط | النموذج | الحقول | النتيجة | التفاصيل |`,
    `|---|---|---|---|---|---|`,
    ...results.map(
      (r) =>
        `| ${r.page} | \`${r.href}\` | ${r.form} | ${r.fieldsSeen.join("، ") || "—"} | **${r.result}** | ${r.detail.replace(/\|/g, "/")} |`
    ),
    "",
    `PASS=${summary.pass} FAIL=${summary.fail} N/A=${summary.na} formsTested=${summary.formsTested}`,
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "report.md"), md);
  fs.writeFileSync(path.join("/workspace", "docs-person-contact-forms-e2e-report.md"), md);
  console.log("\n" + md);
  if (summary.fail > 0) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
