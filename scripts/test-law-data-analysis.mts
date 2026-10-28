/**
 * Real flow: auth → datasets → analyze cases CSV via engine → upload validation.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";
import {
  anParseCSV,
  anTable,
  anDefaults,
  anRun,
  AN_TYPES,
} from "../src/lib/data-analysis/engine.ts";

const BASE = process.env.BASE_URL || "http://127.0.0.1:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/law-data-analysis";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };
const CLIENT = { email: "client@naioshlaw.com", password: "Client@123" };

fs.mkdirSync(OUT, { recursive: true });

async function loginApi(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, remember: true }),
  });
  const setCookie = res.headers.getSetCookie?.() ?? [];
  const cookie = setCookie.map((c) => c.split(";")[0]).join("; ");
  if (!res.ok) throw new Error(`login ${email} ${res.status}`);
  return cookie;
}

async function main() {
  // Copy Hub reference as "before/original"
  const hubShot =
    "/home/ubuntu/.cursor/projects/workspace/assets/e5788af8-7ddc-4fe7-bdc7-d7188871d599.png";
  if (fs.existsSync(hubShot)) {
    fs.copyFileSync(hubShot, path.join(OUT, "00-hub-original-reference.png"));
  }

  const cookie = await loginApi(ADMIN.email, ADMIN.password);
  const list = await fetch(`${BASE}/api/data-analysis/datasets`, {
    headers: { cookie },
  });
  const listBody = await list.json();
  if (!list.ok) throw new Error(JSON.stringify(listBody));
  console.log("DATASETS", listBody.datasets?.map((d: { key: string }) => d.key));

  const cases = await fetch(`${BASE}/api/data-analysis/datasets?key=cases`, {
    headers: { cookie },
  });
  const casesBody = await cases.json();
  if (!cases.ok) throw new Error(JSON.stringify(casesBody));
  console.log("CASES_COUNT", casesBody.count);

  const rows = anParseCSV(casesBody.csv);
  const T = anTable(rows);
  const cfg = { ...anDefaults(T), types: AN_TYPES.map((t: [string, string]) => t[0]), focus: "all" };
  const { out } = anRun(T, cfg);
  console.log("ENGINE_TYPES", Object.keys(out));

  // Upload validation — reject exe
  const bad = new FormData();
  bad.append("file", new Blob(["MZ"], { type: "application/octet-stream" }), "malware.exe");
  const badRes = await fetch(`${BASE}/api/data-analysis/upload`, {
    method: "POST",
    headers: { cookie },
    body: bad,
  });
  console.log("REJECT_EXE", badRes.status);

  // Upload CSV OK
  const good = new FormData();
  good.append(
    "file",
    new Blob([casesBody.csv], { type: "text/csv" }),
    "cases-export.csv"
  );
  const goodRes = await fetch(`${BASE}/api/data-analysis/upload`, {
    method: "POST",
    headers: { cookie },
    body: good,
  });
  const goodBody = await goodRes.json();
  console.log("UPLOAD_OK", goodRes.status, goodBody.upload?.sha256?.slice(0, 12));

  // Clients are blocked from staff /api/* (middleware → portal only). Analysis lives in /app.
  const clientCookie = await loginApi(CLIENT.email, CLIENT.password);
  const clientList = await fetch(`${BASE}/api/data-analysis/datasets`, {
    headers: { cookie: clientCookie },
  });
  const clientBody = await clientList.json().catch(() => ({}));
  console.log("CLIENT_BLOCKED", clientList.status, clientBody.error ?? "");

  // Browser screenshots
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.fill('input[type="email"], input[name="email"]', ADMIN.email);
  await page.fill('input[type="password"], input[name="password"]', ADMIN.password);
  await Promise.all([
    page.waitForURL(/\/app\//, { timeout: 30000 }).catch(() => null),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(800);

  // Sidebar entry
  const nav = page.getByRole("link", { name: /نايوش لتحليل البيانات/ }).first();
  await nav.click();
  await page.waitForURL(/data-analysis/, { timeout: 15000 });
  await page.waitForTimeout(900);
  await page.screenshot({ path: path.join(OUT, "01-law-landing.png"), fullPage: false });

  await page.getByRole("link", { name: /ابدأ التحليل|الدخول إلى أدوات التحليل/ }).first().click();
  await page.waitForURL(/workspace/, { timeout: 15000 });
  await page.waitForTimeout(700);
  await page.getByRole("button", { name: /تنفيذ التحليل/ }).click();
  await page.waitForSelector(".da-ws-block", { timeout: 30000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, "02-law-workspace-results.png"), fullPage: false });

  await page.getByRole("button", { name: /تصدير التقرير/ }).click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(OUT, "03-law-after-export.png"), fullPage: false });

  await browser.close();

  const summary = {
    ok:
      list.ok &&
      cases.ok &&
      casesBody.count > 0 &&
      Object.keys(out).length >= 5 &&
      badRes.status === 400 &&
      goodRes.status === 200 &&
      clientList.status === 403,
    casesCount: casesBody.count,
    engineTypes: Object.keys(out),
    rejectExe: badRes.status,
    uploadOk: goodRes.status,
    clientBlockedFromStaffApi: clientList.status,
  };
  fs.writeFileSync(path.join(OUT, "summary.json"), JSON.stringify(summary, null, 2));
  console.log(JSON.stringify(summary, null, 2));
  if (!summary.ok) process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
