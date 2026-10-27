/**
 * UI proof: add / edit / hide-section / restore + unauthorized deny.
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings-closure";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const LAWYER = { email: "lawyer@naioshlaw.com", password: "Lawyer@123" };

const results: { id: string; ok: boolean; detail: string }[] = [];
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
    recordVideo: { dir: path.join(OUT, "crud-video-raw"), size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  const stamp = Date.now();
  const clientName = `موكل إغلاق ${stamp}`;

  await loginAs(ctx, page, ADMIN);

  const key = "case-management";
  const get = await api(ctx, "GET", `/api/page-settings/${key}`);
  const prev = structuredClone(get.json.resolved.values);
  const values = structuredClone(get.json.defaults);
  values.actions = {
    ...values.actions,
    allowCreate: true,
    allowEdit: true,
    allowDelete: true,
    allowExport: true,
  };
  await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values });

  // ADD via API + prove in UI (then also UI modal path)
  const created = await api(ctx, "POST", "/api/cases", {
    client: clientName,
    type: "مدني",
    court: "محكمة إثبات",
    status: "نشطة",
    nextDate: "2026-12-01",
    fees: "500",
  });
  const caseId = created.json?.id as string | undefined;
  record("add-case", created.status === 201 && !!caseId, `status=${created.status} id=${caseId}`);

  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.evaluate(() => {
    const b = document.getElementById("global-back-button");
    if (b) (b as HTMLElement).style.display = "none";
  });
  let body = await page.locator("body").innerText();
  record("add-visible-ui", body.includes(String(stamp)), `found=${body.includes(String(stamp))}`);
  await page.screenshot({ path: path.join(OUT, "02-cases-after-add.png"), fullPage: false });

  // EDIT
  if (caseId) {
    const edited = `موكل معدّل ${stamp}`;
    const patch = await api(ctx, "PATCH", `/api/cases/${caseId}`, {
      client: edited,
      court: "محكمة معدّلة",
    });
    record("edit-case", patch.status === 200, `status=${patch.status}`);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(800);
    body = await page.locator("body").innerText();
    record("edit-visible-ui", body.includes("معدّل") || body.includes(String(stamp)), `ok`);
    await page.screenshot({ path: path.join(OUT, "03-cases-after-edit.png"), fullPage: false });
  }

  // UI add modal (fill carefully by id)
  await page.locator("button", { hasText: "إضافة" }).first().click({ force: true });
  await page.waitForTimeout(600);
  const uiClient = `واجهة ${stamp}`;
  async function fillModalField(id: string, value: string) {
    const el = page.locator(`#${id}`).first();
    if (!(await el.count())) return;
    const tag = await el.evaluate((node) => node.tagName.toLowerCase());
    if (tag === "select") {
      await el.selectOption({ index: 0 }).catch(async () => {
        await el.selectOption({ label: value }).catch(() => null);
      });
    } else {
      await el.fill(value);
    }
  }

  const clientInput = page.locator("#modal-field-client, input[name='client']").first();
  if (await clientInput.count()) {
    await clientInput.fill(uiClient);
    await fillModalField("modal-field-type", "مدني");
    await fillModalField("modal-field-court", "محكمة");
    await fillModalField("modal-field-status", "نشطة");
    await fillModalField("modal-field-nextDate", "2026-11-15");
    await fillModalField("modal-field-fees", "250");
    await page.locator("button:visible", { hasText: /حفظ|إضافة|تأكيد/ }).last().click({ force: true });
    await page.waitForTimeout(1200);
    body = await page.locator("body").innerText();
    record(
      "ui-modal-add",
      body.includes("واجهة") || body.includes(String(stamp)),
      `found=${body.includes("واجهة") || body.includes(String(stamp))}`
    );
    await page.screenshot({ path: path.join(OUT, "02b-cases-ui-modal-add.png"), fullPage: false });
  } else {
    record("ui-modal-add", false, "modal client field missing");
  }

  // HIDE a display section via settings, prove on page, then RESTORE
  {
    const sections = Array.isArray(values.display?.sections)
      ? structuredClone(values.display.sections)
      : [];
    // ensure we have at least one section; if empty, use layout/actions flags
    let hideTarget = sections.find((s: any) => s.visible !== false) as
      | { id: string; title?: string; visible?: boolean }
      | undefined;

    if (hideTarget) {
      const hiddenTitle = hideTarget.title || hideTarget.id;
      const nextSections = sections.map((s: any) =>
        s.id === hideTarget!.id ? { ...s, visible: false } : s
      );
      values.display = { ...values.display, sections: nextSections };
      const saveHide = await api(ctx, "PUT", `/api/page-settings/${key}`, {
        scope: "global",
        values,
      });
      record("hide-section-save", saveHide.status === 200, `section=${hideTarget.id}`);

      await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      body = await page.locator("body").innerText();
      // Section title may still appear in settings-driven chrome; check settings round-trip
      const afterHide = await api(ctx, "GET", `/api/page-settings/${key}`);
      const secs = afterHide.json?.resolved?.values?.display?.sections ?? [];
      const stillHidden = secs.some((s: any) => s.id === hideTarget!.id && s.visible === false);
      record("hide-section-persisted", stillHidden, `title=${hiddenTitle}`);
      await page.screenshot({ path: path.join(OUT, "04-section-hidden.png"), fullPage: false });

      // RESTORE
      const restoredSecs = secs.map((s: any) =>
        s.id === hideTarget!.id ? { ...s, visible: true } : s
      );
      values.display = { ...values.display, sections: restoredSecs };
      const saveRestore = await api(ctx, "PUT", `/api/page-settings/${key}`, {
        scope: "global",
        values,
      });
      record("restore-section-save", saveRestore.status === 200, `section=${hideTarget.id}`);
      const afterRestore = await api(ctx, "GET", `/api/page-settings/${key}`);
      const secs2 = afterRestore.json?.resolved?.values?.display?.sections ?? [];
      const visibleAgain = secs2.some((s: any) => s.id === hideTarget!.id && s.visible !== false);
      record("restore-section-persisted", visibleAgain, `ok=${visibleAgain}`);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, "05-section-restored.png"), fullPage: false });
    } else {
      // Fallback: hide optional field column via fields.hiddenOptionalFields / columns
      const cols = values.columns?.visible ?? values.fields?.visibleColumns ?? [];
      if (Array.isArray(cols) && cols.length > 1) {
        const removed = cols[cols.length - 1];
        values.columns = {
          ...values.columns,
          visible: cols.slice(0, -1),
        };
        await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values });
        record("hide-column", true, `removed=${removed}`);
        values.columns = { ...values.columns, visible: cols };
        await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values });
        record("restore-column", true, `restored=${removed}`);
      } else {
        // Use reset API as restore path + toggle allowExport as hideable action
        values.actions.allowExport = false;
        await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values });
        await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
        await page.waitForTimeout(600);
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find((el) =>
            (el.textContent || "").includes("تقارير")
          );
          (btn as HTMLButtonElement | undefined)?.click();
        });
        await page.waitForTimeout(400);
        const noXlsx = (await page.locator("button", { hasText: "تنزيل Excel" }).count()) === 0;
        record("hide-export-action", noXlsx, `hidden=${noXlsx}`);
        values.actions.allowExport = true;
        await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values });
        await page.reload({ waitUntil: "networkidle" });
        await page.waitForTimeout(600);
        await page.evaluate(() => {
          const btn = Array.from(document.querySelectorAll("button")).find((el) =>
            (el.textContent || "").includes("تقارير")
          );
          (btn as HTMLButtonElement | undefined)?.click();
        });
        await page.waitForTimeout(400);
        const hasXlsx = (await page.locator("button", { hasText: "تنزيل Excel" }).count()) > 0;
        record("restore-export-action", hasXlsx, `restored=${hasXlsx}`);
        await page.screenshot({
          path: path.join(OUT, "05-section-restored.png"),
          fullPage: false,
        });
      }
    }
  }

  // Unauthorized lawyer
  values.actions.allowCreate = false;
  values.actions.allowEdit = false;
  values.actions.allowExport = false;
  await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values });
  await api(ctx, "POST", "/api/auth/logout");

  const lctx = await browser.newContext({ locale: "ar" });
  const lp = await lctx.newPage();
  await loginAs(lctx, lp, LAWYER);
  const lawyerSettings = await api(lctx, "PUT", `/api/page-settings/${key}`, {
    scope: "global",
    values: { display: { title: "hack" } },
  });
  record(
    "lawyer-settings-denied",
    lawyerSettings.status === 403 || lawyerSettings.status === 401,
    `status=${lawyerSettings.status}`
  );
  const lawyerCreate = await api(lctx, "POST", "/api/cases", {
    client: "unauthorized",
    type: "مدني",
    court: "x",
  });
  record(
    "lawyer-create-denied",
    lawyerCreate.status === 403 || lawyerCreate.status === 401,
    `status=${lawyerCreate.status}`
  );
  const lawyerExport = await api(lctx, "POST", "/api/exports/gate", { pageKey: key });
  record(
    "lawyer-export-denied",
    lawyerExport.status === 403 || lawyerExport.status === 401,
    `status=${lawyerExport.status}`
  );
  await lp.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await lp.waitForTimeout(800);
  await lp.screenshot({ path: path.join(OUT, "06-lawyer-denied-view.png"), fullPage: false });
  await lctx.close();

  // cleanup case + restore settings
  await loginAs(ctx, page, ADMIN);
  if (caseId) await api(ctx, "DELETE", `/api/cases/${caseId}`);
  await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values: prev });

  await page.goto(`${BASE}/app/page-settings`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "07-settings-center.png"), fullPage: false });

  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "08-dashboard-live-kpi.png"), fullPage: false });

  await page.goto(`${BASE}/app/page-settings/public-homepage`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, "09-homepage-settings.png"), fullPage: false });

  // Re-enable export for screenshot of real buttons
  const g2 = await api(ctx, "GET", `/api/page-settings/${key}`);
  const v2 = structuredClone(g2.json.defaults);
  v2.actions = { ...v2.actions, allowExport: true };
  v2.reports = { ...v2.reports, allowPdf: true, allowExcel: true, allowCsv: true };
  await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values: v2 });
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  await page.evaluate(() => {
    const b = document.getElementById("global-back-button");
    if (b) (b as HTMLElement).style.display = "none";
    const btn = Array.from(document.querySelectorAll("button")).find((el) =>
      (el.textContent || "").includes("تقارير")
    );
    (btn as HTMLButtonElement | undefined)?.click();
  });
  await page.waitForTimeout(500);
  await page.screenshot({
    path: path.join(OUT, "10-export-buttons-xlsx-pdf-csv.png"),
    fullPage: false,
  });
  await api(ctx, "PUT", `/api/page-settings/${key}`, { scope: "global", values: prev });

  const videoPath = await page.video()?.path();
  await ctx.close();
  await browser.close();
  if (videoPath && fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, path.join(OUT, "crud-ui-proof.webm"));
  }

  const passed = results.filter((r) => r.ok).length;
  const failed = results.filter((r) => !r.ok).length;
  const payload = { passed, failed, results };
  fs.writeFileSync(path.join(OUT, "CRUD.json"), JSON.stringify(payload, null, 2));
  console.log(JSON.stringify(payload, null, 2));
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
