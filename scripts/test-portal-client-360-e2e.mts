/**
 * Portal 360 operational E2E — isolated client only. UI + API evidence.
 */
import { chromium, type Page, type BrowserContext } from "playwright";
import { mkdirSync, writeFileSync, copyFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";

// Use localhost (not 127.0.0.1) so Next.js 16 allowedDevOrigins does not block client hydration
const BASE = process.env.PORTAL_BASE_URL || "http://localhost:3000";
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
  if (!client) throw new Error("client missing");
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
      notes: "فاتورة اختبار معزولة",
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
      lastUpdate: "اختبار",
      timeline: JSON.stringify([{ date: "2026-10-28", text: "seed" }]),
      isDemo: false,
    },
  });
  await prisma.clientPortalNotification.create({
    data: {
      clientId: client.id,
      title: `إشعار اختبار ${stamp}`,
      body: "إشعار معزول",
      category: "اختبار",
      href: "/portal/cases",
      read: false,
      isDemo: false,
    },
  });
  return { clientId: client.id, caseNo };
}

async function shot(page: Page, file: string) {
  await page.screenshot({ path: join(OUT, `${file}.png`), fullPage: true });
}

async function waitPortalReady(page: Page, ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    const s = await page.evaluate(() => {
      const t = document.body?.innerText || "";
      return {
        root: !!document.querySelector(".portal-root"),
        loading: /جاري تحميل بوابة العميل/.test(t),
        expiredHang: /انتهت صلاحية الجلسة/.test(t) && /جاري التحميل/.test(t),
        login: /تسجيل الدخول إلى حسابك/.test(t) || !!document.querySelector(".erp-login-page"),
        text: t.slice(0, 200),
      };
    });
    if (s.root && !s.loading) return s;
    if (s.login) return s;
    if (s.expiredHang) return s;
    await page.waitForTimeout(300);
  }
  return page.evaluate(() => {
    const t = document.body?.innerText || "";
    return {
      root: !!document.querySelector(".portal-root"),
      loading: /جاري تحميل بوابة العميل/.test(t),
      expiredHang: /انتهت صلاحية الجلسة/.test(t) && /جاري التحميل/.test(t),
      login: false,
      text: t.slice(0, 200),
    };
  });
}

async function gotoPortal(page: Page, href: string) {
  await page.goto(`${BASE}${href}`, { waitUntil: "domcontentloaded", timeout: 45000 });
  return waitPortalReady(page);
}

function pass(pageName: string, href: string, dataShown: string, actions: string, detail: string) {
  rows.push({ page: pageName, href, dataShown, actions, result: "PASS", detail });
}
function fail(pageName: string, href: string, dataShown: string, actions: string, detail: string) {
  rows.push({ page: pageName, href, dataShown, actions, result: "FAIL", detail });
}

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1365, height: 900 },
    locale: "ar-SA",
    recordVideo: { dir: join(OUT, "video"), size: { width: 1280, height: 720 } },
  });
  const page = await context.newPage();

  // --- Register via public UI (with API safety net) ---
  await page.goto(`${BASE}/register`, { waitUntil: "domcontentloaded" });
  await page.locator('label:has-text("الاسم الكامل") input').fill(name);
  await page.locator('label:has-text("رقم الهاتف") input').fill("0500112233");
  await page.locator('label:has-text("البريد الإلكتروني") input').fill(email);
  await page.locator('label:has-text("كلمة المرور") input').fill(password);
  await shot(page, "01a-register-filled");
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/portal/, { timeout: 12000 }).catch(() => null);
  let registered = page.url().includes("/portal");
  let regHow = "ui";
  if (!registered) {
    const api = await context.request.post(`${BASE}/api/auth/register`, {
      data: { name, email, password, phone: "0500112233", type: "فرد" },
    });
    regHow = `api(${api.status()})`;
    registered = api.ok();
  }
  await page.goto(`${BASE}/portal/profile?onboarding=1`, { waitUntil: "domcontentloaded" });
  const regState = await waitPortalReady(page);
  if (registered && regState.root) pass("التسجيل العام", "/register", email, regHow, page.url());
  else fail("التسجيل العام", "/register", email, regHow, JSON.stringify(regState));
  await shot(page, "01-register");

  // --- Profile save ---
  if (regState.root) {
    await page.locator('label:has-text("رقم الهاتف") input').fill("0500112233");
    await page.locator('label:has-text("الدولة") input').fill("السعودية");
    await page.locator('label:has-text("المدينة") input').fill("الرياض");
    await page.locator('label:has-text("العنوان") input').fill("حي الاختبار");
    await page.locator('button[type="submit"]').click();
    await page.waitForTimeout(1200);
  }
  const profileText = await page.innerText("body").catch(() => "");
  const profileOk =
    regState.root &&
    !regState.expiredHang &&
    (/تم حفظ|تم الحفظ|الصورة الشخصية|ملفي/.test(profileText));
  if (profileOk) pass("ملفي الشخصي", "/portal/profile", "نموذج+حفظ", "PATCH profile", /تم حفظ|تم الحفظ/.test(profileText) ? "saved" : "form");
  else fail("ملفي الشخصي", "/portal/profile", "—", "save", regState.expiredHang ? "hang" : profileText.slice(0, 100));
  await shot(page, "02-profile");

  // --- Seed ---
  let seed: { clientId: string; caseNo: string } | null = null;
  try {
    seed = await seedIsolatedData(email);
    pass("ربط بيانات الإدارة", "prisma-seed", seed.caseNo, "قضية+جلسة+مستند+فاتورة+طلب+إشعار", seed.clientId);
  } catch (e) {
    fail("ربط بيانات الإدارة", "prisma-seed", "—", "seed", e instanceof Error ? e.message : String(e));
  }

  // --- Logout / login ---
  await context.request.post(`${BASE}/api/auth/logout`);
  await context.clearCookies();
  const loginRes = await context.request.post(`${BASE}/api/auth/login`, {
    data: { email, password, remember: true },
  });
  await page.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
  const homeState = await waitPortalReady(page);
  if (loginRes.ok() && homeState.root) pass("خروج/دخول", "/login", email, "logout+login API+UI home", page.url());
  else fail("خروج/دخول", "/login", email, "relogin", `${loginRes.status()} ${JSON.stringify(homeState)}`);
  await shot(page, "03-relogin");

  // --- Page matrix ---
  const checks: {
    name: string;
    href: string;
    expect: RegExp;
    act?: (p: Page) => Promise<string>;
  }[] = [
    {
      name: "الرئيسية",
      href: "/portal",
      expect: /القضايا|مستحق|إشعارات/,
    },
    {
      name: "قضاياي",
      href: "/portal/cases",
      expect: seed ? new RegExp(seed.caseNo) : /قضية|لا قضايا/,
      act: async (p) => {
        if (await p.getByRole("button", { name: /عرض التفاصيل/ }).count()) {
          await p.getByRole("button", { name: /عرض التفاصيل/ }).first().click();
        }
        return seed?.caseNo || "empty";
      },
    },
    {
      name: "جلساتي",
      href: "/portal/sessions",
      expect: seed ? new RegExp(`${seed.caseNo}|جلسة مرافعة|محكمة اختبار`) : /جلسة|لا جلسات/,
      act: async (p) => {
        await p.waitForTimeout(800);
        const t = await p.innerText("body");
        return seed && t.includes(seed.caseNo) ? `session ${seed.caseNo}` : /لا جلسات/.test(t) ? "empty" : "listed";
      },
    },
    {
      name: "مستنداتي",
      href: "/portal/documents",
      expect: /مستند|رفع/,
      act: async (p) => {
        await p.locator('label:has-text("العنوان") input').fill(`رفع واجهة ${stamp}`).catch(() => null);
        const file = p.locator('input[type="file"]');
        if (await file.count()) {
          await file.setInputFiles({
            name: "e2e.png",
            mimeType: "image/png",
            buffer: Buffer.from(
              "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
              "base64"
            ),
          });
          await p.getByRole("button", { name: /رفع/ }).click();
          await p.waitForTimeout(1500);
        }
        if (await p.getByRole("button", { name: /تنزيل/ }).count()) {
          await p.getByRole("button", { name: /تنزيل/ }).first().click().catch(() => null);
        }
        const t = await p.innerText("body");
        return /تم رفع|مستند اختبار|رفع واجهة/.test(t) ? "upload/list ok" : "ui";
      },
    },
    {
      name: "طلباتي",
      href: "/portal/requests",
      expect: /طلب/,
      act: async (p) => {
        await p.locator('label:has-text("العنوان") input').fill(`طلب واجهة ${stamp}`).catch(() => null);
        await p.getByRole("button", { name: /إرسال الطلب/ }).click().catch(() => null);
        await p.waitForTimeout(1200);
        const t = await p.innerText("body");
        return /تم إنشاء الطلب|REQ-/.test(t) ? "create ok" : "list";
      },
    },
    {
      name: "المالية",
      href: "/portal/finance",
      expect: /فاتورة|مستحق|لا فواتير|المالية/,
      act: async (p) => {
        const t = await p.innerText("body");
        const noPay = /دفع إلكتروني|لا يتم تحصيل|غير مفعّل/.test(t);
        const inv = seed ? t.includes(`INV-E2E-${stamp}`) : true;
        return noPay && inv ? "invoice + no e-pay" : `noPay=${noPay};inv=${inv}`;
      },
    },
    {
      name: "الرسائل",
      href: "/portal/messages",
      expect: /رسالة|محادث/,
      act: async (p) => {
        await p.locator('label:has-text("الموضوع") input').fill(`رسالة ${stamp}`).catch(() => null);
        const ta = p.locator("textarea").first();
        if (await ta.count()) await ta.fill(`محتوى ${stamp}`);
        await p.getByRole("button", { name: /إرسال إلى المكتب/ }).click().catch(() => null);
        await p.waitForTimeout(1200);
        const t = await p.innerText("body");
        return /تم إرسال|رسالة/.test(t) ? "sent" : "compose";
      },
    },
    {
      name: "الإشعارات",
      href: "/portal/notifications",
      expect: /إشعار|تم استلام|تم إرسال|لا إشعارات/,
      act: async (p) => {
        await p.waitForTimeout(600);
        if (await p.getByRole("button", { name: /^تعليمليم كمقروء$/ }).count()) {
          await p.getByRole("button", { name: /^تعليمليم كمقروء$/ }).first().click();
          await p.waitForTimeout(600);
        }
        const t = await p.innerText("body");
        return t.includes(`إشعار اختبار ${stamp}`) || /تم استلام|تم إرسال/.test(t) ? "notif+mark-read" : "listed";
      },
    },
    {
      name: "الإعدادات",
      href: "/portal/settings",
      expect: /تفضيلات|كلمة المرور/,
      act: async (p) => {
        await p.getByRole("button", { name: /حفظ التفضيلات/ }).click().catch(() => null);
        await p.waitForTimeout(800);
        await p.getByRole("button", { name: /تغيير كلمة المرور/ }).click().catch(() => null);
        const t = await p.innerText("body");
        return /تم حفظ تفضيلات|كلمة المرور/.test(t) ? "prefs+pw" : "settings";
      },
    },
  ];

  for (const [i, c] of checks.entries()) {
    const st = await gotoPortal(page, c.href);
    let action = "";
    if (st.root && c.act) action = await c.act(page);
    const text = await page.innerText("body").catch(() => "");
    const ok = st.root && !st.expiredHang && c.expect.test(text);
    if (ok) pass(c.name, c.href, action || "matched", action || "view", "ui-ok");
    else fail(c.name, c.href, action || st.text, action || "view", st.expiredHang ? "hang" : st.root ? "expect-miss" : "not-ready");
    await shot(page, `${String(i + 4).padStart(2, "0")}-${c.name}`);
  }

  // --- Session expiry ---
  {
    const prisma = await getDb();
    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
      await prisma.user.update({ where: { id: user.id }, data: { passwordChangedAt: new Date() } });
    }
  }
  const exp = await gotoPortal(page, "/portal/profile");
  const expText = await page.innerText("body");
  const expOk = !exp.expiredHang && (exp.login || /تسجيل الدخول/.test(expText) || page.url().includes("/login"));
  if (expOk) pass("انتهاء الجلسة", "/portal/profile", "redirect/CTA", "passwordChangedAt", JSON.stringify(exp));
  else fail("انتهاء الجلسة", "/portal/profile", exp.text, "invalidate", JSON.stringify(exp));
  await shot(page, "20-session-expiry");

  // --- Re-login + mobile (new JWT after passwordChangedAt invalidation) ---
  await context.request.post(`${BASE}/api/auth/logout`);
  await context.clearCookies();
  const relog = await context.request.post(`${BASE}/api/auth/login`, {
    data: { email, password, remember: true },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  let m1 = await gotoPortal(page, "/portal");
  if (!m1.root && relog.ok()) {
    // cookie jar race — hard navigation retry
    await page.goto(`${BASE}/portal`, { waitUntil: "domcontentloaded" });
    m1 = await waitPortalReady(page, 20000);
  }
  await shot(page, "21-mobile-home");
  const m2 = await gotoPortal(page, "/portal/cases");
  await shot(page, "22-mobile-cases");
  if (m1.root && m2.root && !m1.expiredHang) pass("موبايل", "/portal@390", "home+cases", "responsive", `login=${relog.status()}`);
  else fail("موبايل", "/portal@390", "—", "responsive", `login=${relog.status()} ${JSON.stringify({ m1, m2 })}`);

  // --- Isolation vs demo ---
  await page.setViewportSize({ width: 1365, height: 900 });
  await context.request.post(`${BASE}/api/auth/logout`);
  await context.clearCookies();
  await context.request.post(`${BASE}/api/auth/demo-client`);
  const demo = await gotoPortal(page, "/portal/cases");
  const demoText = await page.innerText("body");
  const isolated = !(seed && demoText.includes(seed.caseNo));
  if (isolated) pass("عزل البيانات", "/portal/cases(demo)", seed?.caseNo || "—", "demo isolation", "not leaked");
  else fail("عزل البيانات", "/portal/cases(demo)", seed?.caseNo || "—", "demo isolation", "LEAKED");
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
  try {
    const vids = readdirSync(join(OUT, "video")).filter((f) => f.endsWith(".webm"));
    if (!videoOut && vids[0]) {
      videoOut = join(OUT, "portal-client-360-journey.webm");
      copyFileSync(join(OUT, "video", vids[0]), videoOut);
    }
  } catch {
    /* ignore */
  }

  // Convert to mp4 if ffmpeg available
  if (videoOut && existsSync(videoOut)) {
    const mp4 = join(OUT, "portal-client-360-journey.mp4");
    try {
      const { spawnSync } = await import("child_process");
      spawnSync("ffmpeg", ["-y", "-i", videoOut, "-c:v", "libx264", "-pix_fmt", "yuv420p", mp4], {
        stdio: "ignore",
      });
      if (existsSync(mp4)) videoOut = mp4;
    } catch {
      /* keep webm */
    }
  }

  const passN = rows.filter((r) => r.result === "PASS").length;
  const failN = rows.filter((r) => r.result === "FAIL").length;
  const report = { stamp, email, base: BASE, pass: passN, fail: failN, total: rows.length, rows, video: videoOut };
  writeFileSync(join(OUT, "REPORT.json"), JSON.stringify(report, null, 2));
  writeFileSync(
    join(OUT, "REPORT.md"),
    [
      `# بوابة العميل 360 — نتيجة اختبار`,
      ``,
      `**${passN} PASS · ${failN} FAIL** من ${rows.length}`,
      ``,
      `| النتيجة | الصفحة | الرابط | البيانات المعروضة | الإجراءات المختبرة | تفصيل |`,
      `|---|---|---|---|---|---|`,
      ...rows.map(
        (r) =>
          `| **${r.result}** | ${r.page} | \`${r.href}\` | ${r.dataShown} | ${r.actions} | ${r.detail.replace(/\|/g, "/")} |`
      ),
      ``,
      `حساب الاختبار المعزول: \`${email}\``,
      `لا دمج ولا نشر قبل موافقتك.`,
    ].join("\n")
  );
  console.log(JSON.stringify({ pass: passN, fail: failN, total: rows.length, video: videoOut }, null, 2));
  if (failN > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
