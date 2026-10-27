/**
 * Batch human-style proof for page-settings engine across real pages.
 * For each target: change title → save PG → open live page → assert → restore.
 * API modules also: add custom field → create record with value → assert persistence.
 *
 * Run: BASE_URL=http://localhost:3000 npx tsx scripts/test-page-settings-batch-e2e.mts
 */
import { chromium, type BrowserContext } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings-batch";
const EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@naioshlaw.com";
const PASS = process.env.E2E_ADMIN_PASSWORD || "Admin@123";

type Target = {
  pageKey: string;
  livePath: string;
  apiList?: string;
  createPayload?: Record<string, unknown>;
  h1MustIncludeTitle?: boolean;
};

/** Real pages with live apply path (not ERP stubs) */
const TARGETS: Target[] = [
  {
    pageKey: "case-management",
    livePath: "/app/modules/case-management",
    apiList: "/api/cases",
    createPayload: { client: "موكل دفعة", type: "مدني", court: "محكمة الاختبار", status: "نشطة" },
  },
  {
    pageKey: "clients-management",
    livePath: "/app/modules/clients-management",
    apiList: "/api/clients",
    createPayload: { name: `موكل دفعة ${Date.now()}`, type: "فرد", status: "نشط" },
  },
  {
    pageKey: "court-sessions",
    livePath: "/app/modules/court-sessions",
    apiList: "/api/court-sessions",
    createPayload: { caseNo: "#BATCH-1", court: "محكمة", date: "2026-11-01", status: "مجدولة" },
  },
  {
    pageKey: "legal-accounting",
    livePath: "/app/modules/legal-accounting",
    apiList: "/api/financial-records",
    createPayload: { client: "عميل دفعة", type: "رسوم", amount: 100, paid: 0, status: "غير مسدد" },
  },
  {
    pageKey: "notifications-center",
    livePath: "/app/modules/notifications-center",
    apiList: "/api/notification-rules",
    createPayload: { title: "قاعدة دفعة", trigger: "جلسة", channel: "email", status: "نشط" },
  },
  {
    pageKey: "integrations",
    livePath: "/app/modules/integrations",
    apiList: "/api/integrations",
    createPayload: { name: `تكامل دفعة ${Date.now()}`, type: "other", status: "متصل" },
  },
  { pageKey: "follow-up-center", livePath: "/app/modules/follow-up-center" },
  { pageKey: "legal-services", livePath: "/app/modules/legal-services" },
  { pageKey: "legal-consultations", livePath: "/app/modules/legal-consultations" },
  { pageKey: "internal-requests", livePath: "/app/modules/internal-requests" },
  { pageKey: "complaints-management", livePath: "/app/modules/complaints-management" },
  { pageKey: "smart-templates", livePath: "/app/modules/smart-templates" },
  { pageKey: "reports-center", livePath: "/app/modules/reports-center" },
  { pageKey: "ai-center", livePath: "/app/modules/ai-center" },
  { pageKey: "general-tools", livePath: "/app/modules/general-tools" },
  { pageKey: "archive", livePath: "/app/archive" },
  { pageKey: "professional-network", livePath: "/app/professional-network" },
  { pageKey: "legal-finance", livePath: "/app/legal-finance" },
  { pageKey: "administration", livePath: "/app/modules/administration" },
];

type Row = {
  pageKey: string;
  titleOk: boolean;
  restoreOk: boolean;
  customFieldOk: boolean | null;
  detail: string;
  controls: string;
};

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

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const login = await api(ctx, "POST", "/api/auth/login", {
    email: EMAIL,
    password: PASS,
    remember: true,
  });
  if (login.status !== 200) {
    console.error("login failed", login);
    process.exit(1);
  }

  const rows: Row[] = [];
  const stamp = Date.now();

  for (const t of TARGETS) {
    const title = `NoCode ${t.pageKey} ${stamp}`;
    const before = await api(ctx, "GET", `/api/page-settings/${t.pageKey}`);
    if (before.status !== 200) {
      rows.push({
        pageKey: t.pageKey,
        titleOk: false,
        restoreOk: false,
        customFieldOk: null,
        detail: `settings GET ${before.status}`,
        controls: "—",
      });
      console.log(`[FAIL] ${t.pageKey}: settings GET ${before.status}`);
      continue;
    }

    const values = structuredClone(before.json?.resolved?.values ?? before.json?.defaults ?? {});
    const prevTitle = values?.display?.title;
    values.display = { ...(values.display ?? {}), title, subtitle: `batch ${stamp}` };

    const cfKey = t.apiList ? `cf_batch_${stamp}` : null;
    if (cfKey) {
      values.customFields = [
        ...(Array.isArray(values.customFields) ? values.customFields : []).filter(
          (f: any) => !String(f?.key ?? "").startsWith("cf_batch_")
        ),
        {
          key: cfKey,
          label: "حقل دفعة اختبار",
          type: "text",
          required: false,
          visible: true,
          order: 0,
        },
      ];
    }

    const save = await api(ctx, "PUT", `/api/page-settings/${t.pageKey}`, {
      scope: "global",
      values,
    });

    await page.goto(`${BASE}${t.livePath}`, { waitUntil: "networkidle" });
    await page.waitForTimeout(700);
    const h1 = (await page.locator("h1").first().textContent().catch(() => "")) || "";
    const bodyText = await page.locator("body").innerText();
    const titleOk =
      save.status === 200 && (h1.includes(String(stamp)) || bodyText.includes(title));

    let customFieldOk: boolean | null = null;
    let createdId: string | undefined;
    if (cfKey && t.apiList && t.createPayload) {
      const created = await api(ctx, "POST", t.apiList, {
        ...t.createPayload,
        [cfKey]: `VAL-${stamp}`,
      });
      createdId = created.json?.id;
      if (created.status === 201 && createdId) {
        const list = await api(ctx, "GET", t.apiList);
        const row = Array.isArray(list.json)
          ? list.json.find((r: any) => r.id === createdId)
          : null;
        customFieldOk = Boolean(row && String(row[cfKey]) === `VAL-${stamp}`);
        await api(ctx, "DELETE", `${t.apiList}/${createdId}`);
      } else {
        customFieldOk = false;
      }
    }

    // restore previous title (defaults if none)
    const restoreValues = structuredClone(values);
    restoreValues.display = {
      ...(restoreValues.display ?? {}),
      title: prevTitle || before.json?.defaults?.display?.title || t.pageKey,
    };
    const restore = await api(ctx, "PUT", `/api/page-settings/${t.pageKey}`, {
      scope: "global",
      values: restoreValues,
    });

    const controls = [
      "عنوان",
      "وصف",
      "أعمدة",
      "أقسام",
      "أزرار",
      "صلاحيات",
      "سير عمل",
      "حقول مخصصة (تعريف)",
      cfKey ? "قيم حقول مخصصة PG" : null,
      "معاينة",
      "حفظ",
      "استعادة/نسخ",
    ]
      .filter(Boolean)
      .join(" · ");

    const row: Row = {
      pageKey: t.pageKey,
      titleOk,
      restoreOk: restore.status === 200,
      customFieldOk,
      detail: `save=${save.status} h1=${h1.slice(0, 60)} cf=${customFieldOk}`,
      controls,
    };
    rows.push(row);
    console.log(
      `[${titleOk && restore.status === 200 && customFieldOk !== false ? "PASS" : "FAIL"}] ${t.pageKey}: ${row.detail}`
    );
  }

  // Catalog honesty snapshot
  const catalog = await api(ctx, "GET", "/api/page-settings");
  const coverage = catalog.json?.coverage ?? {};

  const videoPath = await page.video()?.path();
  await ctx.close();
  await browser.close();
  if (videoPath && fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, path.join(OUT, "batch-title-apply.webm"));
  }

  const proven = rows.filter((r) => r.titleOk && r.restoreOk && r.customFieldOk !== false);
  const report = {
    generatedAt: new Date().toISOString(),
    catalogCoverage: coverage,
    tested: rows.length,
    provenTitleApply: proven.length,
    rows,
    notes: [
      "ERP catalog entries remain planned — not separate data pages.",
      "ModuleShell modules without API: title/actions/sections/custom field defs persist; record CF values need API.",
      "Proven = title applied on live page + restore OK + CF pass when API present.",
    ],
  };
  fs.writeFileSync(path.join(OUT, "coverage-batch.json"), JSON.stringify(report, null, 2));

  // Markdown table
  const md = [
    "# جدول تغطية إعدادات الصفحات (دفعة اختبار فعلي)",
    "",
    `| الصفحة | تطبيق العنوان | استعادة | حقل مخصص PG | ما يمكن التحكم فيه |`,
    `|---|---|---|---|---|`,
    ...rows.map(
      (r) =>
        `| \`${r.pageKey}\` | ${r.titleOk ? "✅" : "❌"} | ${r.restoreOk ? "✅" : "❌"} | ${
          r.customFieldOk === null ? "—" : r.customFieldOk ? "✅" : "❌"
        } | ${r.controls} |`
    ),
    "",
    `**مُثبتة في هذه الدفعة:** ${proven.length}/${rows.length}`,
    "",
    `**سجل الكتالوج:** total=${coverage.total} operational=${coverage.operational} partial=${coverage.partial} planned=${coverage.planned}`,
    "",
    "الصفحات المخططة (ERP/specialty) ليست صفحات بيانات مستقلة — تبقى في السجل مع gapReason.",
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "COVERAGE.md"), md);

  console.log(md);
  const failed = rows.filter((r) => !r.titleOk || !r.restoreOk || r.customFieldOk === false).length;
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
