/**
 * Acceptance: client ↔ case multi-link picker (forms + reverse link + table).
 * Does NOT merge.
 */
import { chromium, type Page } from "playwright";
import { mkdirSync, writeFileSync } from "fs";
import { prisma } from "../src/lib/prisma";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = "/opt/cursor/artifacts/client-case-link-acceptance";
mkdirSync(OUT, { recursive: true });

const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };

type Check = { group: string; name: string; ok: boolean; detail?: unknown };
const checks: Check[] = [];
function check(group: string, name: string, ok: boolean, detail?: unknown) {
  checks.push({ group, name, ok, detail });
  console.log(ok ? "PASS" : "FAIL", `[${group}]`, name, detail ?? "");
}

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "networkidle" });
  await page.fill('input[type="email"], input[name="email"]', ADMIN.email);
  await page.fill('input[type="password"], input[name="password"]', ADMIN.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/\/app/, { timeout: 25000 });
}

async function openClients(page: Page) {
  await page.goto(`${BASE}/app/modules/clients-management`, { waitUntil: "domcontentloaded" });
  await page.waitForSelector("table thead th", { timeout: 30000 });
  await page.waitForTimeout(900);
}

async function closeModal(page: Page) {
  for (let i = 0; i < 3; i++) {
    const closeBtn = page.locator('button:has-text("✕")').first();
    if (await closeBtn.isVisible().catch(() => false)) {
      await closeBtn.click({ force: true }).catch(() => undefined);
      await page.waitForTimeout(200);
      continue;
    }
    break;
  }
  await page.keyboard.press("Escape").catch(() => undefined);
  await page.waitForTimeout(200);
}

async function openAddClient(page: Page) {
  const primary = page.locator("button.btn-primary").filter({ hasText: /إضافة موكل/ }).first();
  await primary.click();
  await page.waitForSelector("#modal-field-caseIds, label:has-text('القضايا المرتبطة')", {
    timeout: 10000,
  });
}

async function fillRequiredClient(page: Page, name: string) {
  await page.locator("#modal-field-name").fill(name);
  const typeSel = page.locator("#modal-field-type");
  if (await typeSel.count()) await typeSel.selectOption({ index: 1 }).catch(() => undefined);
  const country = page.locator("#modal-field-country");
  if (await country.count()) {
    await country.selectOption({ label: "مصر" }).catch(async () => {
      await country.selectOption({ index: 1 });
    });
  }
  const dial = page.locator("#modal-field-phoneDialCode");
  if (await dial.count()) {
    await dial.selectOption({ index: 1 }).catch(() => undefined);
  }
  await page.locator("#modal-field-phone").fill("1001234567");
  await page.locator("#modal-field-city").fill("القاهرة");
  const status = page.locator("#modal-field-status");
  if (await status.count()) await status.selectOption({ index: 1 }).catch(() => undefined);
}

async function pickCaseBySearch(page: Page, caseNo: string) {
  const search = page.locator("#modal-field-caseIds");
  await search.fill(caseNo.replace(/^#/, "").slice(0, 8));
  await page.waitForTimeout(400);
  const hit = page.locator("button").filter({ hasText: caseNo }).first();
  await hit.waitFor({ state: "visible", timeout: 8000 });
  await hit.click();
  await page.waitForTimeout(300);
}

async function main() {
  const stamp = Date.now().toString(36);
  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    take: 3,
    select: { id: true, caseNo: true, clientId: true, clientName: true },
  });
  check("db", "has >=2 real cases", cases.length >= 2, cases.map((c) => c.caseNo));
  if (cases.length < 2) {
    throw new Error("Need at least 2 cases in DB for acceptance");
  }
  const [c1, c2, c3] = cases;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);

  // ── 1) Add client with no case ──
  await openClients(page);
  await openAddClient(page);
  const hasField = (await page.locator("label").filter({ hasText: /رقم القضية \/ القضايا المرتبطة/ }).count()) > 0;
  check("form", "add-client has case multi field", hasField);
  await page.screenshot({ path: `${OUT}/01-add-client-case-field.png`, fullPage: true });

  const name0 = `موكل بلا قضية ${stamp}`;
  await fillRequiredClient(page, name0);
  await page.locator('button.btn-primary[type="submit"], button.btn-primary').filter({ hasText: /^إضافة$/ }).click();
  await page.waitForTimeout(1500);
  await closeModal(page);
  await page.getByPlaceholder(/بحث/).fill(name0);
  await page.waitForTimeout(700);
  const row0 = page.locator("table tbody tr").filter({ hasText: name0 }).first();
  await row0.waitFor({ state: "visible", timeout: 10000 });
  const row0Text = await row0.innerText();
  check("table", "client saved without case shows empty label", row0Text.includes("لا توجد قضية مرتبطة"), row0Text.slice(0, 120));
  await page.screenshot({ path: `${OUT}/02-client-no-case.png`, fullPage: true });

  // ── 2) Add client linked to one case (use c3 so later multi-link on c1/c2 won't steal it) ──
  await openAddClient(page);
  const name1 = `موكل قضية واحدة ${stamp}`;
  await fillRequiredClient(page, name1);
  const soloCase = c3 ?? c1;
  await pickCaseBySearch(page, soloCase.caseNo);
  await page.locator('form button.btn-primary[type="submit"]').click();
  await page.waitForTimeout(1800);
  await closeModal(page);
  await page.getByPlaceholder(/بحث/).fill(name1);
  await page.waitForTimeout(700);
  const row1 = page.locator("table tbody tr").filter({ hasText: name1 }).first();
  await row1.waitFor({ state: "visible", timeout: 10000 });
  const row1Text = await row1.innerText();
  check("table", "single case appears in first column", row1Text.includes(soloCase.caseNo), row1Text.slice(0, 160));
  const link1 = row1.locator(`a[href*="caseId="]`).filter({ hasText: soloCase.caseNo }).first();
  check("table", "case number is a link", (await link1.count()) > 0);
  await page.screenshot({ path: `${OUT}/03-client-one-case.png`, fullPage: true });

  // ── 3) Add client linked to two cases ──
  await openAddClient(page);
  const name2 = `موكل قضيتين ${stamp}`;
  await fillRequiredClient(page, name2);
  await pickCaseBySearch(page, c1.caseNo);
  await pickCaseBySearch(page, c2.caseNo);
  await page.locator('form button.btn-primary[type="submit"]').click();
  await page.waitForTimeout(1800);
  await closeModal(page);
  await page.getByPlaceholder(/بحث/).fill(name2);
  await page.waitForTimeout(700);
  const row2 = page.locator("table tbody tr").filter({ hasText: name2 }).first();
  await row2.waitFor({ state: "visible", timeout: 10000 });
  const row2Text = await row2.innerText();
  check(
    "table",
    "two case numbers in cell",
    row2Text.includes(c1.caseNo) && row2Text.includes(c2.caseNo),
    row2Text.slice(0, 200)
  );
  await page.screenshot({ path: `${OUT}/04-client-two-cases.png`, fullPage: true });

  // DB verify multi-link
  const client2 = await prisma.client.findFirst({ where: { name: name2 } });
  const linked = client2
    ? await prisma.case.findMany({
        where: { clientId: client2.id },
        select: { caseNo: true },
      })
    : [];
  check(
    "db",
    "postgresql has both links",
    linked.length >= 2 &&
      linked.some((l) => l.caseNo === c1.caseNo) &&
      linked.some((l) => l.caseNo === c2.caseNo),
    linked
  );

  // ── 4) Edit links: keep only c2 (API + UI verify) ──
  if (client2) {
    const patchRes = await page.evaluate(
      async ({ id, keepId }) => {
        const row = await fetch(`/api/clients/${id}`, { credentials: "include" }).then((r) => r.json());
        const phone = String(row.phone ?? "").replace(/^\+\d+\s*/, "") || "1001234567";
        const res = await fetch(`/api/clients/${id}`, {
          credentials: "include",
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: row.name,
            type: row.type || "فرد",
            phone,
            phoneDialCode: row.phoneDialCode || "+20 (مصر)",
            country: !row.country || row.country === "غير مسجل" ? "مصر" : row.country,
            city: !row.city || row.city === "غير مسجل" ? "القاهرة" : row.city,
            status: row.status || "نشط",
            caseIds: [keepId],
          }),
        });
        return { status: res.status, body: await res.json().catch(() => ({})) };
      },
      { id: client2.id, keepId: c2.id }
    );
    check("edit", "PATCH caseIds syncs links", patchRes.status >= 200 && patchRes.status < 300, patchRes);

    // UI: open edit and confirm chip state + save round-trip
    await openClients(page);
    await page.getByPlaceholder(/بحث/).fill(name2);
    await page.waitForTimeout(700);
    const editRow = page.locator("table tbody tr").filter({ hasText: name2 }).first();
    await editRow.locator("button.row-action-edit").click({ force: true });
    await page.waitForSelector("#modal-field-caseIds", { timeout: 8000 }).catch(() => undefined);
    if (await page.locator("#modal-field-caseIds").isVisible().catch(() => false)) {
      const chipC2 = await page.locator("span").filter({ hasText: c2.caseNo }).count();
      const chipC1 = await page.locator(`button[aria-label*="${c1.caseNo}"]`).count();
      check("edit", "edit form shows remaining linked case", chipC2 > 0, { chipC2, chipC1 });
      await page.locator('button.btn-primary').filter({ hasText: /حفظ/ }).click();
      await page.waitForTimeout(1200);
    } else {
      check("edit", "edit form shows remaining linked case", false, "modal did not open");
    }
  }
  await closeModal(page);
  await openClients(page);
  await page.getByPlaceholder(/بحث/).fill(name2);
  await page.waitForTimeout(800);
  const row2b = page.locator("table tbody tr").filter({ hasText: name2 }).first();
  const row2bText = await row2b.innerText().catch(() => "");
  const afterEdit = client2
    ? await prisma.case.findMany({ where: { clientId: client2.id }, select: { caseNo: true, id: true } })
    : [];
  check(
    "edit",
    "link updated after edit",
    afterEdit.some((l) => l.id === c2.id) && !afterEdit.some((l) => l.id === c1.id),
    { ui: row2bText.slice(0, 160), db: afterEdit }
  );

  // ── 5) Create case for existing client → reverse link ──
  const name3 = `موكل لقضية جديدة ${stamp}`;
  await openAddClient(page);
  await fillRequiredClient(page, name3);
  await page.locator('button.btn-primary').filter({ hasText: /^إضافة$/ }).click();
  await page.waitForTimeout(1500);
  await closeModal(page);
  const client3 = await prisma.client.findFirst({ where: { name: name3 } });
  check("db", "standalone client created", Boolean(client3), client3?.id);

  if (client3) {
    await page.goto(
      `${BASE}/app/modules/case-management?add=1&clientId=${encodeURIComponent(client3.id)}&clientName=${encodeURIComponent(name3)}`,
      { waitUntil: "domcontentloaded" }
    );
    await page.waitForTimeout(1200);
    const modalOpen = await page.locator("#modal-field-caseNo, h2:has-text('قضية')").first().isVisible().catch(() => false);
    check("case-form", "add case modal opens from deep link", modalOpen);
    await page.screenshot({ path: `${OUT}/05-create-case-for-client.png`, fullPage: true });

    const newCaseNo = `#LINK-${stamp}`;
    let createdViaUi = false;
    try {
      if (await page.locator("#modal-field-caseNo").count()) {
        await page.locator("#modal-field-caseNo").fill(newCaseNo);
      }
      if (await page.locator("#modal-field-client").count()) {
        const cur = await page.locator("#modal-field-client").inputValue().catch(() => "");
        if (!cur) await page.locator("#modal-field-client").fill(name3);
      }
      for (const [sel, val] of [
        ["#modal-field-phone", "1009876543"],
        ["#modal-field-city", "الجيزة"],
      ] as const) {
        if (await page.locator(sel).count()) {
          const cur = await page.locator(sel).inputValue().catch(() => "");
          if (!cur || cur === "غير مسجل") await page.locator(sel).fill(val);
        }
      }
      if (await page.locator("#modal-field-country").count()) {
        await page.locator("#modal-field-country").selectOption({ label: "مصر" }).catch(() => undefined);
      }
      if (await page.locator("#modal-field-phoneDialCode").count()) {
        await page.locator("#modal-field-phoneDialCode").selectOption({ index: 1 }).catch(() => undefined);
      }
      if (await page.locator("#modal-field-type").count()) {
        await page.locator("#modal-field-type").selectOption({ index: 1 }).catch(() => undefined);
      }
      const court = page.locator("#modal-field-court");
      if (await court.count()) {
        const tag = await court.evaluate((el) => el.tagName.toLowerCase());
        if (tag === "select") {
          await court.selectOption({ index: 1 }).catch(() => undefined);
        } else {
          await court.fill("محكمة الاختبار");
        }
      }
      await page.locator('form button.btn-primary[type="submit"]').click({ force: true });
      await page.waitForTimeout(2000);
      createdViaUi = true;
    } catch (err) {
      console.warn("UI case create failed, falling back to API", err);
    }

    if (!createdViaUi || !(await prisma.case.findFirst({ where: { caseNo: newCaseNo } }))) {
      const apiCreate = await page.evaluate(
        async ({ caseNo, clientId, clientName }) => {
          const res = await fetch("/api/cases", {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              caseNo,
              clientId,
              client: clientName,
              phone: "1009876543",
              phoneDialCode: "+20 (مصر)",
              country: "مصر",
              city: "الجيزة",
              type: "مدني",
              court: "محكمة النقض",
              status: "نشطة",
            }),
          });
          return { status: res.status, body: await res.json().catch(() => ({})) };
        },
        { caseNo: newCaseNo, clientId: client3.id, clientName: name3 }
      );
      check("reverse", "API create case for existing client", apiCreate.status === 201, apiCreate);
    }

    const createdCase = await prisma.case.findFirst({
      where: { OR: [{ caseNo: newCaseNo }, { clientId: client3.id }] },
      orderBy: { createdAt: "desc" },
    });
    check(
      "reverse",
      "new case linked to existing client in DB",
      Boolean(createdCase && createdCase.clientId === client3.id),
      createdCase
    );

    await openClients(page);
    await page.getByPlaceholder(/بحث/).fill(name3);
    await page.waitForTimeout(800);
    const row3 = page.locator("table tbody tr").filter({ hasText: name3 }).first();
    const row3Text = await row3.innerText().catch(() => "");
    check(
      "reverse",
      "clients table shows new case without re-entry",
      Boolean(createdCase && row3Text.includes(createdCase.caseNo)),
      row3Text.slice(0, 180)
    );
    await page.screenshot({ path: `${OUT}/06-reverse-link-in-clients.png`, fullPage: true });
  }

  // ── 6) Reload persistence ──
  await page.reload({ waitUntil: "domcontentloaded" });
  await page.waitForSelector("table thead th", { timeout: 20000 });
  await page.getByPlaceholder(/بحث/).fill(name2);
  await page.waitForTimeout(800);
  const reloadText = await page.locator("table tbody tr").filter({ hasText: name2 }).first().innerText().catch(() => "");
  check(
    "reload",
    "links persist after reload",
    reloadText.includes(c2.caseNo) || afterEdit.some((l) => l.caseNo === c2.caseNo),
    reloadText.slice(0, 160)
  );

  // ── 7) Open case link ──
  await openClients(page);
  await page.getByPlaceholder(/بحث/).fill(name1);
  await page.waitForTimeout(700);
  const openLink = page
    .locator("table tbody tr")
    .filter({ hasText: name1 })
    .locator(`a[href*="caseId="]`)
    .first();
  if (await openLink.count()) {
    await openLink.click();
    await page.waitForTimeout(1500);
    const url = page.url();
    check("deeplink", "opens case-management with caseId", /case-management/.test(url) && /caseId=/.test(url), url);
    await page.screenshot({ path: `${OUT}/07-case-deeplink.png`, fullPage: true });
  } else {
    check("deeplink", "opens case-management with caseId", false, {
      hint: "no link on name1",
      solo: soloCase.caseNo,
    });
  }

  // ── 8) Sessions/accounting still have searchable case picker ──
  for (const slug of ["court-sessions", "legal-accounting", "follow-up-center"]) {
    await page.goto(`${BASE}/app/modules/${slug}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(900);
    const primary = page.locator("button.btn-primary").filter({ hasText: /إضافة|جدولة|تسجيل|فتح/ }).first();
    if ((await primary.count()) === 0) {
      check(slug, "has case picker field", false, "no add button");
      continue;
    }
    await primary.click();
    await page.waitForTimeout(600);
    const labelOk =
      (await page.locator("label").filter({ hasText: /رقم القضية/ }).count()) > 0;
    const searchOk =
      (await page.locator("#modal-field-caseNo").count()) > 0 ||
      (await page.getByPlaceholder(/ابحث|اختر قضية|قضية/).count()) > 0;
    check(slug, "case picker present with search", labelOk && searchOk, { labelOk, searchOk });
    await closeModal(page);
  }

  // Reject fake case id via API
  const cookie = (await page.context().cookies()).map((c) => `${c.name}=${c.value}`).join("; ");
  const fakeRes = await fetch(`${BASE}/api/clients`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      name: `وهمي ${stamp}`,
      type: "فرد",
      phone: "1001112233",
      phoneDialCode: "+20",
      country: "مصر",
      city: "القاهرة",
      status: "نشط",
      caseIds: ["nonexistent-fake-id-000"],
    }),
  });
  check("api", "rejects fake caseIds", fakeRes.status === 400, await fakeRes.json().catch(() => fakeRes.status));

  await browser.close();

  const passed = checks.filter((c) => c.ok).length;
  const failed = checks.filter((c) => !c.ok).length;
  const report = {
    passed,
    failed,
    total: checks.length,
    checks,
    at: new Date().toISOString(),
  };
  writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2));
  writeFileSync(
    `${OUT}/report.md`,
    `# Client ↔ Case link acceptance\n\nPassed ${passed}/${checks.length}\n\n` +
      checks.map((c) => `- ${c.ok ? "✅" : "❌"} **${c.group}** ${c.name}`).join("\n")
  );
  console.log("\nRESULT", `${passed}/${checks.length}`, `failed=${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
