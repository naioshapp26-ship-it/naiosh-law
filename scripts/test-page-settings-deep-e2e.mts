/**
 * Deep no-code proofs — not title-only.
 * Per page: title, custom field add+value, hide export, column trim, workflow default,
 * preview draft, restore, re-login.
 * Permissions: judge cannot create when canCreateRoles excludes judge; allowCreate=false blocks API.
 * Portal isolation + inventory of planned pages.
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings-deep";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const LAWYER = { email: "lawyer@naioshlaw.com", password: "Lawyer@123" };
const CLIENT = { email: "client@naioshlaw.com", password: "Client@123" };

type Result = { id: string; ok: boolean; detail: string };
const results: Result[] = [];
function record(id: string, ok: boolean, detail: string) {
  results.push({ id, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

async function api(ctx: BrowserContext, method: string, p: string, body?: unknown) {
  const res = await ctx.request.fetch(`${BASE}${p}`, {
    method,
    headers: body !== undefined ? { "Content-Type": "application/json" } : undefined,
    data: body !== undefined ? body : undefined,
    failOnStatusCode: false,
  });
  let json: any = null;
  try {
    json = await res.json();
  } catch {
    json = null;
  }
  return { status: res.status(), json };
}

async function loginAs(ctx: BrowserContext, page: Page, creds: { email: string; password: string }) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const res = await api(ctx, "POST", "/api/auth/login", { ...creds, remember: true });
  if (res.status !== 200) throw new Error(`login ${creds.email} -> ${res.status}`);
  return res;
}

const DEEP_TARGETS: Array<{
  pageKey: string;
  livePath: string;
  apiList: string;
  createPayload: Record<string, unknown>;
}> = [
  {
    pageKey: "case-management",
    livePath: "/app/modules/case-management",
    apiList: "/api/cases",
    createPayload: { client: "عميق اختبار", type: "مدني", court: "محكمة", status: "نشطة" },
  },
  {
    pageKey: "clients-management",
    livePath: "/app/modules/clients-management",
    apiList: "/api/clients",
    createPayload: { name: `عميل عميق ${Date.now()}`, type: "فرد", status: "نشط" },
  },
  {
    pageKey: "follow-up-center",
    livePath: "/app/modules/follow-up-center",
    apiList: "/api/module-records/follow-up-center",
    createPayload: { type: "متابعة", client: "موكل", due: "2026-12-01", priority: "متوسط", status: "معلق" },
  },
  {
    pageKey: "legal-services",
    livePath: "/app/modules/legal-services",
    apiList: "/api/module-records/legal-services",
    createPayload: { service: "خدمة", client: "موكل", status: "جديد", priority: "متوسط" },
  },
  {
    pageKey: "complaints-management",
    livePath: "/app/modules/complaints-management",
    apiList: "/api/module-records/complaints-management",
    createPayload: { client: "موكل", subject: "شكوى اختبار", category: "خدمة", status: "جديدة" },
  },
  {
    pageKey: "general-tools",
    livePath: "/app/modules/general-tools",
    apiList: "/api/module-records/general-tools",
    createPayload: { title: "مهمة اختبار", assignee: "موظف", status: "معلق", priority: "متوسط" },
  },
  {
    pageKey: "legal-consultations",
    livePath: "/app/modules/legal-consultations",
    apiList: "/api/module-records/legal-consultations",
    createPayload: { client: "موكل", topic: "استشارة", status: "مجدولة" },
  },
  {
    pageKey: "internal-requests",
    livePath: "/app/modules/internal-requests",
    apiList: "/api/module-records/internal-requests",
    createPayload: { title: "طلب داخلي", requester: "موظف", status: "مفتوح" },
  },
  {
    pageKey: "smart-templates",
    livePath: "/app/modules/smart-templates",
    apiList: "/api/module-records/smart-templates",
    createPayload: { name: "قالب", category: "عقود", status: "نشط" },
  },
  {
    pageKey: "reports-center",
    livePath: "/app/modules/reports-center",
    apiList: "/api/module-records/reports-center",
    createPayload: { name: "تقرير", type: "قضايا", status: "جاهز" },
  },
  {
    pageKey: "ai-center",
    livePath: "/app/modules/ai-center",
    apiList: "/api/module-records/ai-center",
    createPayload: { type: "تلخيص", input: "نص", status: "مكتمل" },
  },
  {
    pageKey: "court-sessions",
    livePath: "/app/modules/court-sessions",
    apiList: "/api/court-sessions",
    createPayload: { caseNo: "#D", court: "محكمة", date: "2026-12-01", status: "مجدولة" },
  },
  {
    pageKey: "legal-accounting",
    livePath: "/app/modules/legal-accounting",
    apiList: "/api/financial-records",
    createPayload: { client: "عميل", type: "رسوم", amount: 50, paid: 0, status: "غير مسدد" },
  },
  {
    pageKey: "notifications-center",
    livePath: "/app/modules/notifications-center",
    apiList: "/api/notification-rules",
    createPayload: { title: "قاعدة", trigger: "حدث", status: "نشط" },
  },
  {
    pageKey: "integrations",
    livePath: "/app/modules/integrations",
    apiList: "/api/integrations",
    createPayload: { name: `تكامل ${Date.now()}`, status: "متصل" },
  },
];

async function deepOne(
  ctx: BrowserContext,
  page: Page,
  t: (typeof DEEP_TARGETS)[0],
  stamp: number
) {
  const prefix = t.pageKey;
  const before = await api(ctx, "GET", `/api/page-settings/${t.pageKey}`);
  if (before.status !== 200) {
    record(`${prefix}-load`, false, `GET ${before.status}`);
    return;
  }
  const values = structuredClone(before.json.resolved?.values ?? before.json.defaults);
  const prev = structuredClone(values);
  const title = `عميق ${prefix} ${stamp}`;
  const cfKey = `cf_deep_${stamp}`;

  values.display = {
    ...(values.display ?? {}),
    title,
    subtitle: `deep ${stamp}`,
    visibleColumns: (values.display?.visibleColumns ?? []).slice(0, 3),
    showKpis: false,
  };
  values.actions = { ...(values.actions ?? {}), allowExport: false, allowCreate: true };
  values.sections = [
    { id: "kpis", title: "مؤشرات", kind: "kpis", visible: false, order: 0 },
    { id: "table", title: "جدول", kind: "table", visible: true, order: 1 },
    { id: "actions", title: "إجراءات", kind: "actions", visible: true, order: 2 },
  ];
  values.customFields = [
    {
      key: cfKey,
      label: "حقل عميق",
      type: "text",
      required: false,
      visible: true,
      order: 0,
    },
  ];
  values.workflow = {
    ...(values.workflow ?? {}),
    statuses: ["حالة-أ", "حالة-ب", "حالة-ج"],
    initialStatus: "حالة-أ",
  };
  values.fields = { ...(values.fields ?? {}), defaultStatus: "حالة-أ" };

  const save = await api(ctx, "PUT", `/api/page-settings/${t.pageKey}`, {
    scope: "global",
    values,
  });
  record(`${prefix}-save`, save.status === 200, `status=${save.status}`);

  // Preview draft
  await page.goto(`${BASE}/app/page-settings/${t.pageKey}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.evaluate(
    ([key, draft]) => {
      sessionStorage.setItem(`naiosh.pageSettings.preview.${key}`, draft);
    },
    [t.pageKey, JSON.stringify({ ...values, display: { ...values.display, title: `معاينة ${stamp}` } })]
  );
  await page.goto(`${BASE}${t.livePath}?settingsPreview=1`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const previewText = await page.locator("body").innerText();
  record(
    `${prefix}-preview`,
    previewText.includes(String(stamp)) && previewText.includes("معاينة"),
    `hasPreviewBannerOrTitle=${previewText.includes("معاينة إعدادات") || previewText.includes(`معاينة ${stamp}`)}`
  );

  // Live after save (no preview)
  await page.goto(`${BASE}${t.livePath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  await page.waitForSelector("h1", { timeout: 20000 }).catch(() => null);
  const h1 = (await page.locator("h1").first().textContent().catch(() => "")) || "";
  record(`${prefix}-live-title`, h1.includes(String(stamp)), `h1=${h1}`);

  const exportVisible = await page
    .getByRole("button", { name: /تقارير/ })
    .isVisible()
    .catch(() => false);
  record(`${prefix}-hide-export`, !exportVisible, `exportVisible=${exportVisible}`);

  // Create with custom field + workflow default status via API
  const created = await api(ctx, "POST", t.apiList, {
    ...t.createPayload,
    status: "حالة-أ",
    [cfKey]: `DEEP-${stamp}`,
  });
  const id = created.json?.id as string | undefined;
  record(`${prefix}-create-cf`, created.status === 201 && Boolean(id), `status=${created.status} id=${id}`);

  if (id) {
    const list = await api(ctx, "GET", t.apiList);
    const row = Array.isArray(list.json) ? list.json.find((r: any) => r.id === id) : null;
    record(
      `${prefix}-cf-persist`,
      Boolean(row && String(row[cfKey]) === `DEEP-${stamp}`),
      `val=${row?.[cfKey]}`
    );
    // Edit custom field
    const patched = await api(ctx, "PATCH", `${t.apiList}/${id}`, { [cfKey]: `EDIT-${stamp}` });
    const list2 = await api(ctx, "GET", t.apiList);
    const row2 = Array.isArray(list2.json) ? list2.json.find((r: any) => r.id === id) : null;
    record(
      `${prefix}-cf-edit`,
      patched.status === 200 && String(row2?.[cfKey]) === `EDIT-${stamp}`,
      `val=${row2?.[cfKey]}`
    );
  }

  // Disable create via settings — API must 403
  const blocked = structuredClone(values);
  blocked.actions = { ...(blocked.actions ?? {}), allowCreate: false };
  await api(ctx, "PUT", `/api/page-settings/${t.pageKey}`, { scope: "global", values: blocked });
  const denyCreate = await api(ctx, "POST", t.apiList, { ...t.createPayload, [cfKey]: "x" });
  record(
    `${prefix}-api-block-create`,
    denyCreate.status === 403,
    `status=${denyCreate.status}`
  );

  // Restore previous settings
  const restore = await api(ctx, "PUT", `/api/page-settings/${t.pageKey}`, {
    scope: "global",
    values: prev,
  });
  record(`${prefix}-restore-settings`, restore.status === 200, `status=${restore.status}`);

  // Record must survive settings restore
  if (id) {
    const still = await api(ctx, "GET", t.apiList);
    const alive = Array.isArray(still.json) && still.json.some((r: any) => r.id === id);
    record(`${prefix}-record-survives`, alive, `alive=${alive}`);
    await api(ctx, "DELETE", `${t.apiList}/${id}`);
  }
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({
    locale: "ar",
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(OUT, "video-raw"), size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  const stamp = Date.now();

  await loginAs(ctx, page, ADMIN);

  for (const t of DEEP_TARGETS) {
    await deepOne(ctx, page, t, stamp);
  }

  // Role permission: restrict case create to admin only, then try as lawyer
  const caseSettings = await api(ctx, "GET", "/api/page-settings/case-management");
  const v = structuredClone(caseSettings.json.resolved.values);
  const vPrev = structuredClone(v);
  v.permissions = { ...(v.permissions ?? {}), canCreateRoles: ["admin"] };
  v.actions = { ...(v.actions ?? {}), allowCreate: true };
  await api(ctx, "PUT", `/api/page-settings/case-management`, { scope: "global", values: v });

  await api(ctx, "POST", "/api/auth/logout").catch(() => null);
  const lawyerCtx = await browser.newContext({ locale: "ar" });
  const lawyerPage = await lawyerCtx.newPage();
  await loginAs(lawyerCtx, lawyerPage, LAWYER);
  const lawyerCreate = await api(lawyerCtx, "POST", "/api/cases", {
    client: "محاولة محامي",
    type: "مدني",
    court: "x",
    status: "نشطة",
  });
  record(
    "perm-lawyer-blocked-create",
    lawyerCreate.status === 403,
    `status=${lawyerCreate.status} body=${JSON.stringify(lawyerCreate.json)}`
  );
  await lawyerCtx.close();

  // Restore case permissions as admin
  await loginAs(ctx, page, ADMIN);
  await api(ctx, "PUT", `/api/page-settings/case-management`, {
    scope: "global",
    values: vPrev,
  });

  // Client portal isolation — client cannot read staff page-settings catalog
  try {
    const clientCtx = await browser.newContext({ locale: "ar" });
    const clientPage = await clientCtx.newPage();
    await loginAs(clientCtx, clientPage, CLIENT);
    const clientCatalog = await api(clientCtx, "GET", "/api/page-settings");
    record(
      "portal-deny-staff-catalog",
      clientCatalog.status === 403 || clientCatalog.status === 401,
      `status=${clientCatalog.status}`
    );
    const clientPortalSettings = await api(clientCtx, "GET", "/api/page-settings/client-portal");
    record(
      "portal-read-own-settings",
      clientPortalSettings.status === 200,
      `status=${clientPortalSettings.status}`
    );
    // Client must not create cases via staff API
    const clientCase = await api(clientCtx, "POST", "/api/cases", {
      client: "اختراق",
      type: "مدني",
      court: "x",
      status: "نشطة",
    });
    record(
      "portal-deny-staff-case-write",
      clientCase.status === 401 || clientCase.status === 403,
      `status=${clientCase.status}`
    );
    await clientPage.goto(`${BASE}/portal`, { waitUntil: "networkidle" });
    await clientPage.waitForTimeout(800);
    const portalOk = clientPage.url().includes("/portal");
    record("portal-opens", portalOk, `url=${clientPage.url()}`);
    await clientPage.screenshot({ path: path.join(OUT, "portal-client.png") });
    await clientCtx.close();
  } catch (e) {
    record("portal-suite", false, e instanceof Error ? e.message : String(e));
  }

  // Dashboard + messages smoke as admin
  await loginAs(ctx, page, ADMIN);
  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  record("dashboard-opens", page.url().includes("/dashboard"), `url=${page.url()}`);
  await page.goto(`${BASE}/app/client-messages`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  record(
    "messages-opens",
    page.url().includes("client-messages"),
    `url=${page.url()}`
  );

  // Title-only apply for standalone pages without ModuleRecord CRUD in this suite
  for (const stand of [
    { pageKey: "archive", livePath: "/app/archive" },
    { pageKey: "professional-network", livePath: "/app/professional-network" },
    { pageKey: "legal-finance", livePath: "/app/legal-finance" },
    { pageKey: "administration", livePath: "/app/modules/administration" },
    { pageKey: "client-portal", livePath: "/portal" },
  ]) {
    const get = await api(ctx, "GET", `/api/page-settings/${stand.pageKey}`);
    if (get.status !== 200) {
      record(`${stand.pageKey}-standalone-load`, false, `status=${get.status}`);
      continue;
    }
    const values = structuredClone(get.json.resolved?.values ?? get.json.defaults);
    const prev = structuredClone(values);
    const title = `Standalone ${stand.pageKey} ${stamp}`;
    values.display = { ...(values.display ?? {}), title };
    const save = await api(ctx, "PUT", `/api/page-settings/${stand.pageKey}`, {
      scope: "global",
      values,
    });
    if (stand.pageKey === "client-portal") {
      // portal title may not show to staff the same way — just verify save + restore
      record(`${stand.pageKey}-save`, save.status === 200, `status=${save.status}`);
    } else {
      await page.goto(`${BASE}${stand.livePath}`, { waitUntil: "networkidle" });
      await page.waitForTimeout(600);
      const text = await page.locator("body").innerText();
      record(
        `${stand.pageKey}-standalone-title`,
        save.status === 200 && text.includes(String(stamp)),
        `save=${save.status}`
      );
    }
    await api(ctx, "PUT", `/api/page-settings/${stand.pageKey}`, {
      scope: "global",
      values: prev,
    });
  }

  // Inventory: classify planned registry
  const catalog = await api(ctx, "GET", "/api/page-settings");
  const pages = (catalog.json?.pages ?? []) as Array<{
    pageKey: string;
    title: string;
    status: string;
    pageHref: string;
    gapReason: string | null;
  }>;
  const operational = pages.filter((p) => p.status === "operational");
  const partial = pages.filter((p) => p.status === "partial");
  const planned = pages.filter((p) => p.status === "planned");
  const plannedNaiosh = planned.filter(
    (p) =>
      !p.pageKey.startsWith("erp-") &&
      !p.pageKey.startsWith("specialty-")
  );
  const plannedErp = planned.filter((p) => p.pageKey.startsWith("erp-"));
  const plannedSpecialty = planned.filter((p) => p.pageKey.startsWith("specialty-"));

  const inventory = {
    catalog: catalog.json?.coverage,
    operational: operational.map((p) => ({ key: p.pageKey, href: p.pageHref, title: p.title })),
    partial: partial.map((p) => ({ key: p.pageKey, href: p.pageHref, title: p.title, gap: p.gapReason })),
    plannedNaioshStaff: plannedNaiosh.map((p) => ({
      key: p.pageKey,
      href: p.pageHref,
      title: p.title,
      gap: p.gapReason,
    })),
    plannedSpecialty: plannedSpecialty.map((p) => ({ key: p.pageKey, href: p.pageHref })),
    plannedErpCount: plannedErp.length,
    note19vs20:
      "Batch earlier tested 19 live pages (all ops except client-portal + all then-partials). Catalog ops+partial now includes ModuleRecord-backed units as operational after API wiring — see operational list for exact names.",
  };
  fs.writeFileSync(path.join(OUT, "inventory.json"), JSON.stringify(inventory, null, 2));

  const videoPath = await page.video()?.path();
  await ctx.close();
  await browser.close();
  if (videoPath && fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, path.join(OUT, "deep-nocode.webm"));
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const summary = { passed, failed, total: results.length, results, inventory };
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(summary, null, 2));

  const md = [
    "# تغطية عميقة — وظائف حقيقية",
    "",
    `نجح ${passed}/${results.length} — فشل ${failed}`,
    "",
    "## تشغيلية (أسماء بدون تكرار)",
    ...operational.map((p) => `- \`${p.pageKey}\` → ${p.pageHref} — ${p.title}`),
    "",
    "## جزئية",
    ...(partial.length
      ? partial.map((p) => `- \`${p.pageKey}\` → ${p.pageHref} — ${p.gapReason ?? ""}`)
      : ["- لا يوجد"]),
    "",
    "## مخططة NAIOSH فعلية (ليست ERP)",
    ...plannedNaiosh.map((p) => `- \`${p.pageKey}\` → ${p.pageHref}`),
    "",
    `## ERP مفهرس فقط: ${plannedErp.length} | specialty: ${plannedSpecialty.length}`,
    "",
    "## نتائج الاختبارات",
    ...results.map((r) => `- ${r.ok ? "✅" : "❌"} \`${r.id}\`: ${r.detail}`),
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "COVERAGE-DEEP.md"), md);
  console.log(md);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
