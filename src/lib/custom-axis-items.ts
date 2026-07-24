/** Custom items added under imperial axis hubs (e.g. لوحة التحكم السيادية). */

import type { NavItem } from "@/data/empire-structure";
import type { FormField } from "@/data/module-configs";

export type CustomAxisItem = NavItem & {
  axisSlug: string;
  createdAt: string;
};

export type AxisItemOverride = {
  label?: string;
  href?: string;
  moduleSlug?: string;
  description?: string;
  updatedAt?: string;
};

const STORAGE_KEY = "naiosh.custom-axis-items.v1";
const OVERRIDES_KEY = "naiosh.axis-item-overrides.v1";
const HIDDEN_KEY = "naiosh.axis-item-hidden.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

export function itemStorageKey(axisSlug: string, itemId: string) {
  return `${axisSlug}::${itemId}`;
}

export function loadCustomAxisItems(axisSlug?: string): CustomAxisItem[] {
  const parsed = readJson<CustomAxisItem[]>(STORAGE_KEY, []);
  if (!Array.isArray(parsed)) return [];
  return axisSlug ? parsed.filter((i) => i.axisSlug === axisSlug) : parsed;
}

export function saveCustomAxisItems(items: CustomAxisItem[]) {
  writeJson(STORAGE_KEY, items);
}

export function loadAxisItemOverrides(): Record<string, AxisItemOverride> {
  const parsed = readJson<Record<string, AxisItemOverride>>(OVERRIDES_KEY, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function saveAxisItemOverrides(map: Record<string, AxisItemOverride>) {
  writeJson(OVERRIDES_KEY, map);
}

export function loadHiddenAxisItemKeys(): string[] {
  const parsed = readJson<string[]>(HIDDEN_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveHiddenAxisItemKeys(keys: string[]) {
  writeJson(HIDDEN_KEY, [...new Set(keys)]);
}

function slugify(label: string) {
  const base = label
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9\-]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `item-${Date.now()}`;
}

function pickFields(data: Record<string, unknown>, fallback?: Partial<NavItem>) {
  const label = String(data.label ?? fallback?.label ?? "").trim() || "عنصر جديد";
  const hrefRaw = String(data.href ?? fallback?.href ?? "").trim();
  const moduleSlugRaw = String(data.moduleSlug ?? fallback?.moduleSlug ?? "").trim();
  const descriptionRaw = String(data.description ?? fallback?.description ?? "").trim();
  return {
    label,
    href: hrefRaw || undefined,
    moduleSlug: moduleSlugRaw || undefined,
    description: descriptionRaw || undefined,
  };
}

export function createCustomAxisItem(
  axisSlug: string,
  data: Record<string, unknown>
): CustomAxisItem {
  const fields = pickFields(data);
  const id = `custom-${slugify(fields.label)}-${Date.now().toString(36)}`;

  return {
    id,
    label: fields.label,
    href: fields.href || (fields.moduleSlug ? undefined : "/app/dashboard"),
    moduleSlug: fields.moduleSlug,
    description: fields.description,
    axisSlug,
    createdAt: new Date().toISOString(),
  };
}

export function appendCustomAxisItem(item: CustomAxisItem) {
  const next = [item, ...loadCustomAxisItems()];
  saveCustomAxisItems(next);
  return loadCustomAxisItems(item.axisSlug);
}

export function updateCustomAxisItem(
  axisSlug: string,
  itemId: string,
  data: Record<string, unknown>
): CustomAxisItem[] {
  const all = loadCustomAxisItems();
  const idx = all.findIndex((i) => i.axisSlug === axisSlug && i.id === itemId);
  if (idx < 0) return loadCustomAxisItems(axisSlug);
  const current = all[idx];
  const fields = pickFields(data, current);
  const next = [...all];
  next[idx] = {
    ...current,
    ...fields,
    href: fields.href || (fields.moduleSlug ? undefined : current.href || "/app/dashboard"),
  };
  saveCustomAxisItems(next);
  return loadCustomAxisItems(axisSlug);
}

export function removeCustomAxisItem(axisSlug: string, itemId: string): CustomAxisItem[] {
  const next = loadCustomAxisItems().filter((i) => !(i.axisSlug === axisSlug && i.id === itemId));
  saveCustomAxisItems(next);
  return loadCustomAxisItems(axisSlug);
}

export function upsertAxisItemOverride(
  axisSlug: string,
  itemId: string,
  data: Record<string, unknown>
) {
  const key = itemStorageKey(axisSlug, itemId);
  const map = loadAxisItemOverrides();
  const current = map[key] ?? {};
  const fields = pickFields(data, {
    label: current.label,
    href: current.href,
    moduleSlug: current.moduleSlug,
    description: current.description,
  });
  map[key] = { ...fields, updatedAt: new Date().toISOString() };
  saveAxisItemOverrides(map);
  return map[key];
}

export function hideAxisItem(axisSlug: string, itemId: string): string[] {
  const key = itemStorageKey(axisSlug, itemId);
  const next = [...loadHiddenAxisItemKeys(), key];
  saveHiddenAxisItemKeys(next);
  return next;
}

export function isAxisItemHidden(axisSlug: string, itemId: string): boolean {
  return loadHiddenAxisItemKeys().includes(itemStorageKey(axisSlug, itemId));
}

export function applyAxisItemOverride(axisSlug: string, item: NavItem): NavItem {
  const override = loadAxisItemOverrides()[itemStorageKey(axisSlug, item.id)];
  if (!override) return item;
  return {
    ...item,
    label: override.label?.trim() || item.label,
    href: override.href?.trim() || item.href,
    moduleSlug: override.moduleSlug?.trim() || item.moduleSlug,
    description: override.description?.trim() || item.description,
  };
}

export const ADD_AXIS_ITEM_FORM_FIELDS: FormField[] = [
  {
    key: "label",
    label: "اسم العنصر",
    type: "text",
    required: true,
    placeholder: "مثال: مركز العمليات",
  },
  {
    key: "href",
    label: "رابط الصفحة",
    type: "text",
    placeholder: "/app/dashboard",
  },
  {
    key: "moduleSlug",
    label: "وحدة تشغيلية (اختياري)",
    type: "text",
    placeholder: "case-management",
  },
  {
    key: "description",
    label: "الوصف",
    type: "textarea",
    placeholder: "وصف مختصر للعنصر",
  },
  {
    key: "notes",
    label: "ملاحظات",
    type: "textarea",
  },
];
