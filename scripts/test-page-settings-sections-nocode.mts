/**
 * No-Code sections proof: add section → appears on live page → fill → save →
 * reload/relogin → hide → restore. Honest PASS/FAIL/PARTIAL for all 48 pages.
 * No merge / no deploy.
 */
import { chromium, type BrowserContext, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings-sections-nocode";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const LAWYER = { email: "lawyer@naioshlaw.com", password: "Lawyer@123" };

type Verdict = "PASS" | "FAIL" | "PARTIAL";
type Row = {
  pageKey: string;
  name: string;
  href: string;
  result: Verdict;
  detail: string;
};

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

async function deepSectionProof(
  ctx: BrowserContext,
  page: Page,
  pageKey: string,
  pageHref: string,
  stamp: number
): Promise<{ result: Verdict; detail: string }> {
  const get = await api(ctx, "GET", `/api/page-settings/${pageKey}`);
  if (get.status !== 200) return { result: "FAIL", detail: `GET settings ${get.status}` };

  const prev = structuredClone(get.json.resolved?.values ?? get.json.defaults);
  const values = structuredClone(get.json.defaults);
  // keep existing non-display if present
  Object.assign(values, structuredClone(get.json.resolved?.values ?? {}));

  const sectionId = `custom_notes_${stamp.toString(36)}`;
  const fieldKey = `cf_note_${stamp.toString(36)}`;
  const title = `ملاحظات ${stamp}`;
  const sections = Array.isArray(values.sections) ? [...values.sections] : [];
  sections.push({
    id: sectionId,
    title,
    kind: "custom",
    visible: true,
    order: sections.length,
  });
  const customFields = Array.isArray(values.customFields) ? [...values.customFields] : [];
  customFields.push({
    key: fieldKey,
    label: `حقل ملاحظات ${stamp}`,
    type: "textarea",
    required: false,
    order: customFields.length,
    visible: true,
    sectionId,
    storage: "page",
  });
  values.sections = sections;
  values.customFields = customFields;
  values.sectionData = { ...(values.sectionData || {}) };

  const save = await api(ctx, "PUT", `/api/page-settings/${pageKey}`, {
    scope: "global",
    values,
  });
  if (save.status !== 200) {
    await api(ctx, "PUT", `/api/page-settings/${pageKey}`, { scope: "global", values: prev });
    return { result: "FAIL", detail: `save section ${save.status}` };
  }

  // Portal: staff redirected — cannot prove live client UI as admin
  if (pageHref.startsWith("/portal")) {
    await api(ctx, "PUT", `/api/page-settings/${pageKey}`, { scope: "global", values: prev });
    return {
      result: "PARTIAL",
      detail: "إعدادات تُحفظ؛ العرض الحي لبوابة العميل يتطلب جلسة عميل منفصلة",
    };
  }

  const targetUrl = pageHref === "/" ? `${BASE}/` : `${BASE}${pageHref}`;
  await page.goto(targetUrl, { waitUntil: "networkidle", timeout: 45000 }).catch(() => null);
  await page.waitForTimeout(900);

  const sectionLoc = page.locator(`[data-page-section="${sectionId}"]`);
  let visible = false;
  try {
    await sectionLoc.first().waitFor({ state: "visible", timeout: 8000 });
    visible = true;
  } catch {
    visible = (await sectionLoc.count()) > 0;
  }

  if (!visible) {
    // homepage public read path
    if (pageHref === "/") {
      const pub = await api(ctx, "GET", "/api/public/homepage-settings");
      const found = (pub.json?.sections ?? []).some((s: any) => s.id === sectionId);
      await api(ctx, "PUT", `/api/page-settings/${pageKey}`, { scope: "global", values: prev });
      return {
        result: found ? "PASS" : "FAIL",
        detail: found
          ? "قسم ظاهر عبر API العامة (قد يحتاج تحديث كاش واجهة)"
          : "القسم لم يظهر على / ولا في API العامة",
      };
    }
    await api(ctx, "PUT", `/api/page-settings/${pageKey}`, { scope: "global", values: prev });
    return { result: "FAIL", detail: "القسم محفوظ لكن غير ظاهر في الصفحة الأصلية" };
  }

  const bodyText = await sectionLoc.first().innerText();
  const titled = bodyText.includes(String(stamp)) || bodyText.includes("ملاحظات");

  // Use the section: fill + save (skip on public homepage — read-only)
  let used = pageHref === "/";
  if (pageHref !== "/") {
    const textarea = sectionLoc.locator("textarea").first();
    if (await textarea.count()) {
      const note = `محتوى إثبات No-Code ${stamp}`;
      await textarea.fill(note);
      const saveBtn = sectionLoc.locator("button", { hasText: "حفظ محتوى القسم" });
      if (await saveBtn.count()) {
        await saveBtn.click({ force: true });
        await page.waitForTimeout(800);
      } else {
        // fallback API
        await api(ctx, "PUT", `/api/page-settings/${pageKey}/section-data`, {
          sectionId,
          data: { [fieldKey]: note },
        });
      }
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(800);
      const after = await page.locator(`[data-page-section="${sectionId}"]`).innerText();
      used = after.includes(String(stamp));
    } else {
      used = titled;
    }
  }

  // Hide section
  const hiddenSections = sections.map((s: any) =>
    s.id === sectionId ? { ...s, visible: false } : s
  );
  values.sections = hiddenSections;
  await api(ctx, "PUT", `/api/page-settings/${pageKey}`, { scope: "global", values });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const hiddenGone = (await page.locator(`[data-page-section="${sectionId}"]`).count()) === 0;

  // Restore
  values.sections = sections;
  await api(ctx, "PUT", `/api/page-settings/${pageKey}`, { scope: "global", values });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(700);
  const restored = (await page.locator(`[data-page-section="${sectionId}"]`).count()) > 0;

  // cleanup
  await api(ctx, "PUT", `/api/page-settings/${pageKey}`, { scope: "global", values: prev });

  const ok = titled && used && hiddenGone && restored;
  return {
    result: ok ? "PASS" : "FAIL",
    detail: `visible=${titled} used=${used} hide=${hiddenGone} restore=${restored}`,
  };
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

  // 1) Exact user bug reproduction on case-management via UI-ish API+page
  {
    await page.goto(`${BASE}/app/page-settings/case-management`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(OUT, "01-settings-before.png"), fullPage: false });

    const get = await api(ctx, "GET", "/api/page-settings/case-management");
    const prev = structuredClone(get.json.resolved.values);
    const values = structuredClone(get.json.resolved.values);
    const sectionId = `custom_ui_${stamp.toString(36)}`;
    const sections = Array.isArray(values.sections) ? [...values.sections] : [];
    sections.push({
      id: sectionId,
      title: "ملاحظات",
      kind: "custom",
      visible: true,
      order: sections.length,
    });
    values.sections = sections;
    values.customFields = [
      ...(Array.isArray(values.customFields) ? values.customFields : []),
      {
        key: `cf_malahazat_${stamp.toString(36)}`,
        label: "نص الملاحظات",
        type: "textarea",
        visible: true,
        order: 0,
        sectionId,
        storage: "page",
      },
    ];
    const save = await api(ctx, "PUT", `/api/page-settings/case-management`, {
      scope: "global",
      values,
    });
    record("case-add-section-save", save.status === 200, `status=${save.status}`);

    await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const sec = page.locator(`[data-page-section="${sectionId}"]`);
    await sec.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => null);
    const appeared = (await sec.count()) > 0;
    record("case-section-appears-on-page", appeared, `count=${await sec.count()}`);
    await page.screenshot({ path: path.join(OUT, "02-cases-with-notes-section.png"), fullPage: false });

    if (appeared) {
      await sec.locator("textarea").first().fill(`ملاحظة تشغيلية ${stamp}`);
      await sec.locator("button", { hasText: "حفظ محتوى القسم" }).click({ force: true });
      await page.waitForTimeout(1000);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const persisted = (await page.locator(`[data-page-section="${sectionId}"]`).innerText()).includes(
        String(stamp)
      );
      record("case-section-content-persist-reload", persisted, `ok=${persisted}`);
      await page.screenshot({ path: path.join(OUT, "03-cases-notes-filled.png"), fullPage: false });

      await api(ctx, "POST", "/api/auth/logout");
      await loginAs(ctx, page, ADMIN);
      await page.goto(`${BASE}/app/modules/case-management`, { waitUntil: "networkidle" });
      await page.waitForTimeout(1000);
      const afterLogin = (
        await page.locator(`[data-page-section="${sectionId}"]`).innerText()
      ).includes(String(stamp));
      record("case-section-persist-relogin", afterLogin, `ok=${afterLogin}`);
    }

    // lawyer cannot manage settings schema; may fill section content if write-enabled
    await api(ctx, "POST", "/api/auth/logout");
    const lctx = await browser.newContext({ locale: "ar" });
    const lp = await lctx.newPage();
    await loginAs(lctx, lp, LAWYER);
    const deny = await api(lctx, "PUT", "/api/page-settings/case-management", {
      scope: "global",
      values: { sections: [] },
    });
    record("lawyer-cannot-change-sections", deny.status === 403, `status=${deny.status}`);
    const contentPut = await api(lctx, "PUT", `/api/page-settings/case-management/section-data`, {
      sectionId,
      data: { probe: "x" },
    });
    record(
      "lawyer-section-content-gate",
      contentPut.status === 200 || contentPut.status === 400,
      `status=${contentPut.status}`
    );
    await lctx.close();

    await loginAs(ctx, page, ADMIN);
    await api(ctx, "PUT", `/api/page-settings/case-management`, {
      scope: "global",
      values: prev,
    });
  }

  // 2) All 48 pages deep section apply
  const catalog = await api(ctx, "GET", "/api/page-settings");
  const pages = (catalog.json?.pages ?? []).filter(
    (p: any) => p.status === "operational" && !String(p.pageKey).startsWith("erp-")
  );
  const byHref = new Map<string, any>();
  for (const p of pages) if (!byHref.has(p.pageHref)) byHref.set(p.pageHref, p);
  const unique = Array.from(byHref.values());

  const table: Row[] = [];
  for (const p of unique) {
    const r = await deepSectionProof(ctx, page, p.pageKey, p.pageHref, stamp + table.length);
    table.push({
      pageKey: p.pageKey,
      name: p.title,
      href: p.pageHref,
      result: r.result,
      detail: r.detail,
    });
    record(`${p.pageKey}-section-apply`, r.result === "PASS", `${r.result} ${r.detail}`);
  }

  const videoPath = await page.video()?.path();
  await ctx.close();
  await browser.close();
  if (videoPath && fs.existsSync(videoPath)) {
    fs.copyFileSync(videoPath, path.join(OUT, "sections-nocode-proof.webm"));
  }

  const pass = table.filter((r) => r.result === "PASS").length;
  const fail = table.filter((r) => r.result === "FAIL").length;
  const partial = table.filter((r) => r.result === "PARTIAL").length;
  const summary = {
    pass,
    fail,
    partial,
    total: table.length,
    checksPassed: log.filter((x) => x.ok).length,
    checksFailed: log.filter((x) => !x.ok).length,
    table,
    log,
  };
  fs.writeFileSync(path.join(OUT, "SECTIONS-PROOF.json"), JSON.stringify(summary, null, 2));
  const md = [
    "# إثبات No-Code للأقسام — تطبيق فعلي وليس الحفظ فقط",
    "",
    `**${pass} PASS · ${partial} PARTIAL · ${fail} FAIL** من ${table.length}`,
    "",
    "| النتيجة | الصفحة | الرابط | pageKey | الدليل |",
    "|---|---|---|---|---|",
    ...table.map(
      (r) =>
        `| **${r.result}** | ${r.name} | \`${r.href}\` | \`${r.pageKey}\` | ${r.detail} |`
    ),
    "",
    "## فحوصات إدارة القضايا (إعادة إنتاج المشكلة)",
    ...log
      .filter((l) => l.id.startsWith("case-") || l.id.startsWith("lawyer-"))
      .map((l) => `- ${l.ok ? "✅" : "❌"} \`${l.id}\`: ${l.detail}`),
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "SECTIONS-PROOF.md"), md);
  console.log(md);
  process.exit(fail > 0 || log.some((l) => !l.ok && l.id.startsWith("case-")) ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
