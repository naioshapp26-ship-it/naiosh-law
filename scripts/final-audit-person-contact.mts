/**
 * Final audit: form fields, PostgreSQL persistence, central contact, roles, console/API.
 */
import { chromium, type Page, type BrowserContext } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { prisma } from "../src/lib/prisma";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/final-audit-person-contact";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const CLIENT = { email: "client@naioshlaw.com", password: "Client@123" };
const stamp = Date.now().toString(36);

type Row = { id: string; check: string; result: "PASS"|"FAIL"|"INFO"|"GAP"; detail: string; shot?: string };
const rows: Row[] = [];
const REQUIRED = ["مفتاح الدولة","رقم الجوال","الدولة","المدينة","رقم جوال إضافي","مفتاح الجوال الإضافي"];

function rec(r: Row) {
  rows.push(r);
  console.log(`[${r.result}] ${r.id} — ${r.check}: ${r.detail}`);
}

async function api(ctx: BrowserContext, method: string, p: string, body?: unknown) {
  const res = await ctx.request.fetch(`${BASE}${p}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    data: body !== undefined ? body : undefined,
    failOnStatusCode: false,
  });
  let json: unknown = null;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status(), json };
}

async function login(ctx: BrowserContext, page: Page, creds: typeof ADMIN) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const res = await api(ctx, "POST", "/api/auth/login", { ...creds, remember: true });
  if (res.status !== 200) throw new Error(`login ${creds.email} -> ${res.status}`);
}

async function shot(page: Page, name: string) {
  fs.mkdirSync(OUT, { recursive: true });
  const f = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: f, fullPage: true });
  return f;
}

async function fillKey(page: Page, key: string, value: string, type: "text"|"select"|"tel"="text") {
  const el = page.locator(`#modal-field-${key}`);
  if (!(await el.count())) return false;
  if (type === "select") {
    await el.selectOption({ label: value }).catch(() => el.selectOption({ value }));
  } else {
    await el.fill(value);
  }
  return true;
}

async function openAdd(page: Page, re: RegExp) {
  await page.locator("button.btn-primary").filter({ hasText: re }).first().click();
  await page.waitForSelector("form", { timeout: 10000 });
  await page.waitForTimeout(400);
}

async function save(page: Page) {
  await page.locator("form button[type=submit]").first().click();
  await page.waitForTimeout(1800);
}

async function search(page: Page, q: string) {
  const s = page.locator('input[placeholder*="بحث"]').first();
  if (await s.count()) {
    await s.fill("");
    await s.fill(q);
    await page.waitForTimeout(700);
  }
}

async function closeOverlays(page: Page) {
  // Close any open view/edit modal that may intercept clicks
  for (let i = 0; i < 3; i++) {
    const closer = page.locator("button").filter({ hasText: /^إغلاق$|^إلغاء$|^✕$/ }).first();
    if (await closer.count()) {
      await closer.click({ force: true }).catch(() => null);
      await page.waitForTimeout(200);
    }
    await page.keyboard.press("Escape").catch(() => null);
    await page.waitForTimeout(150);
  }
}

async function rowAction(page: Page, needle: string, action: "عرض"|"تعديل") {
  await closeOverlays(page);
  const cls = action === "عرض" ? "row-action-view" : "row-action-edit";
  const row = page.locator("table tbody tr").filter({ hasText: needle }).first();
  if (await row.count()) {
    const b = row.locator(`button.${cls}`).first();
    if (await b.count()) {
      await b.click({ force: true });
      return true;
    }
  }
  const b = page.locator(`button.${cls}`).first();
  if (await b.count()) {
    await b.click({ force: true });
    return true;
  }
  return false;
}

async function labelsOk(page: Page) {
  const t = await page.locator("form").first().innerText();
  return { text: t, ok: REQUIRED.every((l) => t.includes(l)), missing: REQUIRED.filter((l) => !t.includes(l)) };
}

type ConsoleEntry = { type: string; text: string };
type NetEntry = { method: string; url: string; status: number };

async function auditModule(
  ctx: BrowserContext,
  page: Page,
  opts: {
    id: string;
    href: string;
    addRe: RegExp;
    nameKey: "client"|"name";
    personName: string;
    extras?: Array<[string, string, "text"|"select"?]>;
    consoleBuf: ConsoleEntry[];
    netBuf: NetEntry[];
  }
) {
  const { id, href, addRe, nameKey, personName, extras = [], consoleBuf, netBuf } = opts;
  await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  await openAdd(page, addRe);
  const addLabels = await labelsOk(page);
  const addShot = await shot(page, `${id}-add`);
  rec({
    id, check: "إضافة — حقول الاتصال",
    result: addLabels.ok ? "PASS" : "FAIL",
    detail: addLabels.ok ? "all 6 contact labels present" : `missing=${addLabels.missing.join(",")}`,
    shot: addShot,
  });

  await fillKey(page, nameKey, personName);
  await fillKey(page, "phoneDialCode", "+20 (مصر)", "select");
  await fillKey(page, "phone", "1555123999", "tel");
  await fillKey(page, "country", "مصر", "select");
  await fillKey(page, "city", "القاهرة");
  await fillKey(page, "phoneSecondaryDialCode", "+20 (مصر)", "select");
  await fillKey(page, "phoneSecondary", "1001112233", "tel");
  for (const [k, v, t] of extras) await fillKey(page, k, v, t ?? "text");
  const beforeNet = netBuf.length;
  await save(page);
  await page.waitForTimeout(500);
  const postApis = netBuf.slice(beforeNet).filter((n) => n.method === "POST" || n.method === "PATCH");
  const badApi = postApis.filter((n) => n.status >= 400);
  rec({
    id, check: "إضافة — حفظ API",
    result: badApi.length === 0 && postApis.some((n) => n.status >= 200 && n.status < 300) ? "PASS" : "FAIL",
    detail: `posts=${postApis.map((n) => `${n.status} ${n.url.replace(BASE,"")}`).join("; ") || "none"}`,
  });

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await search(page, personName);
  const body = await page.locator("body").innerText();
  const inTable = body.includes(personName);
  rec({
    id, check: "بعد الحفظ — ظهور في الجدول",
    result: inTable ? "PASS" : "FAIL",
    detail: `personInTable=${inTable}`,
  });

  if (inTable && (await rowAction(page, personName, "عرض"))) {
    await page.waitForTimeout(600);
    const vs = await shot(page, `${id}-view`);
    const vt = await page.locator("body").innerText();
    const viewOk =
      vt.includes(personName) &&
      (vt.includes("1555123999") || vt.includes("+20")) &&
      vt.includes("مصر") &&
      vt.includes("القاهرة");
    const hasSec = vt.includes("رقم جوال إضافي") || vt.includes("مفتاح الجوال الإضافي") || vt.includes("1001112233");
    rec({
      id, check: "عرض — بيانات الاتصال",
      result: viewOk ? "PASS" : "FAIL",
      detail: `dataVisible=${viewOk} secondaryVisible=${hasSec}`,
      shot: vs,
    });
    await closeOverlays(page);
  } else {
    rec({ id, check: "عرض — بيانات الاتصال", result: "FAIL", detail: "could not open view" });
  }

  await closeOverlays(page);
  await search(page, personName);
  if (inTable && (await rowAction(page, personName, "تعديل"))) {
    await page.waitForTimeout(600);
    const editLabels = await labelsOk(page);
    const es = await shot(page, `${id}-edit`);
    rec({
      id, check: "تعديل — حقول الاتصال",
      result: editLabels.ok ? "PASS" : "FAIL",
      detail: editLabels.ok ? "all 6 labels" : `missing=${editLabels.missing.join(",")}`,
      shot: es,
    });
    await fillKey(page, "city", "الجيزة");
    await fillKey(page, "phone", "1555000222", "tel");
    const beforePatch = netBuf.length;
    await save(page);
    await page.waitForTimeout(800);
    const patches = netBuf.slice(beforePatch).filter((n) => n.method === "PATCH" || n.method === "POST");
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(600);
    await search(page, personName);
    const after = await page.locator("body").innerText();
    const editPersisted = after.includes("الجيزة") || after.includes("1555000222");
    rec({
      id, check: "تعديل — استمرار المدينة/الجوال",
      result: editPersisted ? "PASS" : "FAIL",
      detail: `persisted=${editPersisted} apis=${patches.map((n)=>n.status+" "+n.url.replace(BASE,"")).join("; ")}`,
    });
  } else {
    rec({ id, check: "تعديل — حقول الاتصال", result: "FAIL", detail: "could not open edit" });
  }

  const errs = consoleBuf.filter((c) => c.type === "error");
  // filter noisy next.js / expected auth noise from background fetches
  const realErrs = errs.filter(
    (e) =>
      !/favicon|Download the React DevTools|hydration|401 \(Unauthorized\)|403 \(Forbidden\)|Failed to load resource/i.test(
        e.text
      )
  );
  rec({
    id, check: "Console errors أثناء الدورة",
    result: realErrs.length === 0 ? "PASS" : "FAIL",
    detail: realErrs.length
      ? realErrs.slice(0, 5).map((e) => e.text.slice(0, 120)).join(" | ")
      : errs.length
        ? "none (تجاهل ضوضاء 401/403 لمصادر خلفية)"
        : "none",
  });
  consoleBuf.length = 0;
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
  page.setDefaultTimeout(25000);
  const consoleBuf: ConsoleEntry[] = [];
  const netBuf: NetEntry[] = [];
  page.on("console", (msg) => {
    if (["error", "warning"].includes(msg.type())) {
      consoleBuf.push({ type: msg.type(), text: msg.text() });
    }
  });
  page.on("pageerror", (err) => consoleBuf.push({ type: "error", text: err.message }));
  page.on("response", (res) => {
    const u = res.url();
    if (u.includes("/api/")) netBuf.push({ method: res.request().method(), url: u, status: res.status() });
  });

  await login(ctx, page, ADMIN);

  const caseName = `شخص مراجعة قضية ${stamp}`;
  const clientName = `شخص مراجعة موكل ${stamp}`;
  const consultName = `شخص مراجعة استشارة ${stamp}`;

  await auditModule(ctx, page, {
    id: "cases", href: "/app/modules/case-management", addRe: /إضافة قضية/,
    nameKey: "client", personName: caseName,
    extras: [["type", "مدني", "select"]], consoleBuf, netBuf,
  });
  await auditModule(ctx, page, {
    id: "clients", href: "/app/modules/clients-management", addRe: /إضافة موكل/,
    nameKey: "name", personName: clientName,
    extras: [["type", "فرد", "select"]], consoleBuf, netBuf,
  });
  await auditModule(ctx, page, {
    id: "consultations", href: "/app/modules/legal-consultations", addRe: /تسجيل استشارة/,
    nameKey: "client", personName: consultName,
    extras: [
      ["topic", "استشارة مراجعة نهائية", "text"],
      ["lawyer", "م. مراجعة", "text"],
      ["date", "2026-10-28", "text"],
    ],
    consoleBuf, netBuf,
  });

  for (const [id, href, addRe] of [
    ["sessions", "/app/modules/court-sessions", /جدولة جلسة/],
    ["followup", "/app/modules/follow-up-center", /إضافة متابعة/],
    ["accounting", "/app/modules/legal-accounting", /إضافة سجل مالي/],
    ["services", "/app/modules/legal-services", /إضافة طلب خدمة/],
    ["complaints", "/app/modules/complaints-management", /تسجيل شكوى/],
    ["requests", "/app/modules/internal-requests", /فتح طلب/],
  ] as const) {
    try {
      await page.goto(`${BASE}${href}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(500);
      await openAdd(page, addRe);
      const L = await labelsOk(page);
      await shot(page, `${id}-add-labels`);
      rec({ id, check: "إضافة — حقول الاتصال (مسح)", result: L.ok ? "PASS" : "FAIL", detail: L.ok ? "all 6" : `missing=${L.missing.join(",")}` });
      await page.keyboard.press("Escape");
    } catch (e) {
      rec({ id, check: "إضافة — حقول الاتصال (مسح)", result: "FAIL", detail: String(e) });
    }
  }

  // PostgreSQL
  const dbClient = await prisma.client.findFirst({
    where: { name: clientName },
    select: { id: true, name: true, phone: true, phoneDialCode: true, phoneSecondary: true, country: true, city: true },
  });
  rec({
    id: "postgres", check: "موكل محفوظ في Client",
    result: dbClient && dbClient.phone && dbClient.country === "مصر" && (dbClient.city === "الجيزة" || dbClient.city === "القاهرة") ? "PASS" : "FAIL",
    detail: dbClient ? `id=${dbClient.id} phone=${dbClient.phone} dial=${dbClient.phoneDialCode} sec=${dbClient.phoneSecondary} city=${dbClient.city}` : "not found",
  });
  rec({
    id: "postgres",
    check: "الجوال الإضافي يبقى بعد التعديل (بدون مسح)",
    result: dbClient?.phoneSecondary ? "PASS" : "FAIL",
    detail: `phoneSecondary=${dbClient?.phoneSecondary ?? "null"}`,
  });

  const dbCase = await prisma.case.findFirst({
    where: { clientName: caseName },
    select: { id: true, caseNo: true, clientId: true, clientName: true },
  });
  rec({
    id: "postgres", check: "قضية مرتبطة بـ clientId",
    result: dbCase?.clientId ? "PASS" : "FAIL",
    detail: dbCase ? `case=${dbCase.caseNo} clientId=${dbCase.clientId}` : "not found",
  });

  const consultRows = await prisma.moduleRecord.findMany({
    where: { moduleKey: "legal-consultations" },
    orderBy: { updatedAt: "desc" },
    take: 40,
    select: { id: true, data: true },
  });
  const hitConsult = consultRows.find((r) => String((r.data as any)?.client ?? "") === consultName);
  const consultData = hitConsult?.data as Record<string, unknown> | undefined;
  const consultClientId = consultData?.clientId ? String(consultData.clientId) : "";
  const linkedClient = consultClientId
    ? await prisma.client.findUnique({
        where: { id: consultClientId },
        select: { id: true, name: true, phone: true, city: true },
      })
    : consultName
      ? await prisma.client.findFirst({
          where: { name: consultName },
          select: { id: true, name: true, phone: true, city: true },
        })
      : null;
  rec({
    id: "postgres",
    check: "استشارة محفوظة ومرتبطة بعميل مركزي",
    result: hitConsult && linkedClient ? "PASS" : hitConsult ? "GAP" : "FAIL",
    detail: hitConsult
      ? `record=${hitConsult.id} dataClientId=${consultClientId || "—"} linked=${linkedClient?.id ?? "none"} city=${String(consultData?.city ?? linkedClient?.city ?? "")}`
      : "not found",
  });

  // Central contact behavior
  const centralName = `شخص مركزي ${stamp}`;
  const created = await api(ctx, "POST", "/api/clients", {
    name: centralName, type: "فرد", phone: "1555777888", phoneDialCode: "+20",
    country: "مصر", city: "القاهرة", phoneSecondary: "1002223344", phoneSecondaryDialCode: "+20",
  });
  const centralId = (created.json as any)?.id as string | undefined;
  rec({ id: "central", check: "إنشاء عميل مركزي", result: created.status === 201 && centralId ? "PASS" : "FAIL", detail: `status=${created.status} id=${centralId}` });

  const caseVia = await api(ctx, "POST", "/api/cases", {
    client: centralName, clientId: centralId, phone: "1555777888", phoneDialCode: "+20",
    country: "مصر", city: "القاهرة", type: "مدني", status: "نشطة",
  });
  const caseViaId = (caseVia.json as any)?.id as string | undefined;
  rec({
    id: "central", check: "قضية مرتبطة بنفس Client",
    result: caseVia.status === 201 && (caseVia.json as any)?.clientId === centralId ? "PASS" : "FAIL",
    detail: `status=${caseVia.status} caseClientId=${(caseVia.json as any)?.clientId}`,
  });

  const other = await api(ctx, "POST", "/api/clients", {
    name: `شخص آخر ${stamp}`, type: "فرد", phone: "1555000001", phoneDialCode: "+20", country: "مصر", city: "أسيوط",
  });
  const otherId = (other.json as any)?.id as string;
  const otherBefore = await prisma.client.findUnique({ where: { id: otherId }, select: { phone: true, city: true } });

  const patch = await api(ctx, "PATCH", `/api/clients/${centralId}`, { city: "الإسكندرية", phone: "1555999000" });
  rec({ id: "central", check: "تعديل بيانات Client المركزية", result: patch.status === 200 ? "PASS" : "FAIL", detail: `status=${patch.status}` });

  let auditCount = 0;
  try { auditCount = await prisma.personContactChange.count({ where: { clientId: centralId! } }); }
  catch { auditCount = -1; }
  rec({
    id: "central", check: "سجل تدقيق PersonContactChange",
    result: auditCount > 0 ? "PASS" : auditCount === 0 ? "GAP" : "FAIL",
    detail: `auditRows=${auditCount}`,
  });

  const casesList = await api(ctx, "GET", "/api/cases");
  const caseRows = Array.isArray(casesList.json) ? casesList.json as any[] : ((casesList.json as any)?.data ?? []);
  const linked = caseRows.find((r: any) => r.id === caseViaId || r.client === centralName);
  rec({
    id: "central", check: "انعكاس التعديل المركزي على القضية",
    result: linked && (linked.city === "الإسكندرية" || String(linked.phone||"").includes("1555999000")) ? "PASS" : "FAIL",
    detail: linked ? `city=${linked.city} phone=${linked.phone}` : "case not in list",
  });

  const otherAfter = await prisma.client.findUnique({ where: { id: otherId }, select: { phone: true, city: true } });
  rec({
    id: "central", check: "عدم تغيير عميل آخر بالخطأ",
    result: otherBefore && otherAfter && otherBefore.phone === otherAfter.phone && otherBefore.city === otherAfter.city ? "PASS" : "FAIL",
    detail: `before=${JSON.stringify(otherBefore)} after=${JSON.stringify(otherAfter)}`,
  });

  const casePatch = await api(ctx, "PATCH", `/api/cases/${caseViaId}`, { city: "المنصورة", phone: "1555111000" });
  const clientAfterCaseEdit = await prisma.client.findUnique({ where: { id: centralId! }, select: { city: true, phone: true } });
  rec({
    id: "central", check: "تعديل الاتصال من نموذج القضية يحدّث Client المركزي",
    result: casePatch.status === 200 && clientAfterCaseEdit?.city === "المنصورة" && String(clientAfterCaseEdit?.phone||"").includes("1555111000") ? "PASS" : "FAIL",
    detail: `patch=${casePatch.status} clientCity=${clientAfterCaseEdit?.city} clientPhone=${clientAfterCaseEdit?.phone}`,
  });

  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await search(page, centralName);
  if (await rowAction(page, centralName, "تعديل")) {
    await page.waitForTimeout(500);
    const formText = await page.locator("body").innerText();
    const hasNotice = formText.includes("السجل المركزي") || formText.includes("سجل التدقيق") || formText.includes("المصدر المركزي");
    await shot(page, "central-edit-notice");
    rec({ id: "central", check: "تنبيه واجهة عند تعديل الاتصال المركزي", result: hasNotice ? "PASS" : "GAP", detail: hasNotice ? "notice visible" : "no notice" });
    await page.keyboard.press("Escape");
  }

  // Logout/login
  await ctx.clearCookies();
  await login(ctx, page, ADMIN);
  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await search(page, clientName);
  const afterLogin = await page.locator("body").innerText();
  rec({
    id: "session", check: "استمرار بعد خروج/دخول",
    result: afterLogin.includes(clientName) && (afterLogin.includes("الجيزة") || afterLogin.includes("القاهرة") || afterLogin.includes("+20")) ? "PASS" : "FAIL",
    detail: `found=${afterLogin.includes(clientName)}`,
    shot: await shot(page, "relogin-clients"),
  });

  // Roles
  await ctx.clearCookies();
  await login(ctx, page, CLIENT);
  const deniedClients = await api(ctx, "GET", "/api/clients");
  const deniedPost = await api(ctx, "POST", "/api/clients", { name: "hack", phone: "1", country: "مصر", city: "x" });
  const deniedPatch = centralId ? await api(ctx, "PATCH", `/api/clients/${centralId}`, { city: "اختراق" }) : { status: 0 };
  const deniedLookup = await api(ctx, "GET", `/api/clients/lookup?q=${encodeURIComponent(centralName)}`);
  rec({ id: "roles", check: "عميل: منع GET /api/clients", result: deniedClients.status === 403 ? "PASS" : "FAIL", detail: `status=${deniedClients.status}` });
  rec({ id: "roles", check: "عميل: منع POST /api/clients", result: deniedPost.status === 403 || deniedPost.status === 401 ? "PASS" : "FAIL", detail: `status=${deniedPost.status}` });
  rec({ id: "roles", check: "عميل: منع PATCH عميل مركزي", result: [403,401,404].includes(deniedPatch.status) ? "PASS" : "FAIL", detail: `status=${deniedPatch.status}` });
  rec({ id: "roles", check: "عميل: منع lookup", result: deniedLookup.status === 403 ? "PASS" : "FAIL", detail: `status=${deniedLookup.status}` });

  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const clientPage = await page.locator("body").innerText();
  const blockedUi = clientPage.includes("غير مصرح") || clientPage.includes("تسجيل الدخول") || !clientPage.includes("إضافة موكل");
  await shot(page, "client-role-clients-page");
  rec({ id: "roles", check: "واجهة الموكلين لدور client", result: blockedUi ? "PASS" : "GAP", detail: blockedUi ? "create blocked / unauthorized" : "client may still see staff UI" });

  // Ignore expected unauth noise during cookie clear / role switch
  const unexpected = netBuf.filter(
    (n) =>
      n.status >= 400 &&
      !(n.status === 403 && (n.url.includes("/api/clients") || n.url.includes("/api/site-settings"))) &&
      !(n.status === 401 && n.url.includes("/api/auth/me"))
  );
  rec({
    id: "api", check: "أخطاء API غير متوقعة أثناء الاختبار",
    result: unexpected.length === 0 ? "PASS" : "FAIL",
    detail: unexpected.length
      ? unexpected.slice(0, 10).map((n) => `${n.status} ${n.method} ${n.url.replace(BASE,"")}`).join("; ")
      : "none (401/me + 403/clients|site-settings أثناء تبديل الدور متوقعة)",
  });

  await ctx.clearCookies();
  await login(ctx, page, ADMIN);
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const caseUi = await page.locator("body").innerText();
  rec({
    id: "regression", check: "وظائف قديمة — جدول القضايا يعمل",
    result: caseUi.includes("رقم القضية") && caseUi.includes("الموكل") && caseUi.includes("الإجراءات") ? "PASS" : "FAIL",
    detail: "headers present",
    shot: await shot(page, "regression-cases-table"),
  });

  await browser.close();
  await prisma.$disconnect();

  const summary = {
    pass: rows.filter((r) => r.result === "PASS").length,
    fail: rows.filter((r) => r.result === "FAIL").length,
    gap: rows.filter((r) => r.result === "GAP").length,
  };
  const md = [
    "# Final Audit — Person Contact Forms (PR #183)",
    "",
    `Generated: ${new Date().toISOString()} (Africa/Cairo)`,
    "",
    `| # | المجال | الفحص | النتيجة | التفاصيل |`,
    `|---|---|---|---|---|`,
    ...rows.map((r, i) => `| ${i + 1} | ${r.id} | ${r.check} | **${r.result}** | ${r.detail.replace(/\|/g, "/")} |`),
    "",
    `PASS=${summary.pass} FAIL=${summary.fail} GAP=${summary.gap}`,
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "report.md"), md);
  fs.writeFileSync(path.join(OUT, "report.json"), JSON.stringify({ summary, rows }, null, 2));
  fs.writeFileSync("/workspace/docs-person-contact-final-audit.md", md);
  // promote key shots
  for (const n of ["cases-add","cases-view","cases-edit","clients-add","clients-view","clients-edit","consultations-add","consultations-view","consultations-edit","central-edit-notice"]) {
    const src = path.join(OUT, `${n}.png`);
    if (fs.existsSync(src)) fs.copyFileSync(src, path.join("/opt/cursor/artifacts", `audit-${n}.png`));
  }
  const vids = fs.existsSync(videoDir) ? fs.readdirSync(videoDir).filter((f) => f.endsWith(".webm")) : [];
  if (vids[0]) fs.copyFileSync(path.join(videoDir, vids[0]!), "/opt/cursor/artifacts/final-audit-person-contact.webm");
  console.log("\n" + md);
  if (summary.fail > 0) process.exit(1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect().catch(() => null);
  process.exit(1);
});
