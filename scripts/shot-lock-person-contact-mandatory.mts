/**
 * Evidence: locked phone/country/city in case page settings + table + forms.
 */
import { chromium, type Page } from "playwright";
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT =
  process.env.LOCK_CONTACT_OUT ||
  "/opt/cursor/artifacts/lock-person-contact-mandatory";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };

fs.mkdirSync(OUT, { recursive: true });

async function login(page: Page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[type="email"], input[name="email"]', ADMIN.email);
  await page.fill('input[type="password"], input[name="password"]', ADMIN.password);
  await Promise.all([
    page.waitForURL(/\/app\//, { timeout: 30000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(800);
}

async function shot(page: Page, name: string) {
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  console.log("SHOT", file);
  return file;
}

async function main() {
  // Preserve user-provided before screenshot
  const userBefore =
    "/home/ubuntu/.cursor/projects/workspace/assets/3eba6e1d-963c-445c-8917-67b44d4fff07.png";
  if (fs.existsSync(userBefore)) {
    fs.copyFileSync(userBefore, path.join(OUT, "00-before-settings-user.png"));
    console.log("COPIED before settings");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await login(page);

  // Settings — fields tab
  await page.goto(`${BASE}/app/page-settings/case-management`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForSelector(".psc-tabs", { timeout: 30000 });
  await page.waitForTimeout(800);
  const fieldsTab = page.getByRole("tab", { name: /الحقول والنماذج/ }).first();
  await fieldsTab.click();
  await page.waitForSelector("text=الحقول الإلزامية", { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, "01-after-settings-fields");

  // Assert locked chips present / hide list excludes them
  const bodyText = await page.locator(".psc-panel, .psc-fields, body").first().innerText();
  const lockedChips = await page.locator(".psc-chip.locked-chip").allTextContents();
  console.log("LOCKED_CHIPS", lockedChips);

  // Hostile UI attempt: try clicking locked chips (should stay on)
  for (const label of ["رقم الجوال", "الدولة", "المدينة"]) {
    const chip = page.locator(".psc-chip.locked-chip", { hasText: label }).first();
    if (await chip.count()) {
      await chip.click({ force: true }).catch(() => null);
    }
  }
  await page.waitForTimeout(300);

  // Try save after stripping via API hostile payload
  const cookies = await page.context().cookies();
  const cookieHeader = cookies.map((c) => `${c.name}=${c.value}`).join("; ");
  const hostile = await fetch(`${BASE}/api/page-settings/case-management`, {
    method: "PUT",
    headers: {
      "content-type": "application/json",
      cookie: cookieHeader,
    },
    body: JSON.stringify({
      scope: "global",
      values: {
        fields: {
          requiredFields: ["caseNo", "client", "type", "status"],
          hiddenOptionalFields: ["phone", "country", "city", "court"],
        },
      },
    }),
  });
  const hostileJson = (await hostile.json().catch(() => ({}))) as {
    resolved?: {
      values?: { fields?: { requiredFields?: string[]; hiddenOptionalFields?: string[] } };
    };
    error?: string;
  };
  console.log("HOSTILE_STATUS", hostile.status, hostileJson.error ?? "");
  const req = hostileJson.resolved?.values?.fields?.requiredFields ?? [];
  const hid = hostileJson.resolved?.values?.fields?.hiddenOptionalFields ?? [];
  console.log("AFTER_HOSTILE_REQUIRED", req);
  console.log("AFTER_HOSTILE_HIDDEN", hid);

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForSelector(".psc-tabs", { timeout: 30000 });
  await page.getByRole("tab", { name: /الحقول والنماذج/ }).first().click();
  await page.waitForSelector("text=الحقول الإلزامية", { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, "02-after-settings-reload");

  // Cases table
  await page.goto(`${BASE}/app/modules/case-management`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForTimeout(1500);
  await shot(page, "03-after-cases-table");

  // Add form
  const addBtn = page.getByRole("button", { name: /إضافة قضية/ }).first();
  if (await addBtn.count()) {
    await addBtn.click();
    await page.waitForTimeout(900);
    await shot(page, "04-after-cases-add-form");
    const cancel = page.getByRole("button", { name: /إلغاء|إغلاق|Cancel/ }).first();
    if (await cancel.count()) await cancel.click().catch(() => null);
    await page.keyboard.press("Escape").catch(() => null);
    await page.waitForTimeout(400);
  }

  // Edit first row if possible
  const editBtn = page
    .locator('button[title*="تعديل"], button:has-text("تعديل"), [aria-label*="تعديل"]')
    .first();
  if (await editBtn.count()) {
    await editBtn.click();
    await page.waitForTimeout(900);
    await shot(page, "05-after-cases-edit-form");
    await page.keyboard.press("Escape").catch(() => null);
  } else {
    // Fallback: open row actions
    const more = page.locator("table tbody tr").first().locator("button").last();
    if (await more.count()) {
      await more.click();
      await page.waitForTimeout(400);
      const editItem = page.getByRole("button", { name: /تعديل/ }).first();
      if (await editItem.count()) {
        await editItem.click();
        await page.waitForTimeout(900);
        await shot(page, "05-after-cases-edit-form");
      }
    }
  }

  // Clients settings too (central rule)
  await page.goto(`${BASE}/app/page-settings/clients-management`, {
    waitUntil: "networkidle",
    timeout: 60000,
  });
  await page.waitForSelector(".psc-tabs", { timeout: 30000 });
  await page.getByRole("tab", { name: /الحقول والنماذج/ }).first().click();
  await page.waitForSelector("text=الحقول الإلزامية", { timeout: 15000 });
  await page.waitForTimeout(500);
  await shot(page, "06-after-clients-settings");

  const ok =
    req.includes("phone") &&
    req.includes("country") &&
    req.includes("city") &&
    !hid.includes("phone") &&
    !hid.includes("country") &&
    !hid.includes("city") &&
    lockedChips.some((t) => t.includes("رقم الجوال")) &&
    lockedChips.some((t) => t.includes("الدولة")) &&
    lockedChips.some((t) => t.includes("المدينة"));

  fs.writeFileSync(
    path.join(OUT, "summary.json"),
    JSON.stringify(
      {
        ok,
        lockedChips,
        afterHostileRequired: req,
        afterHostileHidden: hid,
        hostileStatus: hostile.status,
        bodySnippet: bodyText.slice(0, 400),
      },
      null,
      2
    )
  );

  await browser.close();
  if (!ok) {
    console.error("FAIL evidence checks");
    process.exit(1);
  }
  console.log("PASS");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
