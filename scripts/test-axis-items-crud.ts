/**
 * Verify axis-item CRUD helpers and that every AxisHub-style page
 * is covered by the shared AxisHubPage component.
 * Run: npx tsx scripts/test-axis-items-crud.ts
 */
import { readFileSync } from "fs";
import { join } from "path";
import { imperialAxes } from "../src/data/empire-structure";
import {
  appendCustomAxisItem,
  applyAxisItemOverride,
  createCustomAxisItem,
  hideAxisItem,
  isAxisItemHidden,
  itemStorageKey,
  loadAxisItemOverrides,
  loadCustomAxisItems,
  loadHiddenAxisItemKeys,
  removeCustomAxisItem,
  saveAxisItemOverrides,
  saveCustomAxisItems,
  saveHiddenAxisItemKeys,
  updateCustomAxisItem,
  upsertAxisItemOverride,
} from "../src/lib/custom-axis-items";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const mem = new Map<string, string>();
(globalThis as { window?: unknown }).window = {
  localStorage: {
    getItem: (k: string) => (mem.has(k) ? mem.get(k)! : null),
    setItem: (k: string, v: string) => {
      mem.set(k, v);
    },
    removeItem: (k: string) => {
      mem.delete(k);
    },
  },
};

saveCustomAxisItems([]);
saveAxisItemOverrides({});
saveHiddenAxisItemKeys([]);

const axisSlug = "legal-library";
const created = createCustomAxisItem(axisSlug, {
  label: "عنصر اختبار",
  href: "/app/archive",
  description: "وصف",
});
assert(created.axisSlug === axisSlug, "axisSlug mismatch");
appendCustomAxisItem(created);
assert(loadCustomAxisItems(axisSlug).length === 1, "expected 1 custom item");

const updated = updateCustomAxisItem(axisSlug, created.id, {
  label: "عنصر معدل",
  href: "/app/dashboard",
  description: "وصف معدل",
});
assert(updated[0]?.label === "عنصر معدل", "label should update");
assert(updated[0]?.href === "/app/dashboard", "href should update");

assert(removeCustomAxisItem(axisSlug, created.id).length === 0, "custom item should be removed");

upsertAxisItemOverride(axisSlug, "legal-lib", {
  label: "المكتبة القانونية المعدلة",
  description: "وصف معدل",
});
assert(
  loadAxisItemOverrides()[itemStorageKey(axisSlug, "legal-lib")]?.label === "المكتبة القانونية المعدلة",
  "builtin override missing"
);

const presented = applyAxisItemOverride(axisSlug, {
  id: "legal-lib",
  label: "أصلي",
  description: "قديم",
});
assert(presented.label === "المكتبة القانونية المعدلة", "apply override failed");

hideAxisItem(axisSlug, "legal-lib");
assert(isAxisItemHidden(axisSlug, "legal-lib"), "item should be hidden");
assert(loadHiddenAxisItemKeys().includes(itemStorageKey(axisSlug, "legal-lib")), "hidden key missing");

// All /app/axis/* hubs share AxisHubPage
const axisRoute = readFileSync(join(process.cwd(), "src/app/app/axis/[slug]/page.tsx"), "utf8");
assert(axisRoute.includes("AxisHubPage"), "axis route must render AxisHubPage");

const hub = readFileSync(join(process.cwd(), "src/components/axis-hub.tsx"), "utf8");
assert(hub.includes("RowActions"), "AxisHub must use unified RowActions");
assert(hub.includes("onEdit"), "AxisHub must wire edit");
assert(hub.includes("onDelete"), "AxisHub must wire delete");
assert(hub.includes("تعديل عنصر"), "edit modal title missing");
assert(hub.includes("تأكيد حذف العنصر"), "delete confirm missing");
assert(hub.includes("AddAxisItemButton"), "add buttons should be unified");

const axisPages = imperialAxes.filter((a) => a.href.startsWith("/app/axis/"));
assert(axisPages.length >= 8, `expected >= 8 axis hub pages, got ${axisPages.length}`);

const requiredSlugs = [
  "legal-library",
  "sovereign",
  "professional-network",
  "advanced-finance",
  "governance",
  "legal-services",
  "integrations",
  "global-operations",
];
for (const slug of requiredSlugs) {
  assert(
    axisPages.some((a) => a.slug === slug),
    `missing axis hub page for ${slug}`
  );
}

console.log("✅ axis item CRUD + AxisHub coverage verified");
console.log(`   axis hub pages: ${axisPages.map((a) => a.slug).join(" · ")}`);
