/**
 * Exhaustive mine of NAIOSH LAW internal/operational page URLs.
 * Run: npx tsx scripts/mine-internal-urls.ts
 */
import { writeFileSync } from "node:fs";
import { imperialAxes, type NavItem } from "@/data/empire-structure";
import { modules, moduleMap } from "@/data/modules";
import { moduleConfigs } from "@/data/module-configs";
import { LANDING_SPECIALTIES } from "@/data/landing-specialties";
import {
  internationalLawAxes,
  topicBySlug,
  topicPageHref,
} from "@/data/international-laws-structure";
import {
  ERP_SIDEBAR_MODULES,
  erpModuleHref,
} from "@/data/erp-sidebar-modules";
import { ERP_PAGE_CATALOG } from "@/data/erp-page-catalog";
import { PAGE_SETTINGS_REGISTRY } from "@/lib/page-settings/registry";
import { PRIMARY_NAV, resolveItemHref } from "@/lib/empire-routes";

type Family =
  | "first-class"
  | "module"
  | "axis"
  | "axis-item"
  | "erp"
  | "specialty"
  | "intl-laws"
  | "page-settings"
  | "portal"
  | "other";

type Entry = {
  path: string;
  label: string;
  family: Family;
  dynamic?: boolean;
  source?: string;
};

const FAMILY_RANK: Record<Family, number> = {
  first_class: 0 as never,
  "first-class": 10,
  module: 20,
  axis: 30,
  "axis-item": 40,
  erp: 50,
  specialty: 60,
  "intl-laws": 70,
  "page-settings": 80,
  portal: 90,
  other: 100,
};

const byPath = new Map<string, Entry>();

function stripHashQuery(path: string): string {
  return path.split("#")[0].split("?")[0];
}

function add(entry: Entry) {
  const path = stripHashQuery(entry.path);
  if (!path.startsWith("/")) return;
  // Scope filter: internal/operational only
  const ok =
    path === "/app" ||
    path.startsWith("/app/") ||
    path === "/portal" ||
    path.startsWith("/portal/") ||
    path === "/data-analysis" ||
    path.startsWith("/data-analysis/");
  if (!ok) return;

  const next: Entry = { ...entry, path };
  const prev = byPath.get(path);
  if (!prev) {
    byPath.set(path, next);
    return;
  }
  // Prefer more specific/native family; keep richer label
  if (FAMILY_RANK[next.family] < FAMILY_RANK[prev.family]) {
    byPath.set(path, {
      ...next,
      label: next.label || prev.label,
      source: [prev.source, next.source].filter(Boolean).join(" | "),
    });
  } else {
    byPath.set(path, {
      ...prev,
      label: prev.label || next.label,
      source: [prev.source, next.source].filter(Boolean).join(" | "),
      dynamic: prev.dynamic || next.dynamic,
    });
  }
}

// ── Dynamic route templates (documented, not counted as concrete) ──
const DYNAMIC_TEMPLATES: Entry[] = [
  { path: "/app/modules/[slug]", label: "Module shell", family: "module", dynamic: true, source: "page.tsx" },
  { path: "/app/axis/[slug]", label: "Imperial axis hub", family: "axis", dynamic: true, source: "page.tsx" },
  { path: "/app/axis/item/[id]", label: "Axis item detail", family: "axis-item", dynamic: true, source: "page.tsx" },
  { path: "/app/erp/[moduleId]", label: "ERP module", family: "erp", dynamic: true, source: "page.tsx" },
  { path: "/app/erp/[moduleId]/[itemId]", label: "ERP nested item", family: "erp", dynamic: true, source: "page.tsx" },
  { path: "/app/specialty/[slug]", label: "Specialty workspace", family: "specialty", dynamic: true, source: "page.tsx" },
  { path: "/app/page-settings/[pageKey]", label: "Page settings editor", family: "page-settings", dynamic: true, source: "page.tsx" },
  { path: "/app/international-laws/[axisSlug]", label: "Intl-laws axis", family: "intl-laws", dynamic: true, source: "page.tsx" },
  { path: "/app/international-laws/topic/[topicSlug]", label: "Intl-laws topic", family: "intl-laws", dynamic: true, source: "page.tsx" },
];

// ── First-class /app pages (static page.tsx) ──
const FIRST_CLASS: Entry[] = [
  { path: "/app", label: "App entry (→ /app/dashboard)", family: "first-class", source: "page.tsx redirect" },
  { path: "/app/dashboard", label: "لوحة التحكم", family: "first-class", source: "page.tsx + PRIMARY_NAV" },
  { path: "/app/client-messages", label: "رسائل العملاء", family: "first-class", source: "page.tsx + PRIMARY_NAV" },
  { path: "/app/communications", label: "الاتصالات والفروع", family: "first-class", source: "page.tsx" },
  { path: "/app/legal-finance", label: "المالية القانونية (لوحة)", family: "first-class", source: "page.tsx + PRIMARY_NAV" },
  { path: "/app/legal-library", label: "المكتبة القانونية", family: "first-class", source: "page.tsx + PRIMARY_NAV" },
  { path: "/app/legal-knowledge", label: "الفروع والتخصصات", family: "first-class", source: "page.tsx" },
  { path: "/app/archive", label: "الأرشيف والمستندات", family: "first-class", source: "page.tsx + PRIMARY_NAV" },
  { path: "/app/governance", label: "الحوكمة والتوقيع", family: "first-class", source: "page.tsx" },
  { path: "/app/global-operations", label: "العمليات العالمية", family: "first-class", source: "page.tsx" },
  { path: "/app/official-entities", label: "الجهات الرسمية", family: "first-class", source: "page.tsx" },
  { path: "/app/professional-network", label: "المحامون والشبكة المهنية", family: "first-class", source: "page.tsx" },
  { path: "/app/system-settings", label: "إعدادات النظام", family: "first-class", source: "page.tsx + AppShell ADMIN_NAV" },
  { path: "/app/page-settings", label: "إعدادات الصفحات", family: "page-settings", source: "page.tsx + AppShell" },
  { path: "/app/international-laws", label: "التصنيف القانوني الدولي والمحلي", family: "intl-laws", source: "page.tsx" },
  { path: "/app/data-analysis", label: "تحليل البيانات (داخل /app)", family: "first-class", source: "page.tsx" },
  { path: "/app/data-analysis/workspace", label: "مساحة تحليل البيانات (/app)", family: "first-class", source: "page.tsx" },
];

for (const e of FIRST_CLASS) add(e);

// PRIMARY_NAV extras
for (const n of PRIMARY_NAV) {
  add({ path: n.href, label: n.label, family: n.href.includes("/modules/") ? "module" : "first-class", source: "PRIMARY_NAV" });
}

// Data-analysis workspace (allowed outside /app)
add({ path: "/data-analysis", label: "تحليل البيانات (عام)", family: "other", source: "page.tsx" });
add({ path: "/data-analysis/workspace", label: "مساحة تحليل البيانات", family: "other", source: "page.tsx" });

// ── Modules ──
const moduleSlugs = new Set<string>([
  ...modules.map((m) => m.slug),
  ...moduleConfigs.map((c) => c.slug),
  ...Object.keys(moduleMap),
]);
for (const slug of moduleSlugs) {
  const title = moduleMap[slug]?.title || slug;
  add({
    path: `/app/modules/${slug}`,
    label: title,
    family: "module",
    source: moduleConfigs.some((c) => c.slug === slug)
      ? "module-configs+moduleMap"
      : "moduleMap-only",
  });
}

// ── Specialties ──
for (const sp of LANDING_SPECIALTIES) {
  add({
    path: `/app/specialty/${sp.slug}`,
    label: sp.title || sp.label,
    family: "specialty",
    source: "landing-specialties",
  });
}

// ── Imperial axes ──
for (const axis of imperialAxes) {
  add({
    path: `/app/axis/${axis.slug}`,
    label: axis.title,
    family: "axis",
    source: "empire-structure",
  });
  // Also record canonical href if different (e.g. legal-classification → international-laws)
  if (axis.href && axis.href !== `/app/axis/${axis.slug}`) {
    add({
      path: axis.href,
      label: axis.title,
      family: axis.href.includes("international-laws") ? "intl-laws" : "axis",
      source: "empire-structure axis.href",
    });
  }

  const flat: NavItem[] = [
    ...(axis.items ?? []),
    ...(axis.dropdowns?.flatMap((d) => d.items) ?? []),
  ];
  for (const item of flat) {
    // Axis-item landing page always exists
    add({
      path: `/app/axis/item/${item.id}`,
      label: item.label,
      family: "axis-item",
      source: `empire-structure:${axis.slug}`,
    });
    // Resolved operational target
    const resolved = resolveItemHref(item);
    const family: Family = resolved.startsWith("/app/modules/")
      ? "module"
      : resolved.startsWith("/app/international-laws")
        ? "intl-laws"
        : resolved.startsWith("/app/axis/item/")
          ? "axis-item"
          : resolved.startsWith("/app/axis/")
            ? "axis"
            : resolved.startsWith("/app/")
              ? "first-class"
              : "other";
    add({
      path: resolved,
      label: item.label,
      family,
      source: `resolveItemHref:${axis.slug}/${item.id}`,
    });
  }
}

// ── International laws axes + topics ──
for (const axis of internationalLawAxes) {
  add({
    path: `/app/international-laws/${axis.slug}`,
    label: axis.title,
    family: "intl-laws",
    source: "international-laws-structure axis",
  });
  for (const topic of axis.topics) {
    add({
      path: topicPageHref(topic.slug),
      label: topic.name,
      family: "intl-laws",
      source: `international-laws-structure topic:${axis.slug}`,
    });
  }
}
// Ensure every topicBySlug is covered
for (const [slug, t] of Object.entries(topicBySlug)) {
  add({
    path: topicPageHref(slug),
    label: t.name,
    family: "intl-laws",
    source: "topicBySlug",
  });
}

// ── ERP catalog (every moduleId → /app/erp/{id}) ──
for (const [id, cfg] of Object.entries(ERP_PAGE_CATALOG)) {
  add({
    path: `/app/erp/${id}`,
    label: cfg.title,
    family: "erp",
    source: "erp-page-catalog",
  });
}

// ── ERP sidebar navigable hrefs (nested parent/child) ──
for (const mod of ERP_SIDEBAR_MODULES) {
  add({
    path: erpModuleHref(mod.id),
    label: mod.label,
    family: "erp",
    source: "erp-sidebar-modules",
  });
  for (const sub of mod.subItems ?? []) {
    add({
      path: erpModuleHref(sub.id),
      label: `${mod.label} ← ${sub.label}`,
      family: "erp",
      source: "erp-sidebar-modules subItem",
    });
  }
}

// ── Page settings hub + every registry pageKey ──
add({
  path: "/app/page-settings",
  label: "إعدادات الصفحات",
  family: "page-settings",
  source: "page-settings hub",
});
for (const def of PAGE_SETTINGS_REGISTRY) {
  add({
    path: `/app/page-settings/${def.pageKey}`,
    label: def.title,
    family: "page-settings",
    source: "PAGE_SETTINGS_REGISTRY",
  });
}

// ── Portal pages ──
const PORTAL: Entry[] = [
  { path: "/portal", label: "بوابة العميل — الرئيسية", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/profile", label: "ملفي الشخصي", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/cases", label: "قضاياي", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/sessions", label: "جلساتي", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/documents", label: "مستنداتي", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/requests", label: "طلباتي", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/finance", label: "المالية", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/messages", label: "الرسائل", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/notifications", label: "الإشعارات", family: "portal", source: "page.tsx + portal-shell" },
  { path: "/portal/settings", label: "الإعدادات", family: "portal", source: "page.tsx + portal-shell" },
];
for (const e of PORTAL) add(e);

// ── Assemble ──
const concrete = Array.from(byPath.values()).sort((a, b) =>
  a.path.localeCompare(b.path)
);

const byFamily: Record<string, number> = {};
for (const e of concrete) {
  byFamily[e.family] = (byFamily[e.family] || 0) + 1;
}

const meta = {
  generatedAt: new Date().toISOString(),
  totalConcrete: concrete.length,
  byFamily,
  dynamicTemplates: DYNAMIC_TEMPLATES,
  sourceCounts: {
    modules_moduleMap: modules.length,
    modules_moduleConfigs: moduleConfigs.length,
    moduleSlugsUnion: moduleSlugs.size,
    imperialAxes: imperialAxes.length,
    empireItems: imperialAxes.reduce((n, a) => {
      return n + (a.items?.length ?? 0) + (a.dropdowns?.reduce((m, d) => m + d.items.length, 0) ?? 0);
    }, 0),
    specialties: LANDING_SPECIALTIES.length,
    intlLawAxes: internationalLawAxes.length,
    intlLawTopics: Object.keys(topicBySlug).length,
    erpCatalog: Object.keys(ERP_PAGE_CATALOG).length,
    erpSidebarTop: ERP_SIDEBAR_MODULES.length,
    erpSidebarFlat: ERP_SIDEBAR_MODULES.reduce(
      (n, m) => n + 1 + (m.subItems?.length ?? 0),
      0
    ),
    pageSettingsRegistry: PAGE_SETTINGS_REGISTRY.length,
    portalPages: PORTAL.length,
    firstClassStatic: FIRST_CLASS.length,
  },
  notes: [
    "Concrete paths are deduplicated by path (hash/query stripped).",
    "Dynamic templates list route patterns; concrete expansions use known slugs/ids from data files.",
    "/app/erp/{catalogId} includes every erp-page-catalog key; nested sidebar children also appear as /app/erp/{parent}/{child} via erpModuleHref (preferred navigable URL).",
    "Axis items always include /app/axis/item/{id}; resolved operational targets are also listed under their native family.",
    "page-settings includes hub + every PAGE_SETTINGS_REGISTRY pageKey (operational + ERP planned + public-homepage).",
    "Excluded: public marketing routes (/, /services, /branches, /login, /register, /newhome, /my-page, etc.) except /data-analysis workspace.",
    "moduleMap includes slug 'dashboard' which is not in module-configs; both are listed.",
  ],
};

const out = { meta, pages: concrete.map(({ path, label, family }) => ({ path, label, family })) };
writeFileSync(
  "docs/internal-operational-urls.json",
  JSON.stringify(out, null, 2),
  "utf8"
);

// Also write a flat array-only file as requested
writeFileSync(
  "docs/internal-operational-urls.array.json",
  JSON.stringify(out.pages, null, 2),
  "utf8"
);

console.log(JSON.stringify(meta, null, 2));
console.log(`\nWrote ${concrete.length} concrete paths → docs/internal-operational-urls.json`);
