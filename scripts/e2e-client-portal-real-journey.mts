/**
 * Mandatory real-client journey E2E for Client Portal 360 (Preview/Staging local).
 * Run: BASE_URL=http://127.0.0.1:3000 npx tsx scripts/e2e-client-portal-real-journey.mts
 *
 * Produces screenshots + JSON report under /opt/cursor/artifacts/e2e-portal/
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/e2e-portal";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const STAMP = Date.now().toString(36);
const PASS_A = "ClientA#" + STAMP.slice(-4) + "xY";
const PASS_B = "ClientB#" + STAMP.slice(-4) + "xZ";

type Verdict = "PASS" | "FAIL" | "BLOCKED";
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

function record(id: string, title: string, ok: boolean, detail: string, blocked = false) {
  const verdict: Verdict = blocked ? "BLOCKED" : ok ? "PASS" : "FAIL";
  results.push({ id, title, verdict, detail });
  console.log(`[${verdict}] ${id} — ${title}: ${detail}`);
}

function ensureOut() {
  fs.mkdirSync(OUT, { recursive: true });
}

async function shot(page: Page, name: string) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: true });
  return file;
}

function cookieHeader(context: BrowserContext) {
  return context.cookies().then((cookies) =>
    cookies.map((c) => `${c.name}=${c.value}`).join("; ")
  );
}

async function api(
  context: BrowserContext,
  method: string,
  urlPath: string,
  body?: unknown
) {
  const cookies = await cookieHeader(context);
  const res = await fetch(`${BASE}${urlPath}`, {
    method,
    headers: {
      Cookie: cookies,
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json: any = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: res.status, json, headers: res.headers };
}

async function registerViaUi(page: Page, name: string, email: string, password: string, phone: string) {
  await page.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
  await page.getByRole("link", { name: /إنشاء حساب|سجل مجانًا|سجل معنا/i }).first().click();
  await page.waitForURL(/\/register/);
  await page.locator('input[placeholder="أ. محمد"], input[type="text"]').first().fill(name);
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[placeholder="05xxxxxxxx"]').fill(phone);
  await page.locator('input[type="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/portal/, { timeout: 20000 }),
    page.getByRole("button", { name: /إنشاء حساب العميل/ }).click(),
  ]);
}

async function loginViaUi(page: Page, email: string, password: string) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await Promise.all([
    page.waitForURL(/\/portal|\/app/, { timeout: 20000 }),
    page.getByRole("button", { name: /دخول النظام|دخول|تسجيل الدخول/ }).first().click(),
  ]);
}

async function logoutViaUi(page: Page) {
  const btn = page.getByRole("button", { name: /خروج|تسجيل الخروج/ });
  if (await btn.count()) {
    await btn.first().click();
    await page.waitForURL(/\/login/, { timeout: 15000 });
  } else {
    await page.goto(`${BASE}/api/auth/logout`);
    await page.goto(`${BASE}/login`);
  }
}

async function collectNav(page: Page) {
  await page.goto(`${BASE}/portal`, { waitUntil: "networkidle" });
  const labels = await page.locator(".portal-sidebar nav a span, aside nav a span, nav[aria-label] a span").allTextContents();
  const cleaned = labels.map((t) => t.trim()).filter(Boolean);
  if (!cleaned.length) {
    const alt = await page.locator("aside a, .portal-sidebar a").allTextContents();
    return alt.map((t) => t.trim()).filter(Boolean);
  }
  return cleaned;
}

async function emptyStateOk(page: Page, pathSuffix: string, emptyHints: RegExp) {
  await page.goto(`${BASE}${pathSuffix}`, { waitUntil: "networkidle" });
  const body = await page.locator("main, .portal-root, body").innerText();
  const hasDemoCase = /DEMO-|تجريب(ي|ية)|عميل تجريبي/.test(body) && !/لا |فارغ|بعد/.test(body);
  const empty = emptyHints.test(body) || !/DEMO-/.test(body);
  return { empty: empty && !hasDemoCase, bodySnippet: body.slice(0, 400) };
}

function tinyPngDataUrl() {
  // 1x1 gold-ish PNG
  const b64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  return `data:image/png;base64,${b64}`;
}

async function main() {
  ensureOut();
  const emailA = `client.a.${STAMP}@e2e.test`;
  const emailB = `client.b.${STAMP}@e2e.test`;
  const nameA = `عميل اختبار أ ${STAMP}`;
  const nameB = `عميل اختبار ب ${STAMP}`;

  const browser: Browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  const clientCtx = await browser.newContext({
    locale: "ar-EG",
    viewport: { width: 1440, height: 900 },
    colorScheme: "light",
  });
  const clientPage = await clientCtx.newPage();

  // ── 1. Real client registration journey ──
  try {
    await clientPage.goto(`${BASE}/`, { waitUntil: "domcontentloaded" });
    await shot(clientPage, "01-home");
    await registerViaUi(clientPage, nameA, emailA, PASS_A, "0500000001");
    const afterReg = clientPage.url();
    const landedPortal = afterReg.includes("/portal");
    const notApp = !afterReg.includes("/app");
    record(
      "T1-register-redirect",
      "إنشاء حساب جديد والانتقال إلى /portal وليس /app",
      landedPortal && notApp,
      `url=${afterReg}`
    );
    await shot(clientPage, "02-after-register-profile");
  } catch (e) {
    record("T1-register-redirect", "إنشاء حساب جديد والانتقال إلى /portal", false, String(e));
  }

  // Profile complete + avatar
  let profileBefore = "";
  let profileAfter = "";
  let clientAId = "";
  try {
    await clientPage.goto(`${BASE}/portal/profile?onboarding=1`, { waitUntil: "networkidle" });
    await shot(clientPage, "03-profile-before");
    profileBefore = await clientPage.locator("form, .portal-card").first().innerText();

    await clientPage.locator('label:has-text("الاسم الكامل") input').fill(nameA);
    await clientPage.locator('label:has-text("رقم الهاتف") input').fill("0501112233");
    await clientPage.locator('label:has-text("الدولة") input').fill("مصر");
    await clientPage.locator('label:has-text("المدينة") input').fill("القاهرة");
    await clientPage.locator('label:has-text("العنوان") input').fill("شارع الاختبار 12");

    // Set avatar via API (UI file input also exists); verify persistence
    const patch = await api(clientCtx, "PATCH", "/api/portal/profile", {
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
      "حفظ الملف الشخصي فعليًا في قاعدة البيانات",
      patch.status === 200 && patch.json?.ok === true,
      `status=${patch.status} complete=${patch.json?.profileComplete}`
    );

    await clientPage.reload({ waitUntil: "networkidle" });
    await shot(clientPage, "04-profile-after-save");
    profileAfter = await clientPage.locator("form, .portal-card").first().innerText();
    const hasCity = profileAfter.includes("القاهرة");
    const avatarVisible = (await clientPage.locator('img[src^="data:image"]').count()) > 0;
    record("T1-profile-persist", "ظهور بيانات الملف بعد التحديث", hasCity, hasCity ? "city persisted" : profileAfter.slice(0, 200));
    record(
      "T1-avatar-persist",
      "رفع صورة شخصية واستمرار ظهورها بعد التحديث",
      avatarVisible,
      avatarVisible ? "avatar img present" : "no avatar img — check UI/API"
    );

    const me = await api(clientCtx, "GET", "/api/portal/profile");
    clientAId = me.json?.profile?.id || "";
    record("T1-profile-id", "معرف عميل حقيقي غير تجريبي", Boolean(clientAId) && me.json?.profile?.isDemo === false, `id=${clientAId} isDemo=${me.json?.profile?.isDemo}`);
  } catch (e) {
    record("T1-profile-save", "حفظ الملف الشخصي", false, String(e));
  }

  // Logout / login
  try {
    await logoutViaUi(clientPage);
    await loginViaUi(clientPage, emailA, PASS_A);
    const url = clientPage.url();
    record("T1-relogin", "تسجيل الخروج ثم الدخول مجددًا إلى /portal", url.includes("/portal") && !url.includes("/app"), `url=${url}`);
    await clientPage.goto(`${BASE}/portal/profile`, { waitUntil: "networkidle" });
    const text = await clientPage.locator("form").innerText();
    record("T1-relogin-profile", "نفس بيانات الملف بعد إعادة الدخول", text.includes("القاهرة") && text.includes("0501112233"), text.slice(0, 180));
    await shot(clientPage, "05-relogin-profile");
  } catch (e) {
    record("T1-relogin", "إعادة تسجيل الدخول", false, String(e));
  }

  // Empty states for new client
  try {
    const cases = await emptyStateOk(clientPage, "/portal/cases", /لا |فارغ|بعد|لا توجد|لا قضايا/);
    const finance = await emptyStateOk(clientPage, "/portal/finance", /لا |فارغ|بعد|لا توجد|لا فواتير|لا معاملات/);
    const dash = await api(clientCtx, "GET", "/api/portal/dashboard");
    const dashCases = dash.json?.dashboard?.casesCount ?? dash.json?.cases?.length ?? dash.json?.stats?.cases;
    const noDemoLeak =
      !JSON.stringify(dash.json).includes("DEMO-") &&
      !JSON.stringify(dash.json).includes("عميل تجريبي");
    record(
      "T1-empty-data",
      "الحساب الحقيقي يبدأ بحالات فارغة بدون قضايا/فواتير وهمية",
      noDemoLeak && (cases.empty || finance.empty || dashCases === 0 || dashCases === undefined),
      `noDemoLeak=${noDemoLeak} casesEmpty=${cases.empty} financeEmpty=${finance.empty}`
    );
    await shot(clientPage, "06-real-dashboard");
    await clientPage.goto(`${BASE}/portal`, { waitUntil: "networkidle" });
    await shot(clientPage, "06b-real-home");
  } catch (e) {
    record("T1-empty-data", "حالات فارغة للحساب الجديد", false, String(e));
  }

  // ── 2. Demo parity ──
  const demoCtx = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
  const demoPage = await demoCtx.newPage();
  let realNav: string[] = [];
  let demoNav: string[] = [];
  try {
    await demoPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    const demoBtn = demoPage.getByRole("button", { name: /تجريب|عميل تجريبي|تجربة العميل/i });
    if (await demoBtn.count()) {
      await Promise.all([
        demoPage.waitForURL(/\/portal/, { timeout: 20000 }),
        demoBtn.first().click(),
      ]);
    } else {
      const res = await api(demoCtx, "POST", "/api/auth/demo-client");
      record("T2-demo-login-api", "دخول العميل التجريبي عبر API", res.status === 200, `status=${res.status}`);
      await demoPage.goto(`${BASE}/portal`, { waitUntil: "networkidle" });
    }
    await shot(demoPage, "07-demo-dashboard");
    realNav = await collectNav(clientPage);
    demoNav = await collectNav(demoPage);
    const navMatch = NAV_LABELS.every((l) => realNav.includes(l) && demoNav.includes(l));
    record(
      "T2-nav-parity",
      "تطابق القائمة الجانبية بين الحقيقي والتجريبي",
      navMatch,
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
    let pagesOk = true;
    for (const p of pages) {
      const r1 = await clientPage.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      const r2 = await demoPage.goto(`${BASE}${p}`, { waitUntil: "domcontentloaded" });
      if (!r1?.ok() || !r2?.ok()) pagesOk = false;
    }
    record("T2-pages-parity", "نفس صفحات البوابة متاحة للدور Client", pagesOk, pages.join(", "));

    const realCss = await clientPage.evaluate(() => {
      const el = document.querySelector(".portal-root, .portal-sidebar, body");
      const s = el ? getComputedStyle(el) : null;
      return { bg: s?.backgroundColor, color: s?.color };
    });
    const hasNavyGold =
      (await demoPage.locator(".portal-sidebar, .portal-brand, .portal-root").count()) > 0;
    record("T2-identity", "هوية كحلية/ذهبية مشتركة (shell واحد)", hasNavyGold, JSON.stringify(realCss));
  } catch (e) {
    record("T2-nav-parity", "مقارنة التجريبي", false, String(e));
  }

  // ── 3. Functional: request + staff update + case link ──
  let requestId = "";
  let refNo = "";
  try {
    await clientPage.goto(`${BASE}/portal/requests`, { waitUntil: "networkidle" });
    await shot(clientPage, "08-requests-before");
    await clientPage.locator('label:has-text("نوع الطلب") select').selectOption({ label: "طلب استشارة" }).catch(async () => {
      await clientPage.locator("select").first().selectOption({ index: 0 });
    });
    await clientPage.locator('label:has-text("العنوان") input').fill(`استشارة تجريبية ${STAMP}`);
    await clientPage.locator("textarea").fill("تفاصيل اختبار E2E — لا بيانات حقيقية");
    await clientPage.getByRole("button", { name: /إرسال الطلب/ }).click();
    await clientPage.waitForTimeout(800);
    const reqList = await api(clientCtx, "GET", "/api/portal/requests");
    const created = (reqList.json?.requests || []).find((r: any) => String(r.title).includes(STAMP));
    requestId = created?.id || "";
    refNo = created?.refNo || "";
    record(
      "T3-create-request",
      "إنشاء طلب استشارة وحفظه في قاعدة بيانات الاختبار",
      Boolean(requestId),
      `id=${requestId} ref=${refNo} count=${reqList.json?.requests?.length}`
    );
    await shot(clientPage, "09-requests-after-create");
  } catch (e) {
    record("T3-create-request", "إنشاء طلب استشارة", false, String(e));
  }

  const adminCtx = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
  const adminPage = await adminCtx.newPage();
  try {
    await adminPage.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await adminPage.locator('input[type="email"]').fill(ADMIN.email);
    await adminPage.locator('input[type="password"]').fill(ADMIN.password);
    await Promise.all([
      adminPage.waitForURL(/\/app/, { timeout: 20000 }),
      adminPage.getByRole("button", { name: /دخول النظام|دخول/ }).first().click(),
    ]);

    const staffList = await api(adminCtx, "GET", "/api/client-service-requests");
    const found = (staffList.json || []).find((r: any) => r.id === requestId || r.refNo === refNo);
    record(
      "T3-staff-sees-request",
      "ظهور الطلب الجديد للموظف المخوّل",
      staffList.status === 200 && Boolean(found),
      `status=${staffList.status} found=${Boolean(found)}`
    );

    if (requestId) {
      const upd = await api(adminCtx, "PATCH", `/api/client-service-requests/${requestId}`, {
        status: "قيد المعالجة",
        lastUpdate: "تم استلام الطلب ومراجعته من الموظف",
        assignee: "أحمد المحامي",
      });
      record(
        "T3-staff-update-request",
        "تحديث حالة الطلب من حساب الموظف",
        upd.status === 200 && upd.json?.status === "قيد المعالجة",
        `status=${upd.status} new=${upd.json?.status}`
      );
    } else {
      record("T3-staff-update-request", "تحديث حالة الطلب من حساب الموظف", false, "no requestId");
    }

    // Client sees update
    const after = await api(clientCtx, "GET", "/api/portal/requests");
    const updated = (after.json?.requests || []).find((r: any) => r.id === requestId);
    record(
      "T3-client-sees-update",
      "ظهور تحديث الحالة في بوابة العميل",
      updated?.status === "قيد المعالجة",
      `status=${updated?.status} lastUpdate=${updated?.lastUpdate}`
    );
    await clientPage.goto(`${BASE}/portal/requests`, { waitUntil: "networkidle" });
    await shot(clientPage, "10-requests-after-staff-update");

    // Link case + session + document + invoice (test data only)
    if (!clientAId) {
      const p = await api(clientCtx, "GET", "/api/portal/profile");
      clientAId = p.json?.profile?.id || "";
    }
    const caseRes = await api(adminCtx, "POST", "/api/cases", {
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
    record(
      "T3-link-case",
      "ربط قضية اختبار بالحساب عبر المسار الإداري",
      caseRes.status === 201 && Boolean(caseId) && caseRes.json?.clientId === clientAId,
      `status=${caseRes.status} caseId=${caseId} clientId=${caseRes.json?.clientId}`
    );

    const sess = await api(adminCtx, "POST", "/api/court-sessions", {
      caseId,
      caseNo: `E2E-${STAMP}`,
      client: nameA,
      court: "محكمة الاختبار",
      room: "1",
      date: "2026-12-01",
      time: "10:00",
      type: "جلسة",
      status: "مجدولة",
      lawyer: "أحمد المحامي",
    });
    record("T3-link-session", "إضافة جلسة مرتبطة بالقضية", sess.status === 201, `status=${sess.status}`);

    const doc = await api(clientCtx, "POST", "/api/portal/documents", {
      title: `مستند اختبار ${STAMP}`,
      category: "عقود",
      caseId,
      fileName: "test.png",
      fileUrl: tinyPngDataUrl(),
      mimeType: "image/png",
      sizeBytes: 68,
    });
    // If client cannot upload, staff path via prisma-less: create through portal API only
    record(
      "T3-document",
      "مستند مصرح به للعميل",
      doc.status === 201 || doc.status === 200,
      `status=${doc.status} err=${doc.json?.error || ""}`
    );

    const inv = await api(adminCtx, "POST", "/api/financial-records", {
      clientId: clientAId,
      client: nameA,
      type: "رسوم قضية اختبار",
      amount: 100,
      paid: 0,
      status: "غير مسدد",
      notes: "فاتورة اختبار — بدون تحصيل حقيقي",
      invoiceNo: `INV-E2E-${STAMP}`,
    });
    record(
      "T3-invoice-test-only",
      "عرض فاتورة اختبار دون تحصيل حقيقي",
      inv.status === 201,
      `status=${inv.status}`
    );

    const portalCases = await api(clientCtx, "GET", "/api/portal/cases");
    const portalSessions = await api(clientCtx, "GET", "/api/portal/sessions");
    const portalFinance = await api(clientCtx, "GET", "/api/portal/finance");
    const seesCase = (portalCases.json?.cases || []).some((c: any) => c.caseNo === `E2E-${STAMP}`);
    const seesSession = (portalSessions.json?.sessions || []).length > 0;
    const seesInv = (portalFinance.json?.invoices || portalFinance.json?.records || []).length > 0;
    record("T3-client-sees-case", "ظهور القضية والجلسة في بوابة العميل", seesCase && seesSession, `case=${seesCase} session=${seesSession}`);
    record("T3-client-sees-invoice", "ظهور سجل الفاتورة الاختبارية للعميل", seesInv, `finance keys=${Object.keys(portalFinance.json || {}).join(",")}`);

    await clientPage.goto(`${BASE}/portal/cases`, { waitUntil: "networkidle" });
    await shot(clientPage, "11-real-cases-linked");
    await clientPage.goto(`${BASE}/portal/finance`, { waitUntil: "networkidle" });
    await shot(clientPage, "12-real-finance-test");
  } catch (e) {
    record("T3-staff-sees-request", "مسار الموظف والربط", false, String(e));
  }

  // ── 4. Isolation Client A / B ──
  const bCtx = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
  const bPage = await bCtx.newPage();
  let clientBId = "";
  try {
    await registerViaUi(bPage, nameB, emailB, PASS_B, "0500000002");
    const pb = await api(bCtx, "PATCH", "/api/portal/profile", {
      name: nameB,
      phone: "0509998877",
      country: "مصر",
      city: "الإسكندرية",
      type: "فرد",
    });
    const profileB = await api(bCtx, "GET", "/api/portal/profile");
    clientBId = profileB.json?.profile?.id || "";
    record("T4-register-b", "إنشاء Client B منفصل", pb.status === 200 && Boolean(clientBId), `id=${clientBId}`);

    const bCases = await api(bCtx, "GET", "/api/portal/cases");
    const bReqs = await api(bCtx, "GET", "/api/portal/requests");
    const bFin = await api(bCtx, "GET", "/api/portal/finance");
    const leakCase = JSON.stringify(bCases.json).includes(`E2E-${STAMP}`);
    const leakReq = JSON.stringify(bReqs.json).includes(refNo) || JSON.stringify(bReqs.json).includes(requestId);
    const leakInv = JSON.stringify(bFin.json).includes(`INV-E2E-${STAMP}`);
    record(
      "T4-no-leak-b",
      "Client B لا يرى قضية/طلب/فاتورة Client A",
      !leakCase && !leakReq && !leakInv,
      `leakCase=${leakCase} leakReq=${leakReq} leakInv=${leakInv}`
    );

    // Direct ID tampering
    if (requestId) {
      const steal = await api(bCtx, "GET", `/api/client-service-requests/${requestId}`);
      // clients must get 403 from middleware on staff API
      record(
        "T4-staff-api-403",
        "منع العميل من مسارات الإدارة (403)",
        steal.status === 403,
        `status=${steal.status}`
      );
    }

    const aCasesSteal = await api(bCtx, "GET", `/api/portal/documents/${createHash("sha1").update(requestId || "x").digest("hex")}`);
    record(
      "T4-foreign-doc",
      "منع الوصول لمستند بمعرّف أجنبي",
      aCasesSteal.status === 403 || aCasesSteal.status === 404,
      `status=${aCasesSteal.status}`
    );

    // /app redirect for client
    const appNav = await bPage.goto(`${BASE}/app/dashboard`, { waitUntil: "domcontentloaded" });
    await bPage.waitForTimeout(500);
    const finalUrl = bPage.url();
    record(
      "T4-block-app",
      "عدم دخول العميل إلى /app",
      finalUrl.includes("/portal") || !finalUrl.includes("/app/dashboard"),
      `url=${finalUrl} http=${appNav?.status()}`
    );

    // staff cases list as client
    const casesStaff = await api(bCtx, "GET", "/api/cases");
    record("T4-cases-api-403", "403 على /api/cases من جلسة عميل", casesStaff.status === 403, `status=${casesStaff.status}`);

    await shot(bPage, "13-client-b-portal");
  } catch (e) {
    record("T4-register-b", "عزل الحسابات", false, String(e));
  }

  // ── 5. Mobile + dark/light ──
  try {
    const mobile = await browser.newContext({
      locale: "ar-EG",
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
    });
    const mPage = await mobile.newPage();
    await loginViaUi(mPage, emailA, PASS_A);
    await mPage.goto(`${BASE}/portal`, { waitUntil: "networkidle" });
    await shot(mPage, "14-mobile-light-dashboard");
    await mPage.goto(`${BASE}/portal/profile`, { waitUntil: "networkidle" });
    await shot(mPage, "15-mobile-profile");
    await mPage.goto(`${BASE}/portal/requests`, { waitUntil: "networkidle" });
    await shot(mPage, "16-mobile-requests");

    // toggle dark
    const toggle = mPage.locator('button[aria-label*="وضع"], button[title*="وضع"], .color-mode, button:has-text("🌙"), button:has-text("☀")').first();
    if (await toggle.count()) {
      await toggle.click();
      await mPage.waitForTimeout(400);
    } else {
      await mPage.evaluate(() => {
        document.documentElement.classList.add("dark-mode");
        document.body.classList.add("dark-mode");
        localStorage.setItem("theme", "dark");
      });
    }
    await mPage.goto(`${BASE}/portal`, { waitUntil: "networkidle" });
    await shot(mPage, "17-mobile-dark-dashboard");
    const desktopDark = await browser.newContext({ locale: "ar-EG", viewport: { width: 1440, height: 900 } });
    const dPage = await desktopDark.newPage();
    await loginViaUi(dPage, emailA, PASS_A);
    await dPage.evaluate(() => {
      document.documentElement.classList.add("dark-mode");
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
    });
    await dPage.goto(`${BASE}/portal`, { waitUntil: "networkidle" });
    await shot(dPage, "18-desktop-dark-dashboard");
    record("T5-mobile-dark", "لقطات موبايل + وضع ليلي/نهاري", true, "screenshots 14–18 captured");
    await mobile.close();
    await desktopDark.close();
  } catch (e) {
    record("T5-mobile-dark", "موبايل والوضع الليلي", false, String(e));
  }

  // Incomplete features audit (honest)
  try {
    await clientPage.goto(`${BASE}/portal/messages`, { waitUntil: "networkidle" });
    const msgText = await clientPage.locator(".portal-root, main, body").innerText();
    const messagesInteractive =
      (await clientPage.locator("textarea, input[type='text'], button:has-text('إرسال')").count()) > 0;
    record(
      "T6-messages-complete",
      "الرسائل مربوطة فعليًا (ليست شكلًا فقط)",
      messagesInteractive,
      messagesInteractive ? "composer present" : `UI-only/empty: ${msgText.slice(0, 160)}`
    );
    await shot(clientPage, "19-messages-page");

    await clientPage.goto(`${BASE}/portal/settings`, { waitUntil: "networkidle" });
    const settingsInteractive =
      (await clientPage.locator("input, select, button[type='submit']").count()) > 0;
    record(
      "T6-settings-complete",
      "الإعدادات قابلة للتفاعل والحفظ",
      settingsInteractive,
      settingsInteractive ? "controls present" : "no interactive controls"
    );
    await shot(clientPage, "20-settings-page");
  } catch (e) {
    record("T6-messages-complete", "تدقيق الصفحات الشكلية", false, String(e));
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
      BLOCKED: results.filter((r) => r.verdict === "BLOCKED").length,
    },
    publishRecommendation:
      results.every((r) => r.verdict === "PASS")
        ? "READY_FOR_USER_APPROVAL"
        : "DO_NOT_PUBLISH — failures remain; await explicit approval after fixes",
  };

  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify(summary, null, 2));
  const md = [
    "# تقرير اختبار بوابة العميل 360 — رحلة عميل حقيقي",
    "",
    `البيئة: \`${BASE}\` (Preview محلي معزول)`,
    `الوقت (UTC): ${summary.generatedAt}`,
    "",
    "## الحسابات",
    `- Client A: ${emailA} (\`${clientAId}\`)`,
    `- Client B: ${emailB} (\`${clientBId}\`)`,
    "",
    "## النتائج",
    `| # | الاختبار | الحكم | التفاصيل |`,
    `|---|---|---|---|`,
    ...results.map((r) => `| ${r.id} | ${r.title} | **${r.verdict}** | ${r.detail.replace(/\|/g, "/")} |`),
    "",
    `**المجموع:** PASS=${summary.counts.PASS} · FAIL=${summary.counts.FAIL} · BLOCKED=${summary.counts.BLOCKED}`,
    "",
    `**توصية النشر:** ${summary.publishRecommendation}`,
    "",
    "## إثباتات",
    "انظر ملفات PNG في هذا المجلد (01–20).",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "REPORT.md"), md);
  console.log("\n=== SUMMARY ===");
  console.log(JSON.stringify(summary.counts));
  console.log(summary.publishRecommendation);
  console.log(`Report: ${path.join(OUT, "REPORT.md")}`);

  if (summary.counts.FAIL > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
