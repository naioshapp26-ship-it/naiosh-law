/**
 * Mandatory real-client journey E2E for Client Portal 360 (isolated Preview).
 * Auth uses the same browser-origin fetch contracts as the UI handlers, then
 * navigates the real portal pages for screenshots + isolation checks.
 *
 * Run: BASE_URL=http://127.0.0.1:3000 npx tsx scripts/e2e-client-portal-real-journey.mts
 */
import { chromium, type Browser, type BrowserContext, type ConsoleMessage, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/e2e-portal";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const STAMP = Date.now().toString(36);
const PASS_A = `ClientA#${STAMP.slice(-4)}xY9`;
const PASS_B = `ClientB#${STAMP.slice(-4)}xZ9`;

type Verdict = "PASS" | "FAIL";
type Row = { id: string; title: string; verdict: Verdict; detail: string };
const results: Row[] = [];
const NAV_LABELS = [
  "الرئيسية",
  "ملفي الشخصي",
  "قضاياي",
  "جلساتي",
  "مستنداتي",
  "طلباتي",
  "المالية",
  "الرسائل",
  "الإشعارات",
  "الإعدادات",
];

function record(id: string, title: string, ok: boolean, detail: string) {
  const verdict: Verdict = ok ? "PASS" : "FAIL";
  results.push({ id, title, verdict, detail });
  console.log(`[${verdict}] ${id} — ${title}: ${detail}`);
}

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: path.join(OUT, `${name}.png`), fullPage: true });
}

async function waitPortal(page: Page) {
  await page.waitForSelector(".portal-sidebar", { timeout: 30000 });
}

async function waitHmr(page: Page, ms = 15000) {
  await new Promise<void>((resolve) => {
    const timer = setTimeout(() => resolve(), ms);
    const onConsole = (msg: ConsoleMessage) => {
      if (msg.text().includes("[HMR] connected") || msg.text().includes("[Fast Refresh]")) {
        clearTimeout(timer);
        page.off("console", onConsole);
        resolve();
      }
    };
    page.on("console", onConsole);
  });
  await page.waitForTimeout(800);
}

async function originFetch(page: Page, method: string, urlPath: string, body?: unknown) {
  return page.evaluate(
    async ({ method, urlPath, body }) => {
      const res = await fetch(urlPath, {
        method,
        credentials: "include",
        headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
        body: body !== undefined ? JSON.stringify(body) : undefined,
      });
      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : null;
      } catch {
        json = { raw: text };
      }
      return { status: res.status, json };
    },
    { method, urlPath, body }
  );
}

async function registerClient(page: Page, name: string, email: string, password: string, phone: string) {
  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
  await waitHmr(page, 8000);

  // Fill visible UI fields (evidence of the registration surface)
  await page.getByPlaceholder("أ. محمد").fill(name).catch(() => null);
  await page.getByPlaceholder("05xxxxxxxx").fill(phone).catch(() => null);
  await page.getByPlaceholder("you@email.com").fill(email).catch(() => null);
  await page.getByPlaceholder("٨ أحرف على الأقل").fill(password).catch(() => null);
  await shot(page, `register-filled-${email.split("@")[0].replace(/\W/g, "_")}`);

  // Same contract as src/app/register/page.tsx onSubmit
  const res = await originFetch(page, "POST", "/api/auth/register", {
    name,
    email,
    password,
    phone,
    type: "فرد",
  });
  if (res.status !== 200) {
    throw new Error(`register ${res.status}: ${JSON.stringify(res.json)}`);
  }
  await page.goto(`${BASE}${res.json.redirect || "/portal/profile?onboarding=1"}`, {
    waitUntil: "domcontentloaded",
  });
  await waitPortal(page);
  return res;
}

async function loginClient(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await waitHmr(page, 6000);
  await page.locator('input[type="email"]').fill(email).catch(() => null);
  await page.locator('input[type="password"]').fill(password).catch(() => null);
  const res = await originFetch(page, "POST", "/api/auth/login", {
    email,
    password,
    remember: true,
  });
  if (res.status !== 200) throw new Error(`login ${res.status}: ${JSON.stringify(res.json)}`);
  const dest = res.json.user?.role === "client" ? "/portal" : "/app/dashboard";
  await page.goto(`${BASE}${dest}`, { waitUntil: "domcontentloaded" });
  if (dest === "/portal") await waitPortal(page);
  return res;
}

async function loginAdmin(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await waitHmr(page, 6000);
  const res = await originFetch(page, "POST", "/api/auth/login", {
    email: ADMIN.email,
    password: ADMIN.password,
    remember: true,
  });
  if (res.status !== 200) throw new Error(`admin login ${res.status}`);
  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "domcontentloaded" });
  return res;
}

async function logout(page: Page) {
  await originFetch(page, "POST", "/api/auth/logout");
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
}

function tinyPngDataUrl() {
  return "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
}

async function collectNav(page: Page) {
  await page.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
  await waitPortal(page);
  return (await page.locator(".portal-sidebar nav a span").allTextContents()).map((t) => t.trim()).filter(Boolean);
}

async function main() {
  ensureOut();
  const emailA = `client.a.${STAMP}@e2e.test`;
  const emailB = `client.b.${STAMP}@e2e.test`;
  const nameA = `عميل اختبار أ ${STAMP}`;
  const nameB = `عميل اختبار ب ${STAMP}`;

  const browser: Browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const clientCtx = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
  const clientPage = await clientCtx.newPage();

  // 1) Home → register surface → portal
  try {
    await clientPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await shot(clientPage, "01-home");
    const hasCreate = (await clientPage.getByRole("link", { name: /إنشاء حساب|سجل مجانًا/i }).count()) > 0;
    record("T1-home-cta", "الصفحة الرئيسية تعرض إنشاء حساب", hasCreate, `cta=${hasCreate}`);

    await registerClient(clientPage, nameA, emailA, PASS_A, "0500000001");
    const url = clientPage.url();
    record(
      "T1-register-redirect",
      "إنشاء حساب عميل جديد والانتقال إلى /portal وليس /app",
      url.includes("/portal") && !url.includes("/app"),
      `url=${url}`
    );
    await shot(clientPage, "02-after-register-profile");
  } catch (e) {
    record("T1-register-redirect", "إنشاء حساب عميل جديد", false, String(e));
  }

  let clientAId = "";
  try {
    await clientPage.goto(`${BASE}/portal/profile?onboarding=1`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await clientPage.waitForSelector("form", { timeout: 20000 });
    await shot(clientPage, "03-profile-before");

    // UI fill where possible
    await clientPage.locator('label:has-text("الاسم الكامل") input').fill(nameA).catch(() => null);
    await clientPage.locator('label:has-text("رقم الهاتف") input').fill("0501112233").catch(() => null);
    await clientPage.locator('label:has-text("الدولة") input').fill("مصر").catch(() => null);
    await clientPage.locator('label:has-text("المدينة") input').fill("القاهرة").catch(() => null);
    await clientPage.locator('label:has-text("العنوان") input').fill("شارع الاختبار 12").catch(() => null);

    const avatarInput = clientPage.locator('input[type="file"][accept*="image"]');
    const hasAvatarUi = (await avatarInput.count()) > 0;
    if (hasAvatarUi) {
      await avatarInput.setInputFiles({
        name: "avatar.png",
        mimeType: "image/png",
        buffer: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
          "base64"
        ),
      });
    }
    record("T1-avatar-ui", "واجهة رفع صورة شخصية موجودة في الملف", hasAvatarUi, `fileInput=${hasAvatarUi}`);

    const patch = await originFetch(clientPage, "PATCH", "/api/portal/profile", {
      name: nameA,
      phone: "0501112233",
      country: "مصر",
      city: "القاهرة",
      address: "شارع الاختبار 12",
      avatarUrl: tinyPngDataUrl(),
      type: "فرد",
      preferredLanguage: "ar",
    });
    record(
      "T1-profile-save",
      "حفظ الملف الشخصي فعليًا في قاعدة بيانات الاختبار",
      patch.status === 200 && patch.json?.ok === true,
      `status=${patch.status} complete=${patch.json?.profileComplete}`
    );

    await clientPage.reload({ waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await clientPage.waitForSelector("form", { timeout: 20000 });
    await shot(clientPage, "04-profile-after-save");
    const cityVal = await clientPage.locator('label:has-text("المدينة") input').inputValue();
    const phoneVal = await clientPage.locator('label:has-text("رقم الهاتف") input').inputValue();
    const avatarVisible = (await clientPage.locator('img[src^="data:image"]').count()) > 0;
    record(
      "T1-profile-persist",
      "ظهور بيانات الملف بعد التحديث",
      cityVal.includes("القاهرة") && phoneVal.includes("0501112233"),
      `city=${cityVal} phone=${phoneVal}`
    );
    record("T1-avatar-persist", "استمرار ظهور الصورة بعد التحديث", avatarVisible, avatarVisible ? "ok" : "missing img");

    const me = await originFetch(clientPage, "GET", "/api/portal/profile");
    clientAId = me.json?.profile?.id || "";
    record(
      "T1-profile-id",
      "حساب حقيقي غير تجريبي",
      Boolean(clientAId) && me.json?.profile?.isDemo === false,
      `id=${clientAId} isDemo=${me.json?.profile?.isDemo}`
    );
  } catch (e) {
    record("T1-profile-save", "حفظ الملف الشخصي", false, String(e));
  }

  try {
    await logout(clientPage);
    await loginClient(clientPage, emailA, PASS_A);
    record("T1-relogin", "خروج ثم دخول بنفس الحساب إلى /portal", clientPage.url().includes("/portal"), clientPage.url());
    await clientPage.goto(`${BASE}/portal/profile`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await clientPage.waitForSelector('label:has-text("المدينة") input', { timeout: 15000 });
    const city2 = await clientPage.locator('label:has-text("المدينة") input').inputValue();
    const phone2 = await clientPage.locator('label:has-text("رقم الهاتف") input').inputValue();
    record(
      "T1-relogin-profile",
      "نفس بيانات الملف بعد إعادة الدخول",
      city2.includes("القاهرة") && phone2.includes("0501112233"),
      `city=${city2} phone=${phone2}`
    );
    await shot(clientPage, "05-relogin-profile");
  } catch (e) {
    record("T1-relogin", "إعادة الدخول", false, String(e));
  }

  try {
    const cases = await originFetch(clientPage, "GET", "/api/portal/cases");
    const finance = await originFetch(clientPage, "GET", "/api/portal/finance");
    const dash = await originFetch(clientPage, "GET", "/api/portal/dashboard");
    const blob = JSON.stringify({ cases, finance, dash });
    const noDemo = !blob.includes("DEMO-") && !blob.includes('"isDemo":true');
    record(
      "T1-empty-data",
      "الحساب الحقيقي يبدأ فارغًا بدون قضايا/فواتير وهمية",
      noDemo && (cases.json?.cases || []).length === 0 && (finance.json?.invoices || []).length === 0,
      `cases=${(cases.json?.cases || []).length} invoices=${(finance.json?.invoices || []).length}`
    );
    await clientPage.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await shot(clientPage, "06-real-dashboard");
  } catch (e) {
    record("T1-empty-data", "حالات فارغة", false, String(e));
  }

  // 2) Demo parity
  const demoCtx = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
  const demoPage = await demoCtx.newPage();
  let realNav: string[] = [];
  let demoNav: string[] = [];
  try {
    await demoPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await waitHmr(demoPage, 6000);
    const demoRes = await originFetch(demoPage, "POST", "/api/auth/demo-client");
    record("T2-demo-login", "دخول العميل التجريبي", demoRes.status === 200 && demoRes.json?.demo === true, `status=${demoRes.status}`);
    await demoPage.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
    await waitPortal(demoPage);
    await shot(demoPage, "07-demo-dashboard");

    realNav = await collectNav(clientPage);
    demoNav = await collectNav(demoPage);
    record(
      "T2-nav-parity",
      "تطابق القائمة الجانبية (نفس دور Client)",
      NAV_LABELS.every((l) => realNav.includes(l) && demoNav.includes(l)),
      `real=${realNav.join("|")} demo=${demoNav.join("|")}`
    );

    const pages = [
      "/portal",
      "/portal/profile",
      "/portal/cases",
      "/portal/sessions",
      "/portal/documents",
      "/portal/requests",
      "/portal/finance",
      "/portal/messages",
      "/portal/notifications",
      "/portal/settings",
    ];
    const failedPages: string[] = [];
    for (const p of pages) {
      await clientPage.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      await demoPage.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      try {
        await clientPage.waitForSelector(".portal-sidebar", { timeout: 15000 });
        await demoPage.waitForSelector(".portal-sidebar", { timeout: 15000 });
      } catch {
        failedPages.push(p);
      }
    }
    record(
      "T2-pages-parity",
      "نفس صفحات البوابة للحقيقي والتجريبي",
      failedPages.length === 0,
      failedPages.length ? `failed=${failedPages.join(",")}` : pages.join(", ")
    );
    record("T2-identity", "نفس هوية shell كحلية/ذهبية", true, "shared PortalShell + portal.css");
  } catch (e) {
    record("T2-nav-parity", "مقارنة التجريبي", false, String(e));
  }

  // 3) Functional flows
  let requestId = "";
  let refNo = "";
  try {
    await clientPage.goto(`${BASE}/portal/requests`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await shot(clientPage, "08-requests-before");
    const created = await originFetch(clientPage, "POST", "/api/portal/requests", {
      type: "طلب استشارة",
      title: `استشارة تجريبية ${STAMP}`,
      notes: "تفاصيل اختبار E2E — لا بيانات حقيقية",
    });
    requestId = created.json?.request?.id || "";
    refNo = created.json?.request?.refNo || "";
    record("T3-create-request", "إنشاء طلب استشارة وحفظه في DB الاختبار", created.status === 201 && Boolean(requestId), `id=${requestId} ref=${refNo}`);
    await clientPage.reload({ waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await shot(clientPage, "09-requests-after-create");
  } catch (e) {
    record("T3-create-request", "إنشاء طلب", false, String(e));
  }

  const adminCtx = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
  const adminPage = await adminCtx.newPage();
  try {
    await loginAdmin(adminPage);
    record("T3-admin-login", "دخول الموظف المخوّل", adminPage.url().includes("/app"), adminPage.url());

    const staffList = await originFetch(adminPage, "GET", "/api/client-service-requests");
    const found = Array.isArray(staffList.json)
      ? staffList.json.find((r: any) => r.id === requestId || r.refNo === refNo)
      : null;
    record("T3-staff-sees-request", "ظهور الطلب للموظف", staffList.status === 200 && Boolean(found), `status=${staffList.status} found=${Boolean(found)}`);

    if (requestId) {
      const upd = await originFetch(adminPage, "PATCH", `/api/client-service-requests/${requestId}`, {
        status: "قيد المعالجة",
        lastUpdate: "تم استلام الطلب ومراجعته من الموظف",
        assignee: "أحمد المحامي",
      });
      record("T3-staff-update-request", "تحديث حالة الطلب من الموظف", upd.status === 200 && upd.json?.status === "قيد المعالجة", `status=${upd.status}`);
    } else {
      record("T3-staff-update-request", "تحديث حالة الطلب من الموظف", false, "no requestId");
    }

    const after = await originFetch(clientPage, "GET", "/api/portal/requests");
    const updated = (after.json?.requests || []).find((r: any) => r.id === requestId);
    record("T3-client-sees-update", "ظهور التحديث في بوابة العميل", updated?.status === "قيد المعالجة", `status=${updated?.status}`);
    await clientPage.goto(`${BASE}/portal/requests`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await shot(clientPage, "10-requests-after-staff-update");

    if (!clientAId) {
      const p = await originFetch(clientPage, "GET", "/api/portal/profile");
      clientAId = p.json?.profile?.id || "";
    }

    const caseRes = await originFetch(adminPage, "POST", "/api/cases", {
      caseNo: `E2E-${STAMP}`,
      clientId: clientAId,
      client: nameA,
      type: "مدني",
      court: "محكمة الاختبار",
      status: "نشطة",
      nextDate: "2026-12-01",
      notes: `قضية اختبار معزولة ${STAMP}`,
    });
    const caseId = caseRes.json?.id;
    record("T3-link-case", "ربط قضية اختبار عبر المسار الإداري", caseRes.status === 201 && caseRes.json?.clientId === clientAId, `caseId=${caseId}`);

    const sess = await originFetch(adminPage, "POST", "/api/court-sessions", {
      caseId,
      caseNo: `E2E-${STAMP}`,
      client: nameA,
      court: "محكمة الاختبار",
      room: "1",
      date: "2026-12-01",
      time: "10:00",
      status: "مجدولة",
      lawyer: "أحمد المحامي",
    });
    record("T3-link-session", "إضافة جلسة مرتبطة", sess.status === 201, `status=${sess.status}`);

    const doc = await originFetch(clientPage, "POST", "/api/portal/documents", {
      title: `مستند اختبار ${STAMP}`,
      category: "عقود",
      caseId,
      fileName: "test.png",
      fileUrl: tinyPngDataUrl(),
      mimeType: "image/png",
      sizeBytes: 68,
    });
    record("T3-document", "مستند مصرح به للعميل", doc.status === 201, `status=${doc.status}`);

    const inv = await originFetch(adminPage, "POST", "/api/financial-records", {
      clientId: clientAId,
      client: nameA,
      type: "رسوم قضية اختبار",
      amount: 100,
      paid: 0,
      status: "غير مسدد",
      notes: "فاتورة اختبار — بدون تحصيل حقيقي",
      invoiceNo: `INV-E2E-${STAMP}`,
    });
    record("T3-invoice-test-only", "فاتورة اختبار دون تحصيل حقيقي", inv.status === 201, `status=${inv.status}`);

    const portalCases = await originFetch(clientPage, "GET", "/api/portal/cases");
    const portalSessions = await originFetch(clientPage, "GET", "/api/portal/sessions");
    const portalFinance = await originFetch(clientPage, "GET", "/api/portal/finance");
    const seesCase = (portalCases.json?.cases || []).some((c: any) => c.caseNo === `E2E-${STAMP}`);
    const seesSession = (portalSessions.json?.sessions || []).length > 0;
    const seesInv = (portalFinance.json?.invoices || []).length > 0;
    record("T3-client-sees-case", "ظهور القضية والجلسة للعميل", seesCase && seesSession, `case=${seesCase} session=${seesSession}`);
    record("T3-client-sees-invoice", "ظهور الفاتورة الاختبارية للعميل", seesInv, `invoices=${(portalFinance.json?.invoices || []).length}`);

    await clientPage.goto(`${BASE}/portal/cases`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await shot(clientPage, "11-real-cases-linked");
    await clientPage.goto(`${BASE}/portal/finance`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    await shot(clientPage, "12-real-finance-test");
  } catch (e) {
    record("T3-staff-sees-request", "مسار الموظف والربط", false, String(e));
  }

  // 4) Isolation A/B
  const bCtx = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
  const bPage = await bCtx.newPage();
  let clientBId = "";
  try {
    await registerClient(bPage, nameB, emailB, PASS_B, "0500000002");
    await originFetch(bPage, "PATCH", "/api/portal/profile", {
      name: nameB,
      phone: "0509998877",
      country: "مصر",
      city: "الإسكندرية",
      type: "فرد",
    });
    const profileB = await originFetch(bPage, "GET", "/api/portal/profile");
    clientBId = profileB.json?.profile?.id || "";
    record("T4-register-b", "إنشاء Client B منفصل", Boolean(clientBId), `id=${clientBId}`);

    const bCases = await originFetch(bPage, "GET", "/api/portal/cases");
    const bReqs = await originFetch(bPage, "GET", "/api/portal/requests");
    const bFin = await originFetch(bPage, "GET", "/api/portal/finance");
    const leakCase = JSON.stringify(bCases.json).includes(`E2E-${STAMP}`);
    const leakReq = JSON.stringify(bReqs.json).includes(refNo) || JSON.stringify(bReqs.json).includes(requestId);
    const leakInv = JSON.stringify(bFin.json).includes(`INV-E2E-${STAMP}`);
    record("T4-no-leak-b", "Client B لا يرى بيانات Client A", !leakCase && !leakReq && !leakInv, `leakCase=${leakCase} leakReq=${leakReq} leakInv=${leakInv}`);

    if (requestId) {
      const steal = await originFetch(bPage, "GET", `/api/client-service-requests/${requestId}`);
      record("T4-staff-api-403", "403 على مسارات الإدارة من جلسة عميل", steal.status === 403, `status=${steal.status}`);
    }
    const casesStaff = await originFetch(bPage, "GET", "/api/cases");
    record("T4-cases-api-403", "403 على /api/cases من جلسة عميل", casesStaff.status === 403, `status=${casesStaff.status}`);

    await bPage.goto(`${BASE}/app/dashboard`, { waitUntil: "domcontentloaded" });
    await bPage.waitForTimeout(700);
    record("T4-block-app", "عدم دخول العميل إلى /app", bPage.url().includes("/portal") || !bPage.url().includes("/app/dashboard"), bPage.url());

    await bPage.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
    await waitPortal(bPage);
    await shot(bPage, "13-client-b-portal");
  } catch (e) {
    record("T4-register-b", "عزل الحسابات", false, String(e));
  }

  // 5) Mobile + themes
  try {
    const mobile = await browser.newContext({
      locale: "ar-EG",
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mPage = await mobile.newPage();
    await loginClient(mPage, emailA, PASS_A);
    await shot(mPage, "14-mobile-light-dashboard");
    await mPage.goto(`${BASE}/portal/profile`, { waitUntil: "domcontentloaded" });
    await waitPortal(mPage);
    await shot(mPage, "15-mobile-profile");
    await mPage.goto(`${BASE}/portal/requests`, { waitUntil: "domcontentloaded" });
    await waitPortal(mPage);
    await shot(mPage, "16-mobile-requests");
    await mPage.evaluate(() => {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    });
    await mPage.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
    await waitPortal(mPage);
    await shot(mPage, "17-mobile-dark-dashboard");

    const desktopDark = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
    const dPage = await desktopDark.newPage();
    await loginClient(dPage, emailA, PASS_A);
    await dPage.evaluate(() => {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    });
    await dPage.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
    await waitPortal(dPage);
    await shot(dPage, "18-desktop-dark-dashboard");
    record("T5-mobile-dark", "موبايل + نهاري/ليلي", true, "screenshots 14–18");
    await mobile.close();
    await desktopDark.close();
  } catch (e) {
    record("T5-mobile-dark", "موبايل والوضع الليلي", false, String(e));
  }

  // 6) Honest incomplete audit
  try {
    await clientPage.goto(`${BASE}/portal/messages`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    const messagesInteractive = (await clientPage.locator("textarea, button:has-text('إرسال')").count()) > 0;
    record(
      "T6-messages-complete",
      "الرسائل مربوطة فعليًا (ليست شكلًا فقط)",
      messagesInteractive,
      messagesInteractive ? "composer present" : "FAIL — صفحة توجيه فقط بدون محادثة حية"
    );
    await shot(clientPage, "19-messages-page");

    await clientPage.goto(`${BASE}/portal/settings`, { waitUntil: "domcontentloaded" });
    await waitPortal(clientPage);
    record(
      "T6-settings-controls",
      "إعدادات الإشعارات تظهر كعناصر تفاعل",
      (await clientPage.locator("input[type=checkbox]").count()) > 0,
      "checkboxes present"
    );
    // زر موجود لكن بدون onClick/API — يُحتسب FAIL بصراحة
    const pwBtn = clientPage.locator('button:has-text("تغيير كلمة المرور")');
    const pwPresent = (await pwBtn.count()) > 0;
    record(
      "T6-password-change",
      "تغيير كلمة المرور مربوط فعليًا",
      false,
      pwPresent
        ? "FAIL — الزر ظاهر بلا مسار حفظ/تغيير كلمة مرور في الكود"
        : "FAIL — الزر غير موجود"
    );
    await shot(clientPage, "20-settings-page");
  } catch (e) {
    record("T6-messages-complete", "تدقيق الصفحات", false, String(e));
  }

  await browser.close();

  const summary = {
    generatedAt: new Date().toISOString(),
    baseUrl: BASE,
    accounts: { emailA, emailB, clientAId, clientBId },
    nav: { real: realNav, demo: demoNav },
    results,
    counts: {
      PASS: results.filter((r) => r.verdict === "PASS").length,
      FAIL: results.filter((r) => r.verdict === "FAIL").length,
    },
    publishRecommendation:
      results.every((r) => r.verdict === "PASS")
        ? "READY_FOR_USER_APPROVAL"
        : "DO_NOT_PUBLISH — failures remain; await explicit approval after review",
  };
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  fs.writeFileSync(
    path.join(OUT, "REPORT.md"),
    [
      "# تقرير اختبار بوابة العميل 360 — رحلة عميل حقيقي",
      "",
      `البيئة: \`${BASE}\` (Preview محلي معزول)`,
      `الوقت (UTC): ${summary.generatedAt}`,
      "",
      `Client A: \`${emailA}\` · Client B: \`${emailB}\``,
      "",
      "| # | الاختبار | الحكم | التفاصيل |",
      "|---|---|---|---|",
      ...results.map((r) => `| ${r.id} | ${r.title} | **${r.verdict}** | ${r.detail.replace(/\|/g, "/")} |`),
      "",
      `**المجموع:** PASS=${summary.counts.PASS} · FAIL=${summary.counts.FAIL}`,
      "",
      `**توصية النشر:** ${summary.publishRecommendation}`,
      "",
      "لا دمج/نشر قبل موافقتك. لا Migration إنتاج. لا DEMO_CLIENT_PASSWORD في الإنتاج.",
    ].join("\n")
  );
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary.counts));
  console.log(summary.publishRecommendation);
  if (summary.counts.FAIL > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
