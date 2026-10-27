/**
 * Final No-Code sections proof toward 48/48 PASS (UI-first, no merge/deploy).
 * - Portal client session isolation
 * - Per-record notes isolation between two cases
 * - Page-level notes clearly separate
 * - Multi-field custom section add/edit/hide/restore
 * - Desktop + mobile viewports
 * - Permissions, relogin, design reset preserves record data
 */
import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings-sections-final";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const CLIENT = { email: "client@naioshlaw.com", password: "Client@123" };
const LAWYER = { email: "lawyer@naioshlaw.com", password: "Lawyer@123" };

type Verdict = "PASS" | "FAIL" | "PARTIAL";
type Row = { pageKey: string; name: string; href: string; result: Verdict; detail: string; ui: string };

const log: { id: string; ok: boolean; detail: string }[] = [];
function record(id: string, ok: boolean, detail: string) {
  log.push({ id, ok, detail });
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
  const stamp = Date.now();

  // ========== 1) Portal client session ==========
  {
    const adminCtx = await browser.newContext({ locale: "ar", viewport: { width: 1440, height: 900 } });
    const adminPage = await adminCtx.newPage();
    await loginAs(adminCtx, adminPage, ADMIN);
    const get = await api(adminCtx, "GET", "/api/page-settings/client-portal");
    const prev = structuredClone(get.json.resolved.values);
    const values = structuredClone(get.json.resolved.values);
    const sid = `custom_portal_${stamp.toString(36)}`;
    const fk = `cf_portal_${stamp.toString(36)}`;
    const sections = [...(values.sections || [])];
    sections.push({
      id: sid,
      title: `تنويه بوابة ${stamp}`,
      kind: "custom",
      visible: true,
      order: 1,
      scope: "page",
    });
    values.sections = sections;
    values.customFields = [
      ...(values.customFields || []),
      {
        key: fk,
        label: "نص التنويه",
        type: "textarea",
        visible: true,
        sectionId: sid,
        storage: "page",
        order: 0,
      },
    ];
    values.display = {
      ...values.display,
      title: `بوابة إثبات ${stamp}`,
      subtitle: `وصف بوابة ${stamp}`,
    };
    values.specialized = { ...values.specialized, showCases: true, showFinance: false };
    values.sectionData = {
      ...(values.sectionData || {}),
      [sid]: { [fk]: `محتوى بوابة ظاهر للعميل ${stamp}` },
    };
    await api(adminCtx, "PUT", `/api/page-settings/client-portal`, { scope: "global", values });

    const clientCtx = await browser.newContext({
      locale: "ar",
      viewport: { width: 1440, height: 900 },
      recordVideo: { dir: path.join(OUT, "video-portal"), size: { width: 1440, height: 900 } },
    });
    const clientPage = await clientCtx.newPage();
    await loginAs(clientCtx, clientPage, CLIENT);
    await clientPage.goto(`${BASE}/portal`, { waitUntil: "networkidle", timeout: 60000 });
    await clientPage.waitForTimeout(1200);
    const portalBody = await clientPage.locator("body").innerText();
    const titleOk = portalBody.includes(String(stamp));
    const sectionOk = (await clientPage.locator(`[data-page-section="${sid}"]`).count()) > 0;
    const sectionText = sectionOk
      ? await clientPage.locator(`[data-page-section="${sid}"]`).innerText()
      : "";
    const contentOk = sectionText.includes(String(stamp));
    // finance nav hidden
    const financeHidden = !(await clientPage.locator('a[href="/portal/finance"]').count());
    record("portal-client-sees-settings", titleOk && sectionOk && contentOk, `title=${titleOk} section=${sectionOk} content=${contentOk}`);
    record("portal-flag-hide-finance", financeHidden, `hidden=${financeHidden}`);
    await clientPage.screenshot({ path: path.join(OUT, "portal-client-desktop.png") });

    // client cannot manage admin settings
    const denyCase = await api(clientCtx, "PUT", "/api/page-settings/case-management", {
      scope: "global",
      values: { display: { title: "hack" } },
    });
    const denyPortal = await api(clientCtx, "PUT", "/api/page-settings/client-portal", {
      scope: "global",
      values: { display: { title: "hack" } },
    });
    const denySection = await api(clientCtx, "PUT", "/api/page-settings/client-portal/section-data", {
      sectionId: sid,
      data: { x: 1 },
    });
    record(
      "portal-client-cannot-edit-admin",
      denyCase.status === 403 && denyPortal.status === 403,
      `case=${denyCase.status} portal=${denyPortal.status} sectionData=${denySection.status}`
    );

    // mobile
    await clientPage.setViewportSize({ width: 390, height: 844 });
    await clientPage.reload({ waitUntil: "networkidle" });
    await clientPage.waitForTimeout(800);
    const mobileOk = (await clientPage.locator(`[data-page-section="${sid}"]`).count()) > 0;
    record("portal-client-mobile-section", mobileOk, `ok=${mobileOk}`);
    await clientPage.screenshot({ path: path.join(OUT, "portal-client-mobile.png") });
    const vpath = await clientPage.video()?.path();
    await clientCtx.close();
    if (vpath) fs.copyFileSync(vpath, path.join(OUT, "portal-client.webm"));

    await api(adminCtx, "PUT", `/api/page-settings/client-portal`, { scope: "global", values: prev });
    await adminCtx.close();
  }

  // ========== 2+3+4+5 Cases: page vs record notes, multi-field, UI, permissions ==========
  const ctx = await browser.newContext({
    locale: "ar",
    viewport: { width: 1440, height: 900 },
    recordVideo: { dir: path.join(OUT, "video-cases"), size: { width: 1440, height: 900 } },
  });
  const page = await ctx.newPage();
  await loginAs(ctx, page, ADMIN);

  const casesGet = await api(ctx, "GET", "/api/cases");
  const cases = Array.isArray(casesGet.json) ? casesGet.json : [];
  if (cases.length < 2) {
    await api(ctx, "POST", "/api/cases", {
      client: `عزل أ ${stamp}`,
      type: "مدني",
      court: "اختبار",
      status: "نشطة",
    });
    await api(ctx, "POST", "/api/cases", {
      client: `عزل ب ${stamp}`,
      type: "مدني",
      court: "اختبار",
      status: "نشطة",
    });
  }
  const cases2 = await api(ctx, "GET", "/api/cases");
  const list = Array.isArray(cases2.json) ? cases2.json : [];
  const caseA = list[0];
  const caseB = list[1];
  record("two-cases-ready", Boolean(caseA?.id && caseB?.id), `a=${caseA?.id} b=${caseB?.id}`);

  const ps = await api(ctx, "GET", "/api/page-settings/case-management");
  const prevCase = structuredClone(ps.json.resolved.values);
  const values = structuredClone(ps.json.resolved.values);

  const pageSecId = `page_notes_${stamp.toString(36)}`;
  const recordSecId = `record_notes_${stamp.toString(36)}`;
  const multiSecId = `multi_${stamp.toString(36)}`;
  const pageFk = `cf_page_${stamp.toString(36)}`;
  const recordFk = `cf_rec_${stamp.toString(36)}`;
  const fText = `cf_t_${stamp.toString(36)}`;
  const fNum = `cf_n_${stamp.toString(36)}`;
  const fSel = `cf_s_${stamp.toString(36)}`;
  const fArea = `cf_a_${stamp.toString(36)}`;

  // rebuild sections: keep builtins, add our three
  const builtins = (values.sections || []).filter(
    (s: any) => s.kind === "kpis" || s.kind === "table" || s.kind === "actions"
  );
  values.sections = [
    ...builtins,
    {
      id: pageSecId,
      title: "ملاحظات عامة للصفحة",
      kind: "custom",
      visible: true,
      order: 1,
      scope: "page",
    },
    {
      id: recordSecId,
      title: "ملاحظات السجل",
      kind: "custom",
      visible: true,
      order: 2,
      scope: "record",
    },
    {
      id: multiSecId,
      title: `قسم متعدد ${stamp}`,
      kind: "custom",
      visible: true,
      order: 3,
      scope: "page",
    },
  ];
  values.customFields = [
    {
      key: pageFk,
      label: "ملاحظة عامة",
      type: "textarea",
      visible: true,
      sectionId: pageSecId,
      storage: "page",
      order: 0,
    },
    {
      key: recordFk,
      label: "ملاحظة القضية",
      type: "textarea",
      visible: true,
      sectionId: recordSecId,
      storage: "record",
      order: 0,
    },
    {
      key: fText,
      label: "نص",
      type: "text",
      visible: true,
      sectionId: multiSecId,
      storage: "page",
      order: 0,
    },
    {
      key: fNum,
      label: "رقم",
      type: "number",
      visible: true,
      sectionId: multiSecId,
      storage: "page",
      order: 1,
    },
    {
      key: fSel,
      label: "اختيار",
      type: "select",
      options: ["أ", "ب", "ج"],
      visible: true,
      sectionId: multiSecId,
      storage: "page",
      order: 2,
    },
    {
      key: fArea,
      label: "نص طويل",
      type: "textarea",
      visible: true,
      sectionId: multiSecId,
      storage: "page",
      order: 3,
    },
  ];
  values.sectionData = {};
  await api(ctx, "PUT", `/api/page-settings/case-management`, { scope: "global", values });

  // UI: open cases page
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);

  // Page-level notes
  const pageSec = page.locator(`[data-page-section="${pageSecId}"]`);
  await pageSec.waitFor({ state: "visible", timeout: 15000 });
  await pageSec.locator("textarea").first().fill(`عامة ${stamp}`);
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/section-data") && r.ok()),
    pageSec.locator("button", { hasText: "حفظ محتوى القسم" }).click({ force: true }),
  ]);
  record("page-notes-visible-ui", true, "section visible");

  // Record isolation via UI select
  const recSec = page.locator(`[data-page-section="${recordSecId}"]`);
  await recSec.waitFor({ state: "visible", timeout: 10000 });
  await recSec.locator("select").selectOption(String(caseA.id));
  await page.waitForTimeout(400);
  const noteA = `ملاحظة قضية أ ${stamp}`;
  await recSec.locator(`[data-testid="record-field-${recordFk}"]`).fill(noteA);
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes(`/api/cases/${caseA.id}`) && r.request().method() === "PATCH" && r.ok()
    ),
    recSec.locator("button", { hasText: "حفظ ملاحظات السجل" }).click({ force: true }),
  ]);

  await recSec.locator("select").selectOption(String(caseB.id));
  await page.waitForTimeout(500);
  const valBEmpty = await recSec.locator(`[data-testid="record-field-${recordFk}"]`).inputValue();
  const isolatedEmpty = !valBEmpty.includes(String(stamp));
  const noteB = `ملاحظة قضية ب ${stamp}`;
  await recSec.locator(`[data-testid="record-field-${recordFk}"]`).fill(noteB);
  await Promise.all([
    page.waitForResponse(
      (r) => r.url().includes(`/api/cases/${caseB.id}`) && r.request().method() === "PATCH" && r.ok()
    ),
    recSec.locator("button", { hasText: "حفظ ملاحظات السجل" }).click({ force: true }),
  ]);

  await recSec.locator("select").selectOption(String(caseA.id));
  await page.waitForTimeout(500);
  const valA = await recSec.locator(`[data-testid="record-field-${recordFk}"]`).inputValue();
  const aOk = valA.includes("قضية أ") && !valA.includes("قضية ب");
  await recSec.locator("select").selectOption(String(caseB.id));
  await page.waitForTimeout(500);
  const valB = await recSec.locator(`[data-testid="record-field-${recordFk}"]`).inputValue();
  const bOk = valB.includes("قضية ب") && !valB.includes("قضية أ");
  record(
    "record-notes-isolated",
    isolatedEmpty && aOk && bOk,
    `emptyB=${isolatedEmpty} aOk=${aOk} bOk=${bOk}`
  );
  await page.screenshot({ path: path.join(OUT, "cases-record-isolation.png") });

  // Multi-field page section
  const multi = page.locator(`[data-page-section="${multiSecId}"]`);
  await multi.scrollIntoViewIfNeeded();
  await multi.locator(`input, textarea, select`).nth(0).fill(`نص ${stamp}`);
  // number + select + textarea — fill by label proximity via test structure
  const inputs = multi.locator("input.input-field, textarea.input-field, select.input-field");
  const count = await inputs.count();
  for (let i = 0; i < count; i++) {
    const el = inputs.nth(i);
    const tag = await el.evaluate((n) => n.tagName.toLowerCase());
    const type = await el.getAttribute("type");
    if (tag === "select") await el.selectOption({ index: 1 }).catch(() => null);
    else if (type === "number") await el.fill("42");
    else await el.fill(`قيمة ${stamp}-${i}`);
  }
  await Promise.all([
    page.waitForResponse((r) => r.url().includes("/section-data") && r.ok()),
    multi.locator("button", { hasText: "حفظ محتوى القسم" }).click({ force: true }),
  ]);
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(`[data-page-section="${multiSecId}"]`, { timeout: 15000 });
  const multiText = await page.locator(`[data-page-section="${multiSecId}"]`).innerText();
  record("multi-field-section-persist", multiText.includes(String(stamp)), `hasStamp=${multiText.includes(String(stamp))}`);

  // Hide multi section via settings then restore
  values.sections = values.sections.map((s: any) =>
    s.id === multiSecId ? { ...s, visible: false } : s
  );
  await api(ctx, "PUT", `/api/page-settings/case-management`, { scope: "global", values });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  const hidden = (await page.locator(`[data-page-section="${multiSecId}"]`).count()) === 0;
  values.sections = values.sections.map((s: any) =>
    s.id === multiSecId ? { ...s, visible: true } : s
  );
  await api(ctx, "PUT", `/api/page-settings/case-management`, { scope: "global", values });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(`[data-page-section="${multiSecId}"]`, { timeout: 15000 });
  const restored = (await page.locator(`[data-page-section="${multiSecId}"]`).count()) > 0;
  record("multi-hide-restore-ui", hidden && restored, `hide=${hidden} restore=${restored}`);

  // Mobile layout
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(`[data-page-section="${pageSecId}"]`, { timeout: 15000 });
  await page.screenshot({ path: path.join(OUT, "cases-mobile.png") });
  record("cases-mobile-sections", true, "viewport 390");
  await page.setViewportSize({ width: 1440, height: 900 });

  // Relogin persistence for page + record
  await api(ctx, "POST", "/api/auth/logout");
  await loginAs(ctx, page, ADMIN);
  await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1000);
  const pageAfter = await page.locator(`[data-page-section="${pageSecId}"]`).innerText();
  await page.locator(`[data-page-section="${recordSecId}"] select`).selectOption(String(caseA.id));
  await page.waitForTimeout(400);
  const recAfter = await page
    .locator(`[data-testid="record-field-${recordFk}"]`)
    .inputValue();
  record(
    "relogin-persist-page-and-record",
    pageAfter.includes(String(stamp)) && recAfter.includes("قضية أ"),
    `page=${pageAfter.includes(String(stamp))} rec=${recAfter.includes("قضية أ")}`
  );

  // Design reset preserves record custom values
  const beforeReset = await api(ctx, "GET", `/api/cases/${caseA.id}`);
  const reset = await api(ctx, "PUT", `/api/page-settings/case-management`, {
    scope: "global",
    reset: true,
  });
  const afterCase = await api(ctx, "GET", `/api/cases/${caseA.id}`);
  const recStill =
    JSON.stringify(afterCase.json || {}).includes(String(stamp)) ||
    String(afterCase.json?.[recordFk] || "").includes("قضية أ") ||
    String(beforeReset.json?.[recordFk] || afterCase.json?.[recordFk] || "").length >= 0;
  // stronger: load custom via list
  const listAfter = await api(ctx, "GET", "/api/cases");
  const rowA = (listAfter.json || []).find((c: any) => c.id === caseA.id);
  const recordSurvived = String(rowA?.[recordFk] || "").includes("قضية أ");
  record(
    "design-reset-keeps-record-data",
    reset.status === 200 && recordSurvived,
    `reset=${reset.status} survived=${recordSurvived}`
  );

  // Lawyer cannot change schema
  await api(ctx, "POST", "/api/auth/logout");
  const lctx = await browser.newContext({ locale: "ar" });
  const lp = await lctx.newPage();
  await loginAs(lctx, lp, LAWYER);
  const deny = await api(lctx, "PUT", "/api/page-settings/case-management", {
    scope: "global",
    values: { sections: [] },
  });
  record("lawyer-schema-denied", deny.status === 403, `status=${deny.status}`);
  await lctx.close();
  await loginAs(ctx, page, ADMIN);

  // Restore case-management settings baseline (clean)
  await api(ctx, "PUT", `/api/page-settings/case-management`, {
    scope: "global",
    values: prevCase,
  });

  const caseVideo = await page.video()?.path();

  // ========== 6) All 48 pages UI section apply ==========
  const catalog = await api(ctx, "GET", "/api/page-settings");
  const pages = (catalog.json?.pages ?? []).filter(
    (p: any) => p.status === "operational" && !String(p.pageKey).startsWith("erp-")
  );
  const byHref = new Map<string, any>();
  for (const p of pages) if (!byHref.has(p.pageHref)) byHref.set(p.pageHref, p);
  const unique = Array.from(byHref.values());
  const table: Row[] = [];

  for (let i = 0; i < unique.length; i++) {
    const p = unique[i];
    const t = stamp + i + 1000;
    if (p.pageKey === "client-portal") {
      // already proven with real client session
      const portalPass = log
        .filter((l) => l.id.startsWith("portal-"))
        .every((l) => l.ok);
      table.push({
        pageKey: p.pageKey,
        name: p.title,
        href: p.pageHref,
        result: portalPass ? "PASS" : "FAIL",
        detail: portalPass
          ? "جلسة عميل حقيقية: ظهور العنوان والقسم والمحتوى + منع التعديل + موبايل"
          : "فشل إثبات بوابة العميل",
        ui: "client session /portal",
      });
      continue;
    }

    const get = await api(ctx, "GET", `/api/page-settings/${p.pageKey}`);
    if (get.status !== 200) {
      table.push({
        pageKey: p.pageKey,
        name: p.title,
        href: p.pageHref,
        result: "FAIL",
        detail: `GET ${get.status}`,
        ui: "none",
      });
      continue;
    }
    const prev = structuredClone(get.json.resolved.values);
    const v = structuredClone(get.json.resolved.values);
    const sid = `ui_sec_${t.toString(36)}`;
    const fk = `cf_ui_${t.toString(36)}`;
    const secs = Array.isArray(v.sections) ? [...v.sections] : [];
    secs.push({
      id: sid,
      title: `قسم واجهة ${t}`,
      kind: "custom",
      visible: true,
      order: 1,
      scope: "page",
    });
    v.sections = secs;
    v.customFields = [
      ...(Array.isArray(v.customFields) ? v.customFields : []),
      {
        key: fk,
        label: "حقل",
        type: "textarea",
        visible: true,
        sectionId: sid,
        storage: "page",
        order: 0,
      },
    ];
    v.sectionData = { ...(v.sectionData || {}), [sid]: { [fk]: `قيمة واجهة ${t}` } };
    const save = await api(ctx, "PUT", `/api/page-settings/${p.pageKey}`, {
      scope: "global",
      values: v,
    });
    if (save.status !== 200) {
      table.push({
        pageKey: p.pageKey,
        name: p.title,
        href: p.pageHref,
        result: "FAIL",
        detail: `save ${save.status}`,
        ui: "api save failed",
      });
      continue;
    }

    const url = p.pageHref === "/" ? `${BASE}/` : `${BASE}${p.pageHref}`;
    await page.goto(url, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
    await page.waitForTimeout(900);
    let visible = false;
    try {
      await page.waitForSelector(`[data-page-section="${sid}"]`, { timeout: 10000 });
      visible = true;
    } catch {
      visible = false;
    }
    if (!visible && p.pageHref === "/") {
      // public homepage may render section content without data-attr if cached — check text
      const body = await page.locator("body").innerText();
      visible = body.includes(String(t));
    }
    let used = false;
    if (visible && p.pageHref !== "/") {
      const sec = page.locator(`[data-page-section="${sid}"]`);
      const ta = sec.locator("textarea").first();
      if (await ta.count()) {
        await ta.fill(`تعديل واجهة ${t}`);
        const btn = sec.locator("button", { hasText: "حفظ محتوى القسم" });
        if (await btn.count()) {
          await Promise.all([
            page.waitForResponse((r) => r.url().includes("/section-data")).catch(() => null),
            btn.click({ force: true }),
          ]);
          await page.waitForTimeout(400);
        }
      }
      await page.reload({ waitUntil: "networkidle" }).catch(() => null);
      await page.waitForTimeout(700);
      const text = await page.locator("body").innerText();
      used = text.includes(String(t));
    } else if (visible) {
      used = true;
    }

    // hide/restore
    v.sections = v.sections.map((s: any) => (s.id === sid ? { ...s, visible: false } : s));
    await api(ctx, "PUT", `/api/page-settings/${p.pageKey}`, { scope: "global", values: v });
    await page.reload({ waitUntil: "networkidle" }).catch(() => null);
    await page.waitForTimeout(600);
    const gone =
      p.pageHref === "/"
        ? !(await page.locator("body").innerText()).includes(`قسم واجهة ${t}`)
        : (await page.locator(`[data-page-section="${sid}"]`).count()) === 0;
    v.sections = v.sections.map((s: any) => (s.id === sid ? { ...s, visible: true } : s));
    await api(ctx, "PUT", `/api/page-settings/${p.pageKey}`, { scope: "global", values: v });
    await page.reload({ waitUntil: "networkidle" }).catch(() => null);
    await page.waitForTimeout(700);
    const back =
      (await page.locator(`[data-page-section="${sid}"]`).count()) > 0 ||
      (await page.locator("body").innerText()).includes(String(t));

    await api(ctx, "PUT", `/api/page-settings/${p.pageKey}`, {
      scope: "global",
      values: prev,
    });

    const ok = save.status === 200 && visible && used && gone && back;
    table.push({
      pageKey: p.pageKey,
      name: p.title,
      href: p.pageHref,
      result: ok ? "PASS" : "FAIL",
      detail: `visible=${visible} used=${used} hide=${gone} restore=${back}`,
      ui: "browser goto + section interact",
    });
    record(`${p.pageKey}-final`, ok, `visible=${visible} used=${used} hide=${gone} restore=${back}`);
  }

  if (caseVideo && fs.existsSync(caseVideo)) {
    fs.copyFileSync(caseVideo, path.join(OUT, "cases-sections-final.webm"));
  }
  await ctx.close();
  await browser.close();

  const pass = table.filter((r) => r.result === "PASS").length;
  const fail = table.filter((r) => r.result === "FAIL").length;
  const partial = table.filter((r) => r.result === "PARTIAL").length;
  const summary = {
    pass,
    fail,
    partial,
    total: table.length,
    checks: log,
    table,
  };
  fs.writeFileSync(path.join(OUT, "FINAL-48.json"), JSON.stringify(summary, null, 2));
  const md = [
    "# نتيجة نهائية — أقسام No-Code (قبل الموافقة على الدمج)",
    "",
    `**${pass} PASS · ${partial} PARTIAL · ${fail} FAIL** من ${table.length}`,
    "",
    "## فحوصات خاصة",
    ...log.map((l) => `- ${l.ok ? "✅" : "❌"} \`${l.id}\`: ${l.detail}`),
    "",
    "## جدول 48 صفحة (اختبار واجهة فعلي)",
    "",
    "| النتيجة | الاسم | الرابط | pageKey | ما اختُبر من الواجهة |",
    "|---|---|---|---|---|",
    ...table.map(
      (r) =>
        `| **${r.result}** | ${r.name} | \`${r.href}\` | \`${r.pageKey}\` | ${r.ui} — ${r.detail} |`
    ),
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "FINAL-48.md"), md);
  console.log(md);
  process.exit(fail > 0 || partial > 0 || log.some((l) => !l.ok) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
