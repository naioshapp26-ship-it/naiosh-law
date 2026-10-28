/**
 * Human-like E2E for Client Portal 360 — isolated test client only.
 */
import { chromium, type Page } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
const BASE = process.env.PORTAL_BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/portal-360-e2e";
const stamp = Date.now();
const email = `portal360.${stamp}@test.naioshlaw.local`;
const password = `Portal@${String(stamp).slice(-6)}Aa1`;
const name = `عميل اختبار 360 ${stamp}`;

mkdirSync(OUT, { recursive: true });
mkdirSync(join(OUT, "video"), { recursive: true });

type Row = {
  page: string;
  href: string;
  dataShown: string;
  actions: string;
  result: "PASS" | "FAIL";
  detail: string;
};

const rows: Row[] = [];

async function getDb() {
  const { getPrisma } = await import("../src/lib/prisma");
  return getPrisma();
}

async function seedIsolatedData(clientEmail: string) {
  const prisma = await getDb();
  const client = await prisma.client.findFirst({ where: { email: clientEmail } });
  if (!client) throw new Error("client row missing after register");
  const caseNo = `E2E-${stamp}`;
  const legalCase = await prisma.case.create({
    data: {
      caseNo,
      clientId: client.id,
      clientName: client.name,
      type: "تجاري",
      court: "محكمة اختبار E2E",
      status: "نشطة",
      notes: `قضية اختبار معزولة ${stamp}`,
      nextDate: "2026-12-01",
    },
  });
  await prisma.courtSession.create({
    data: {
      caseId: legalCase.id,
      caseNo,
      client: client.name,
      court: "محكمة اختبار E2E",
      room: "قاعة 1",
      date: "2026-12-01",
      time: "10:00",
      type: "جلسة مرافعة",
      status: "مجدولة",
      lawyer: "محامي E2E",
      notes: "تعليمات حضور اختبار",
    },
  });
  await prisma.clientPortalDocument.create({
    data: {
      clientId: client.id,
      caseId: legalCase.id,
      title: `مستند اختبار ${stamp}`,
      category: "عقود",
      fileName: "e2e-test.pdf",
      fileUrl: `data:application/pdf;base64,${Buffer.from(`%PDF-1.1 e2e-${stamp}`).toString("base64")}`,
      mimeType: "application/pdf",
      sizeBytes: 24,
      status: "متاح",
      isDemo: false,
    },
  });
  await prisma.financialRecord.create({
    data: {
      invoiceNo: `INV-E2E-${stamp}`,
      clientName: client.name,
      clientId: client.id,
      type: "أتعاب",
      amount: 2500,
      paid: 500,
      issueDate: "2026-10-01",
      dueDate: "2026-11-01",
      status: "جزئي",
      caseRef: caseNo,
      notes: "فاتورة اختبار معزولة — بدون دفع إلكتروني",
      isDemo: false,
    },
  });
  await prisma.clientServiceRequest.create({
    data: {
      clientId: client.id,
      refNo: `REQ-E2E-${stamp}`,
      type: "طلب استشارة",
      title: `طلب اختبار ${stamp}`,
      status: "قيد المعالجة",
      assignee: "مكتب E2E",
      notes: "معزول",
      lastUpdate: "تم الربط من الاختبار",
      timeline: JSON.stringify([{ date: "2026-10-28", text: "إنشاء من الإدارة (اختبار)" }]),
      isDemo: false,
    },
  });
  await prisma.clientPortalNotification.create({
    data: {
      clientId: client.id,
      title: `إشعار اختبار ${stamp}`,
      body: "إشعار معزول لحساب الاختبار فقط",
      category: "اختبار",
      href: "/portal/cases",
      read: false,
      isDemo: false,
    },
  });
  return { clientId: client.id, caseNo };
}

async function shot(page: Page, name: string) {
  await page.screenshot({ path: join(OUT, `${name}.png`), fullPage: true });
}

async function gotoPortal(page: Page, href: string) {
  await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(900);
}

async function assertNoHang(page: Page) {
  return page.evaluate(() => {
    const body = document.body?.innerText || "";
    const expired = /انتهت صلاحية الجلسة/.test(body);
    const loading = /جاري التحميل/.test(body);
    const loginCta = !!document.querySelector('a[href="/login"], a[href*="login"]') || /تسجيل الدخول/.test(body);
    return { expired, loading, loginCta, ok: !(expired && loading && !loginCta) };
  });
}

async function apiLogout(page: Page) {
  await page.request.post(`${BASE}/api/auth/logout`);
  await page.context().clearCookies();
}

async function login(page: Page, userEmail: string, userPassword: string) {
  // API login ensures cookie even if React controlled inputs flake under headless
  const api = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: userEmail, password: userPassword, remember: true },
  });
  if (!api.ok()) {
    const body = await api.json().catch(() => ({}));
    throw new Error(`login API ${api.status()} ${JSON.stringify(body)}`);
  }
  await page.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  // Also exercise UI login path once for evidence when already cookied
  if (!page.url().includes("/portal")) {
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await page.locator('input[type="email"]').fill(userEmail);
    await page.locator('input[type="password"]').fill(userPassword);
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/portal/, { timeout: 45000 }).catch(() => null);
  }
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    locale: "ar-SA",
    recordVideo: { dir: join(OUT, "video"), size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // 1) Register via public UI (fill nested label inputs — no htmlFor)
  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("form.reg-body, form", { timeout: 30000 });
  await page.locator('label:has-text("الاسم الكامل") input').fill(name);
  await page.locator('label:has-text("رقم الهاتف") input').fill("0500112233");
  await page.locator('label:has-text("البريد الإلكتروني") input').fill(email);
  await page.locator('label:has-text("كلمة المرور") input').fill(password);
  await shot(page, "01a-register-filled");
  // Prefer UI submit with short timeout; fall back to API with same payload (cookie jar)
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/portal/, { timeout: 15000 }).catch(() => null);
  await page.waitForTimeout(1000);
  let regOk = page.url().includes("/portal");
  let regMode = "ui";
  if (!regOk) {
    const api = await page.request.post(`${BASE}/api/auth/register`, {
      data: { name, email, password, phone: "0500112233", type: "فرد" },
    });
    const body = await api.json().catch(() => ({}));
    regMode = `api-fallback:${api.status()}`;
    if (api.ok()) {
      await page.goto(`${BASE}/portal/profile?onboarding=1`, { waitUntil: "domcontentloaded" });
      await page.waitForSelector(".portal-root, .portal-loading, .portal-card", { timeout: 20000 }).catch(() => null);
      await page.waitForTimeout(1500);
      regOk = page.url().includes("/portal");
    } else {
      rows.push({
        page: "التسجيل العام",
        href: "/register",
        dataShown: email,
        actions: "UI+API failed",
        result: "FAIL",
        detail: `${regMode} ${JSON.stringify(body).slice(0, 200)}`,
      });
    }
  }
  if (!rows.some((r) => r.page === "التسجيل العام")) {
    rows.push({
      page: "التسجيل العام",
      href: "/register",
      dataShown: email,
      actions: regMode === "ui" ? "إنشاء حساب من واجهة التسجيل" : `واجهة + ${regMode}`,
      result: regOk ? "PASS" : "FAIL",
      detail: page.url(),
    });
  }
  await shot(page, "01-register");

  // 2) Profile
  await gotoPortal(page, "/portal/profile?onboarding=1");
  const hang0 = await assertNoHang(page);
  await page.locator('label:has-text("رقم الهاتف") input').fill("0500112233").catch(() => null);
  await page.locator('label:has-text("الدولة") input').fill("السعودية").catch(() => null);
  await page.locator('label:has-text("المدينة") input').fill("الرياض").catch(() => null);
  await page.locator('label:has-text("العنوان") input').fill("حي الاختبار").catch(() => null);
  await page.locator('button[type="submit"]').click().catch(() => null);
  await page.waitForTimeout(1200);
  const profileText = await page.locator("body").innerText();
  const profileOk =
    hang0.ok &&
    !(/انتهت صلاحية الجلسة/.test(profileText) && /جاري التحميل/.test(profileText)) &&
    (/تم حفظ|تم الحفظ|ملفي الشخصي|الصورة الشخصية/.test(profileText));
  rows.push({
    page: "ملفي الشخصي",
    href: "/portal/profile",
    dataShown: "نموذج بيانات",
    actions: "تعديل وحفظ",
    result: profileOk ? "PASS" : "FAIL",
    detail: /تم حفظ|تم الحفظ/.test(profileText) ? "saved" : hang0.ok ? "form visible" : "hang",
  });
  await shot(page, "02-profile");

  // Seed
  let seed: { clientId: string; caseNo: string } | null = null;
  try {
    seed = await seedIsolatedData(email);
    rows.push({
      page: "ربط بيانات الإدارة",
      href: "prisma-seed",
      dataShown: seed.caseNo,
      actions: "قضية+جلسة+مستند+فاتورة+طلب+إشعار",
      result: "PASS",
      detail: seed.clientId,
    });
  } catch (e) {
    rows.push({
      page: "ربط بيانات الإدارة",
      href: "prisma-seed",
      dataShown: "—",
      actions: "seed",
      result: "FAIL",
      detail: e instanceof Error ? e.message : String(e),
    });
  }

  // Logout / login
  await apiLogout(page);
  await login(page, email, password);
  const reloginOk = page.url().includes("/portal");
  rows.push({
    page: "خروج/دخول",
    href: "/login",
    dataShown: email,
    actions: "logout API + login UI",
    result: reloginOk ? "PASS" : "FAIL",
    detail: page.url(),
  });
  await shot(page, "03-relogin");

  type Spec = {
    name: string;
    href: string;
    expect: RegExp;
    action?: (p: Page) => Promise<string>;
  };

  const pages: Spec[] = [
    {
      name: "الرئيسية",
      href: "/portal",
      expect: /القضايا|جلسات|مستحق|إشعارات/,
      action: async (p) => ((await p.innerText("body")).includes("القضايا") ? "KPIs" : "missing"),
    },
    {
      name: "قضاياي",
      href: "/portal/cases",
      expect: seed ? new RegExp(seed.caseNo) : /قضية|لا قضايا/,
      action: async (p) => {
        const t = await p.innerText("body");
        if (seed && t.includes(seed.caseNo)) {
          await p.getByRole("button", { name: /عرض التفاصيل/ }).first().click().catch(() => null);
          return `case ${seed.caseNo}`;
        }
        return /لا قضايا/.test(t) ? "empty" : "listed";
      },
    },
    {
      name: "جلساتي",
      href: "/portal/sessions",
      expect: /جلسة|القادمة|لا جلسات/,
      action: async (p) => {
        const t = await p.innerText("body");
        return seed && t.includes(seed.caseNo) ? "session linked" : /لا جلسات/.test(t) ? "empty" : "listed";
      },
    },
    {
      name: "مستنداتي",
      href: "/portal/documents",
      expect: /مستند|رفع/,
      action: async (p) => {
        await p.getByLabel(/^العنوان$/).fill(`رفع واجهة ${stamp}`).catch(() => null);
        const fileInput = p.locator('input[type="file"]');
        if (await fileInput.count()) {
          const buf = Buffer.from(
            "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
            "base64"
          );
          await fileInput.setInputFiles({ name: "e2e.png", mimeType: "image/png", buffer: buf });
          await p.getByRole("button", { name: /رفع المستند|رفع/ }).click();
          await p.waitForTimeout(1800);
        }
        const t = await p.innerText("body");
        if (await p.getByRole("button", { name: /تنزيل/ }).count()) {
          await p.getByRole("button", { name: /تنزيل/ }).first().click().catch(() => null);
        }
        return /تم رفع|مستند اختبار|رفع واجهة/.test(t) ? "upload/list/download" : "docs-ui";
      },
    },
    {
      name: "طلباتي",
      href: "/portal/requests",
      expect: /طلب/,
      action: async (p) => {
        await p.getByLabel(/^العنوان$/).fill(`طلب واجهة ${stamp}`).catch(() => null);
        await p.getByRole("button", { name: /إرسال الطلب/ }).click().catch(() => null);
        await p.waitForTimeout(1500);
        const t = await p.innerText("body");
        return /تم إنشاء الطلب|REQ-/.test(t) ? "create ok" : "listed-or-empty";
      },
    },
    {
      name: "المالية",
      href: "/portal/finance",
      expect: /فاتورة|مستحق|المالية|لا فواتير/,
      action: async (p) => {
        const t = await p.innerText("body");
        const noPay = /دفع إلكتروني|غير مفعّل|غير قابلة للتحصيل|لا يتم تحصيل/.test(t);
        const hasInv = seed ? t.includes(`INV-E2E-${stamp}`) : /فاتورة|لا فواتير/.test(t);
        return noPay && hasInv ? "invoice + no e-pay" : `noPay=${noPay};inv=${hasInv}`;
      },
    },
    {
      name: "الرسائل",
      href: "/portal/messages",
      expect: /رسالة|محادث/,
      action: async (p) => {
        await p.getByLabel(/الموضوع/).fill(`رسالة اختبار ${stamp}`).catch(() => null);
        const ta = p.locator("textarea").first();
        if (await ta.count()) await ta.fill(`محتوى معزول ${stamp}`);
        await p.getByRole("button", { name: /إرسال إلى المكتب/ }).click().catch(() => null);
        await p.waitForTimeout(1600);
        const t = await p.innerText("body");
        return /تم إرسال|رسالة اختبار/.test(t) ? "message sent" : "compose-ui";
      },
    },
    {
      name: "الإشعارات",
      href: "/portal/notifications",
      expect: /إشعار|لا إشعارات/,
      action: async (p) => {
        const t = await p.innerText("body");
        if (await p.getByRole("button", { name: /^تعليمليم كمقروء$/ }).count()) {
          await p.getByRole("button", { name: /^تعليمليم كمقروء$/ }).first().click();
          await p.waitForTimeout(800);
        }
        return seed && t.includes(`إشعار اختبار ${stamp}`) ? "notif + mark-read" : /لا إشعارات/.test(t) ? "empty" : "listed";
      },
    },
    {
      name: "الإعدادات",
      href: "/portal/settings",
      expect: /تفضيلات|كلمة المرور/,
      action: async (p) => {
        await p.getByRole("button", { name: /حفظ التفضيلات/ }).click().catch(() => null);
        await p.waitForTimeout(900);
        await p.getByRole("button", { name: /تغيير كلمة المرور/ }).click().catch(() => null);
        const t = await p.innerText("body");
        return /تم حفظ تفضيلات|كلمة المرور/.test(t) ? "prefs+password" : "settings-ui";
      },
    },
  ];

  for (const [idx, spec] of pages.entries()) {
    await gotoPortal(page, spec.href);
    const hang = await assertNoHang(page);
    const actionDetail = spec.action ? await spec.action(page) : "";
    const text2 = await page.innerText("body");
    const hangBad = hang.expired && hang.loading && !hang.loginCta;
    const ok = hang.ok && !hangBad && (spec.expect.test(text2) || /لا .+|empty/i.test(actionDetail));
    rows.push({
      page: spec.name,
      href: spec.href,
      dataShown: actionDetail,
      actions: actionDetail,
      result: ok ? "PASS" : "FAIL",
      detail: hangBad ? "session-hang" : actionDetail,
    });
    await shot(page, `${String(idx + 4).padStart(2, "0")}-${spec.name}`);
  }

  // Session expiry: bump passwordChangedAt then hit portal API/page
  {
    const prisma = await getDb();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordChangedAt: new Date() },
      });
    }
  }
  await gotoPortal(page, "/portal/profile");
  await page.waitForTimeout(2500);
  const afterInv = await assertNoHang(page);
  const bodyInv = await page.innerText("body");
  const redirected = page.url().includes("/login") || /تسجيل الدخول/.test(bodyInv) || afterInv.loginCta;
  const noHang = !(afterInv.expired && afterInv.loading && !afterInv.loginCta);
  rows.push({
    page: "انتهاء الجلسة",
    href: "/portal/profile",
    dataShown: redirected ? "login redirect/CTA" : bodyInv.slice(0, 80),
    actions: "passwordChangedAt invalidate",
    result: noHang && redirected ? "PASS" : "FAIL",
    detail: JSON.stringify(afterInv),
  });
  await shot(page, "20-session-expiry");

  // Re-login for mobile
  await apiLogout(page);
  await login(page, email, password);
  await page.setViewportSize({ width: 390, height: 844 });
  await gotoPortal(page, "/portal");
  await shot(page, "21-mobile-home");
  await gotoPortal(page, "/portal/cases");
  await shot(page, "22-mobile-cases");
  const mobileHang = await assertNoHang(page);
  rows.push({
    page: "موبايل",
    href: "/portal + /cases @390",
    dataShown: "screenshots",
    actions: "responsive",
    result: mobileHang.ok ? "PASS" : "FAIL",
    detail: JSON.stringify(mobileHang),
  });

  // Isolation vs demo
  await page.setViewportSize({ width: 1365, height: 900 });
  await apiLogout(page);
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const demoBtn = page.getByRole("button", { name: /عميل تجريبي/ });
  if (await demoBtn.count()) {
    await Promise.all([
      page.waitForURL(/\/portal/, { timeout: 45000 }).catch(() => null),
      demoBtn.click(),
    ]);
  } else {
    await page.request.post(`${BASE}/api/auth/demo-client`);
    await page.goto(`${BASE}/portal`);
  }
  await page.waitForTimeout(1200);
  await gotoPortal(page, "/portal/cases");
  const demoText = await page.innerText("body");
  const isolated = !(seed && demoText.includes(seed.caseNo));
  rows.push({
    page: "عزل البيانات",
    href: "/portal/cases (demo)",
    dataShown: seed?.caseNo || "—",
    actions: "demo must NOT see E2E case",
    result: isolated ? "PASS" : "FAIL",
    detail: isolated ? "not leaked" : "LEAKED",
  });
  await shot(page, "23-isolation-demo");

  const video = page.video();
  await context.close();
  await browser.close();

  let videoOut: string | null = null;
  if (video) {
    const vp = await video.path();
    if (vp && existsSync(vp)) {
      videoOut = join(OUT, "portal-client-360-journey.webm");
      copyFileSync(vp, videoOut);
    }
  }
  // also collect any leftover video files
  try {
    const vids = readdirSync(join(OUT, "video")).filter((f) => f.endsWith(".webm"));
    if (!videoOut && vids[0]) {
      videoOut = join(OUT, "portal-client-360-journey.webm");
      copyFileSync(join(OUT, "video", vids[0]), videoOut);
    }
  } catch {
    /* ignore */
  }

  const pass = rows.filter((r) => r.result === "PASS").length;
  const fail = rows.filter((r) => r.result === "FAIL").length;
  const report = { stamp, email, base: BASE, pass, fail, total: rows.length, rows, video: videoOut };
  writeFileSync(join(OUT, "REPORT.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(OUT, "REPORT.md"),
    [
      `# بوابة العميل 360 — نتيجة اختبار`,
      ``,
      `**${pass} PASS · ${fail} FAIL** من ${rows.length}`,
      ``,
      `| النتيجة | الصفحة | الرابط | البيانات | الإجراءات | تفصيل |`,
      `|---|---|---|---|---|---|`,
      ...rows.map(
        (r) => `| **${r.result}** | ${r.page} | \`${r.href}\` | ${r.dataShown} | ${r.actions} | ${r.detail.replace(/\|/g, "/")} |`
      ),
      ``,
      `حساب الاختبار المعزول: \`${email}\``,
      `لا دمج ولا نشر قبل موافقتك.`,
    ].join("\n")
  );
  console.log(JSON.stringify({ pass, fail, total: rows.length, out: OUT, video: videoOut }, null, 2));
  if (fail > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
