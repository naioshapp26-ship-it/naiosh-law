/**
 * Human-style E2E for page settings no-code center:
 * cases + clients full path: settings → PG → live page → custom field persist → restore
 *
 * Run: BASE_URL=http://localhost:3000 npx tsx scripts/test-page-settings-nocode-e2e.mts
 */
import { chromium, type Page, type BrowserContext } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings-nocode";
const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL || "admin@naioshlaw.com";
const ADMIN_PASS = process.env.E2E_ADMIN_PASSWORD || "Admin@123";

type Row = { id: string; ok: boolean; detail: string };
const results: Row[] = [];
function record(id: string, ok: boolean, detail: string) {
  results.push({ id, ok, detail });
  console.log(`[${ok ? "PASS" : "FAIL"}] ${id}: ${detail}`);
}

async function api(context: BrowserContext, method: string, pathName: string, body?: unknown) {
  const res = await context.request.fetch(`${BASE}${pathName}`, {
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

async function login(page: Page, context: BrowserContext) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const loginRes = await api(context, "POST", "/api/auth/login", {
    email: ADMIN_EMAIL,
    password: ADMIN_PASS,
    remember: true,
  });
  if (loginRes.status !== 200) {
    throw new Error(`login failed: ${loginRes.status} ${JSON.stringify(loginRes.json)}`);
  }
  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(800);
}

async function runModuleScenario(
  page: Page,
  context: BrowserContext,
  opts: {
    pageKey: string;
    modulePath: string;
    entityLabel: string;
    titlePrefix: string;
    fieldLabel: string;
    fieldValue: string;
    createPayload: Record<string, unknown>;
    apiList: string;
  }
) {
  const stamp = Date.now();
  const newTitle = `${opts.titlePrefix} ${stamp}`;

  // 1) Load current settings
  const before = await api(context, "GET", `/api/page-settings/${opts.pageKey}`);
  record(
    `${opts.pageKey}-load`,
    before.status === 200 && Boolean(before.json?.definition),
    `status=${before.status}`
  );
  const values = structuredClone(before.json?.resolved?.values ?? before.json?.defaults ?? {});

  // 2) Change title, hide export, add custom field, tweak section
  values.display = {
    ...(values.display ?? {}),
    title: newTitle,
    subtitle: `وصف تجريبي ${stamp}`,
  };
  values.actions = { ...(values.actions ?? {}), allowExport: false };
  const cfKey = `cf_e2e_${stamp}`;
  values.customFields = [
    ...(Array.isArray(values.customFields) ? values.customFields : []).filter(
      (f: any) => !String(f?.key ?? "").startsWith("cf_e2e_")
    ),
    {
      key: cfKey,
      label: opts.fieldLabel,
      type: "text",
      required: false,
      visible: true,
      order: 0,
    },
  ];
  if (!Array.isArray(values.sections) || values.sections.length === 0) {
    values.sections = [
      { id: "kpis", title: "بطاقات المؤشرات", kind: "kpis", visible: true, order: 0 },
      { id: "table", title: "جدول البيانات", kind: "table", visible: true, order: 1 },
      { id: "actions", title: "شريط الإجراءات", kind: "actions", visible: true, order: 2 },
    ];
  }

  const save = await api(context, "PUT", `/api/page-settings/${opts.pageKey}`, {
    scope: "global",
    values,
  });
  record(
    `${opts.pageKey}-save`,
    save.status === 200 && save.json?.resolved?.values?.display?.title === newTitle,
    `status=${save.status} title=${save.json?.resolved?.values?.display?.title}`
  );

  // 3) Version snapshot exists after second save
  const save2 = await api(context, "PUT", `/api/page-settings/${opts.pageKey}`, {
    scope: "global",
    values: {
      ...values,
      display: { ...values.display, subtitle: `نسخة ثانية ${stamp}` },
    },
  });
  const versions = await api(context, "GET", `/api/page-settings/${opts.pageKey}/versions`);
  record(
    `${opts.pageKey}-versions`,
    save2.status === 200 && versions.status === 200 && (versions.json?.versions?.length ?? 0) >= 1,
    `versions=${versions.json?.versions?.length ?? 0}`
  );

  // 4) Open settings editor UI
  await page.goto(`${BASE}/app/page-settings/${opts.pageKey}`, { waitUntil: "networkidle" });
  await page.waitForSelector(".psc-editor h1", { timeout: 20000 });
  await page.screenshot({
    path: path.join(OUT, `${opts.pageKey}-editor.png`),
    fullPage: true,
  });
  const editorTitle = await page.locator(".psc-editor h1").first().textContent();
  record(
    `${opts.pageKey}-editor-ui`,
    Boolean(editorTitle),
    `h1=${editorTitle}`
  );

  // 5) Open live module — title must apply
  await page.goto(`${BASE}${opts.modulePath}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const h1 = await page.locator("h1").first().textContent();
  record(
    `${opts.pageKey}-live-title`,
    Boolean(h1?.includes(String(stamp))),
    `h1=${h1}`
  );
  await page.screenshot({
    path: path.join(OUT, `${opts.pageKey}-live-title.png`),
    fullPage: true,
  });

  // Export button should be hidden
  const exportBtn = page.getByRole("button", { name: /تقارير/ });
  const exportVisible = await exportBtn.isVisible().catch(() => false);
  record(`${opts.pageKey}-hide-export`, !exportVisible, `exportVisible=${exportVisible}`);

  // 6) Create record with custom field via API (isolated)
  const createBody = { ...opts.createPayload, [cfKey]: opts.fieldValue };
  const created = await api(context, "POST", opts.apiList, createBody);
  const createdId = created.json?.id as string | undefined;
  record(
    `${opts.pageKey}-create-with-cf`,
    created.status === 201 && Boolean(createdId),
    `status=${created.status} id=${createdId}`
  );

  // 7) List includes custom value
  const list = await api(context, "GET", opts.apiList);
  const row = Array.isArray(list.json)
    ? list.json.find((r: any) => r.id === createdId)
    : null;
  record(
    `${opts.pageKey}-cf-persisted`,
    Boolean(row && String(row[cfKey] ?? "") === opts.fieldValue),
    `value=${row?.[cfKey]}`
  );

  // 8) Reload live page and confirm custom column/value presence in DOM or API already proven
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const pageText = await page.locator("body").innerText();
  record(
    `${opts.pageKey}-cf-on-page`,
    pageText.includes(opts.fieldValue) || pageText.includes(opts.fieldLabel),
    `hasValue=${pageText.includes(opts.fieldValue)} hasLabel=${pageText.includes(opts.fieldLabel)}`
  );

  // 9) Restore previous version (first version id)
  const versionId = versions.json?.versions?.[0]?.id as string | undefined;
  if (versionId) {
    const restored = await api(context, "POST", `/api/page-settings/${opts.pageKey}/versions`, {
      versionId,
    });
    record(
      `${opts.pageKey}-restore`,
      restored.status === 200,
      `status=${restored.status}`
    );
  } else {
    record(`${opts.pageKey}-restore`, false, "no version id");
  }

  // 10) Record still exists after settings restore (data safety)
  const still = await api(context, "GET", `${opts.apiList}/${createdId}`);
  // GET on list item may 404 if route missing — fall back to list
  const stillOnList = Array.isArray((await api(context, "GET", opts.apiList)).json)
    ? ((await api(context, "GET", opts.apiList)).json as any[]).some((r) => r.id === createdId)
    : false;
  record(
    `${opts.pageKey}-record-survives-restore`,
    still.status === 200 || stillOnList,
    `getStatus=${still.status} onList=${stillOnList}`
  );

  // Cleanup isolated record
  if (createdId) {
    await api(context, "DELETE", `${opts.apiList}/${createdId}`);
  }

  return { newTitle, cfKey };
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({
    locale: "ar",
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(OUT, "video-raw"), size: { width: 1440, height: 900 } },
  });
  const page = await context.newPage();

  try {
    await login(page, context);

    // Hub ERP-style list
    await page.goto(`${BASE}/app/page-settings`, { waitUntil: "networkidle" });
    await page.waitForSelector(".psc-hub h1", { timeout: 20000 });
    const hubH1 = await page.locator(".psc-hub h1").textContent();
    const listCount = await page.locator(".psc-list .psc-card").count();
    record(
      "hub-erp-list",
      Boolean(hubH1?.includes("إعدادات الصفحات")) && listCount > 10,
      `h1=${hubH1} cards=${listCount}`
    );
    await page.screenshot({ path: path.join(OUT, "hub-fullwidth.png"), fullPage: true });

    const catalog = await api(context, "GET", "/api/page-settings");
    record(
      "coverage-honest",
      catalog.status === 200,
      `total=${catalog.json?.coverage?.total} operational=${catalog.json?.coverage?.operational} partial=${catalog.json?.coverage?.partial} planned=${catalog.json?.coverage?.planned}`
    );

    // Unauthorized client
    const clientCtx = await browser.newContext({ locale: "ar" });
    const clientDeny = await clientCtx.request.fetch(`${BASE}/api/page-settings`, {
      failOnStatusCode: false,
    });
    record("deny-anon-catalog", clientDeny.status() === 401, `status=${clientDeny.status()}`);
    await clientCtx.close();

    await runModuleScenario(page, context, {
      pageKey: "case-management",
      modulePath: "/app/modules/case-management",
      entityLabel: "قضية",
      titlePrefix: "إدارة قضايا NoCode",
      fieldLabel: "مرجع داخلي تجريبي",
      fieldValue: `CASE-CF-${Date.now()}`,
      apiList: "/api/cases",
      createPayload: {
        client: "موكل اختبار معزول",
        type: "مدني",
        court: "المحكمة الابتدائية القاهرة",
        status: "نشطة",
        notes: "سجل اختبار إعدادات — يُحذف تلقائياً",
      },
    });

    await runModuleScenario(page, context, {
      pageKey: "clients-management",
      modulePath: "/app/modules/clients-management",
      entityLabel: "موكل",
      titlePrefix: "موكلين NoCode",
      fieldLabel: "رقم مرجعي داخلي",
      fieldValue: `CLIENT-CF-${Date.now()}`,
      apiList: "/api/clients",
      createPayload: {
        name: `موكل اختبار ${Date.now()}`,
        type: "فرد",
        phone: "01000000000",
        status: "نشط",
      },
    });

    // Logout / login persistence check on cases title
    const after = await api(context, "GET", "/api/page-settings/case-management");
    await api(context, "POST", "/api/auth/logout").catch(() => null);
    await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
    await login(page, context);
    const again = await api(context, "GET", "/api/page-settings/case-management");
    record(
      "persist-after-relogin",
      again.status === 200 &&
        again.json?.resolved?.values?.display?.title ===
          after.json?.resolved?.values?.display?.title,
      `title=${again.json?.resolved?.values?.display?.title}`
    );

    await page.goto(`${BASE}/app/page-settings`, { waitUntil: "networkidle" });
    await page.waitForTimeout(500);
  } catch (e) {
    record("fatal", false, e instanceof Error ? e.message : String(e));
  }

  const videoPath = await page.video()?.path();
  await context.close();
  await browser.close();

  if (videoPath && fs.existsSync(videoPath)) {
    const dest = path.join(OUT, "nocode-cases-clients-e2e.webm");
    fs.copyFileSync(videoPath, dest);
    console.log("VIDEO", dest);
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const summary = { passed, failed, total: results.length, results };
  fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
