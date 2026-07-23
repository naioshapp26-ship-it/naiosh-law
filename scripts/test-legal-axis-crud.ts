/**
 * Verify custom legal axis create / update / delete / hide helpers.
 * Run: npx tsx scripts/test-legal-axis-crud.ts
 */

import {
  appendCustomLegalAxis,
  applyAxisOverride,
  createCustomLegalAxis,
  hideAxis,
  isAxisHidden,
  loadAxisOverrides,
  loadCustomLegalAxes,
  loadHiddenAxisSlugs,
  removeCustomLegalAxis,
  saveAxisOverrides,
  saveCustomLegalAxes,
  saveHiddenAxisSlugs,
  updateCustomLegalAxis,
  upsertAxisOverride,
} from "../src/lib/custom-legal-axes";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// Minimal localStorage polyfill for Node
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

saveCustomLegalAxes([]);
saveAxisOverrides({});
saveHiddenAxisSlugs([]);

const created = createCustomLegalAxis(
  {
    title: "محور اختبار",
    subtitle: "المحور التجريبي",
    icon: "⚖️",
    color: "#c3152a",
    description: "وصف للاختبار",
  },
  "both"
);
assert(created.slug.startsWith("custom-"), "custom slug expected");
appendCustomLegalAxis(created);
assert(loadCustomLegalAxes().length === 1, "expected 1 custom axis after append");

const updated = updateCustomLegalAxis(created.slug, {
  title: "محور معدل",
  subtitle: "عنوان فرعي معدل",
  icon: "🌐",
  color: "#0ea5e9",
  description: "وصف معدل",
});
assert(updated[0]?.title === "محور معدل", "title should update");
assert(updated[0]?.color === "#0ea5e9", "color should update");

const remaining = removeCustomLegalAxis(created.slug);
assert(remaining.length === 0, "custom axis should be removed");

upsertAxisOverride("intl-cross-border", {
  title: "محور دولي معدل",
  subtitle: "تعديل",
  icon: "🌐",
  color: "#111111",
  description: "وصف معدل للمحور الثابت",
});
const overrides = loadAxisOverrides();
assert(overrides["intl-cross-border"]?.title === "محور دولي معدل", "builtin override missing");

const presented = applyAxisOverride({
  slug: "intl-cross-border",
  title: "أصلي",
  subtitle: "فرعي",
  icon: "📚",
  color: "#000",
  description: "وصف",
});
assert(presented.title === "محور دولي معدل", "applyAxisOverride failed");

hideAxis("intl-cross-border");
assert(isAxisHidden("intl-cross-border"), "axis should be hidden");
assert(loadHiddenAxisSlugs().includes("intl-cross-border"), "hidden list missing slug");

console.log("✅ legal axis CRUD helpers verified");
