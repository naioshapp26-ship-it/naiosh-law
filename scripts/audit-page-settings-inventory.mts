/**
 * Automated inventory: sidebar DOM ↔ live page titles ↔ page-settings catalog.
 * Classifies NAIOSH real vs ERP catalog vs specialty.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import path from "node:path";

const BASE = process.env.BASE_URL || "http://localhost:3000";
const OUT = process.env.E2E_OUT || "/opt/cursor/artifacts/page-settings-final-audit";
const ADMIN = { email: "admin@naioshlaw.com", password: "Admin@123" };

type SideLink = { label: string; href: string };
type CatalogPage = {
  pageKey: string;
  title: string;
  status: string;
  pageHref: string;
  settingsHref?: string;
  gapReason?: string | null;
};

function norm(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

function classifyHref(href: string) {
  if (href.startsWith("/app/erp/") || href.includes("/erp/")) return "erp";
  if (href.startsWith("/app/specialty/") || href.includes("/specialty/")) return "specialty";
  if (href.startsWith("/app/axis/")) return "axis";
  if (href.startsWith("/portal")) return "portal";
  if (href.startsWith("/app/page-settings")) return "settings-meta";
  return "naiosh";
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({
    headless: true,
    channel: "chrome",
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const ctx = await browser.newContext({ locale: "ar", viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  const login = await ctx.request.post(`${BASE}/api/auth/login`, {
    data: { ...ADMIN, remember: true },
  });
  if (!login.ok()) throw new Error(`login ${login.status()}`);

  await page.goto(`${BASE}/app/dashboard`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);

  // Expand ERP accordion buttons so sub-links appear
  const toggles = page.locator("#app-sidebar button[aria-expanded]");
  const tCount = await toggles.count();
  for (let i = 0; i < tCount; i++) {
    const btn = toggles.nth(i);
    const expanded = await btn.getAttribute("aria-expanded");
    if (expanded !== "true") {
      await btn.click().catch(() => null);
      await page.waitForTimeout(80);
    }
  }
  await page.waitForTimeout(400);

  const sidebarLinks: SideLink[] = await page.evaluate(() => {
    const root = document.querySelector("#app-sidebar") || document.body;
    const anchors = Array.from(root.querySelectorAll("a[href]")) as HTMLAnchorElement[];
    return anchors
      .map((a) => ({
        label: (a.getAttribute("title") || a.textContent || "").replace(/\s+/g, " ").trim(),
        href: a.getAttribute("href") || "",
      }))
      .filter((x) => x.href.startsWith("/") && !x.href.startsWith("/login"));
  });

  // Dedupe by href keeping first label
  const byHref = new Map<string, SideLink>();
  for (const l of sidebarLinks) {
    if (!byHref.has(l.href)) byHref.set(l.href, l);
  }
  const uniqueSidebar = Array.from(byHref.values());

  const catalogRes = await ctx.request.get(`${BASE}/api/page-settings`);
  const catalogJson = await catalogRes.json();
  const catalog: CatalogPage[] = catalogJson.pages || [];
  const catalogByHref = new Map(catalog.map((p) => [p.pageHref, p]));
  const catalogByKey = new Map(catalog.map((p) => [p.pageKey, p]));

  // Known real NAIOSH routes beyond sidebar (portal, specialty, modules hub pages)
  const EXTRA_REAL = [
    { label: "بوابة العميل", href: "/portal" },
    { label: "رسائل العملاء", href: "/app/client-messages" },
    { label: "التصنيف القانوني", href: "/app/legal-knowledge" },
    { label: "الجهات الرسمية", href: "/app/official-entities" },
    { label: "الإشعارات والتكاملات", href: "/app/communications" },
    { label: "الحوكمة والتوقيع", href: "/app/governance" },
    { label: "العمليات العالمية", href: "/app/global-operations" },
    { label: "المكتبة القانونية", href: "/app/legal-library" },
    { label: "الشبكة المهنية", href: "/app/professional-network" },
    { label: "المالية القانونية", href: "/app/legal-finance" },
    { label: "الأرشيف", href: "/app/archive" },
    { label: "إعدادات النظام", href: "/app/system-settings" },
    { label: "إعدادات الصفحات", href: "/app/page-settings" },
  ];

  const allCandidates = [...uniqueSidebar];
  for (const e of EXTRA_REAL) {
    if (!byHref.has(e.href)) {
      allCandidates.push(e);
      byHref.set(e.href, e);
    }
  }

  // Specialty slugs
  const specialtySlugs = [
    "cases",
    "clients",
    "sessions",
    "library",
    "systems",
    "finance",
    "archive",
    "profile",
    "team",
  ];
  for (const slug of specialtySlugs) {
    const href = `/app/specialty/${slug}`;
    if (!byHref.has(href)) {
      allCandidates.push({ label: `مساحة التخصص: ${slug}`, href });
    }
  }

  // ModuleShell routes from catalog operational/partial with /app/modules/
  for (const p of catalog) {
    if (
      (p.status === "operational" || p.status === "partial") &&
      p.pageHref.startsWith("/app/") &&
      !byHref.has(p.pageHref)
    ) {
      allCandidates.push({ label: p.title, href: p.pageHref });
      byHref.set(p.pageHref, { label: p.title, href: p.pageHref });
    }
  }

  type Row = {
    sidebarLabel: string;
    href: string;
    class: string;
    liveTitle: string | null;
    liveOk: boolean;
    settingsMatch: CatalogPage | null;
    settingsTitle: string | null;
    settingsHref: string | null;
    nameAligned: boolean | null;
    notes: string;
  };

  const rows: Row[] = [];

  for (const link of allCandidates) {
    const cls = classifyHref(link.href);
    let liveTitle: string | null = null;
    let liveOk = false;
    let notes = "";

    // Skip meta settings hub itself for live title deep scrape of settings pages
    if (cls === "erp") {
      const match =
        catalogByHref.get(link.href) ||
        catalog.find((p) => p.pageHref === link.href || p.pageKey.includes(link.href.split("/").pop() || "")) ||
        null;
      rows.push({
        sidebarLabel: link.label,
        href: link.href,
        class: "erp",
        liveTitle: null,
        liveOk: false,
        settingsMatch: match,
        settingsTitle: match?.title ?? null,
        settingsHref: match ? `/app/page-settings/${match.pageKey}` : null,
        nameAligned: null,
        notes: "ERP مفهرس — خارج نطاق إنجاز NAIOSH (لا زيارة حية في هذا الجرد)",
      });
      continue;
    }

    if (link.href === "/app/page-settings" || link.href.startsWith("/app/page-settings/")) {
      rows.push({
        sidebarLabel: link.label,
        href: link.href,
        class: "settings-meta",
        liveTitle: "مركز إعدادات الصفحات",
        liveOk: true,
        settingsMatch: null,
        settingsTitle: null,
        settingsHref: null,
        nameAligned: true,
        notes: "مركز الإعدادات نفسه",
      });
      continue;
    }

    try {
      const res = await page.goto(`${BASE}${link.href}`, {
        waitUntil: "domcontentloaded",
        timeout: 20000,
      });
      await page.waitForTimeout(500);
      liveOk = Boolean(res && res.ok()) || page.url().includes(link.href.split("?")[0]);
      // Prefer h1, then PageHeader-like bold title
      liveTitle = await page.evaluate(() => {
        const h1 = document.querySelector("h1");
        if (h1?.textContent) return h1.textContent.replace(/\s+/g, " ").trim();
        const hdr = document.querySelector(".erp-page h1, [class*='PageHeader'] h1, .erp-page h2");
        if (hdr?.textContent) return hdr.textContent.replace(/\s+/g, " ").trim();
        return document.title || null;
      });
      if (page.url().includes("/login")) {
        liveOk = false;
        notes = "أُعيد التوجيه لتسجيل الدخول";
      }
    } catch (e) {
      liveOk = false;
      notes = e instanceof Error ? e.message : String(e);
    }

    // Match settings: exact href, or /app/modules/X ↔ pageKey X, or catalog title fuzzy
    let match =
      catalogByHref.get(link.href) ||
      null;
    if (!match && link.href.startsWith("/app/modules/")) {
      const key = link.href.replace("/app/modules/", "").split("/")[0];
      match = catalogByKey.get(key) || null;
    }
    if (!match && link.href === "/portal") match = catalogByKey.get("client-portal") || null;
    if (!match && link.href.startsWith("/app/specialty/")) {
      const slug = link.href.split("/").pop()!;
      match = catalogByKey.get(`specialty-${slug}`) || null;
    }
    if (!match && link.href.startsWith("/app/axis/")) {
      // axis pages often map to real feature pages — note gap
      notes = notes || "محور إمبراطوري — قد يحتاج إعدادات مستقلة أو ربط بالصفحة الفعلية";
    }
    // fallback: match by path tail against pageHref
    if (!match) {
      match =
        catalog.find((p) => p.pageHref === link.href || link.href.endsWith(p.pageHref)) || null;
    }

    const settingsTitle = match?.title ?? null;
    const settingsHref = match ? `/app/page-settings/${match.pageKey}` : null;

    let nameAligned: boolean | null = null;
    if (match && liveTitle) {
      const a = norm(liveTitle).replace(/[⚖️👥🏛️💰📌📋📚🌳🔏🌍🎨💬📢⊞]/g, "").trim();
      const b = norm(settingsTitle || "");
      const c = norm(link.label);
      nameAligned =
        a.includes(b) ||
        b.includes(a) ||
        a.includes(c) ||
        b.includes(c) ||
        c.includes(b) ||
        // allow partial token overlap
        b.split(/\s+/).filter((t) => t.length > 2 && a.includes(t)).length >= 1;
    } else if (!match) {
      nameAligned = false;
      notes = notes || "لا يوجد مدخل إعدادات مطابق";
    }

    rows.push({
      sidebarLabel: link.label,
      href: link.href,
      class: cls,
      liveTitle,
      liveOk,
      settingsMatch: match,
      settingsTitle,
      settingsHref,
      nameAligned,
      notes,
    });
  }

  const naiosh = rows.filter((r) => r.class === "naiosh" || r.class === "portal" || r.class === "axis");
  const specialty = rows.filter((r) => r.class === "specialty");
  const erp = rows.filter((r) => r.class === "erp");
  const missingSettings = naiosh.filter((r) => !r.settingsMatch && r.liveOk);
  const nameMismatch = naiosh.filter((r) => r.settingsMatch && r.nameAligned === false);
  const operationalInCatalog = catalog.filter((p) => p.status === "operational");
  const partialInCatalog = catalog.filter((p) => p.status === "partial");
  const plannedNaiosh = catalog.filter(
    (p) => p.status === "planned" && !p.pageKey.startsWith("erp-") && !p.pageKey.startsWith("specialty-")
  );

  const report = {
    generatedAt: new Date().toISOString(),
    sidebarUniqueCount: uniqueSidebar.length,
    totals: {
      scanned: rows.length,
      naioshOrAxisOrPortal: naiosh.length,
      specialty: specialty.length,
      erpIndexed: erp.length,
      missingSettings: missingSettings.length,
      nameMismatch: nameMismatch.length,
      catalogOperational: operationalInCatalog.length,
      catalogPartial: partialInCatalog.length,
      catalogPlannedNaiosh: plannedNaiosh.length,
      catalogErp: catalog.filter((p) => p.pageKey.startsWith("erp-")).length,
      catalogSpecialty: catalog.filter((p) => p.pageKey.startsWith("specialty-")).length,
    },
    missingSettings,
    nameMismatch,
    plannedNaiosh,
    specialty: specialty.map((s) => ({
      href: s.href,
      sidebarLabel: s.sidebarLabel,
      liveTitle: s.liveTitle,
      settingsTitle: s.settingsTitle,
      settingsHref: s.settingsHref,
      status: s.settingsMatch?.status,
      gap: s.settingsMatch?.gapReason,
    })),
    rows,
  };

  fs.writeFileSync(path.join(OUT, "inventory.json"), JSON.stringify(report, null, 2));

  const md = [
    "# جرد إعدادات الصفحات — NAIOSH Law 360",
    "",
    `تاريخ: ${report.generatedAt}`,
    "",
    "## ملخص",
    `- روابط الشريط الجانبي الفريدة: ${uniqueSidebar.length}`,
    `- صفحات NAIOSH/محاور/بوابة مفحوصة: ${naiosh.length}`,
    `- مساحات تخصصية: ${specialty.length}`,
    `- ERP مفهرس (بدون زيارة حية كإنجاز): ${erp.length}`,
    `- بدون إعدادات: ${missingSettings.length}`,
    `- اختلاف أسماء: ${nameMismatch.length}`,
    `- كتالوج تشغيلية: ${operationalInCatalog.length} | جزئية: ${partialInCatalog.length} | مخططة NAIOSH: ${plannedNaiosh.length}`,
    "",
    "## بدون إعدادات (فجوات)",
    ...(missingSettings.length
      ? missingSettings.map((m) => `- **${m.sidebarLabel}** → \`${m.href}\` — عنوان حي: ${m.liveTitle ?? "—"}`)
      : ["- لا يوجد"]),
    "",
    "## اختلاف أسماء",
    ...(nameMismatch.length
      ? nameMismatch.map(
          (m) =>
            `- شريط: «${m.sidebarLabel}» | حي: «${m.liveTitle}» | إعدادات: «${m.settingsTitle}» (\`${m.href}\`)`
        )
      : ["- لا يوجد"]),
    "",
    "## تشغيلية في الكتالوج",
    ...operationalInCatalog.map((p) => `- \`${p.pageKey}\` — ${p.title} → ${p.pageHref}`),
  ].join("\n");
  fs.writeFileSync(path.join(OUT, "INVENTORY.md"), md);
  console.log(md);

  await ctx.close();
  await browser.close();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
