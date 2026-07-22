/** Custom items added under imperial axis hubs (e.g. لوحة التحكم السيادية). */

import type { NavItem } from "@/data/empire-structure";
import type { FormField } from "@/data/module-configs";

export type CustomAxisItem = NavItem & {
  axisSlug: string;
  createdAt: string;
};

const STORAGE_KEY = "naiosh.custom-axis-items.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadCustomAxisItems(axisSlug?: string): CustomAxisItem[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomAxisItem[];
    if (!Array.isArray(parsed)) return [];
    return axisSlug ? parsed.filter((i) => i.axisSlug === axisSlug) : parsed;
  } catch {
    return [];
  }
}

export function saveCustomAxisItems(items: CustomAxisItem[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
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

export function createCustomAxisItem(
  axisSlug: string,
  data: Record<string, unknown>
): CustomAxisItem {
  const label = String(data.label ?? "").trim() || "عنصر جديد";
  const href = String(data.href ?? "").trim() || undefined;
  const moduleSlug = String(data.moduleSlug ?? "").trim() || undefined;
  const description = String(data.description ?? "").trim() || undefined;
  const id = `custom-${slugify(label)}-${Date.now().toString(36)}`;

  return {
    id,
    label,
    href: href || (moduleSlug ? undefined : "/app/dashboard"),
    moduleSlug,
    description,
    axisSlug,
    createdAt: new Date().toISOString(),
  };
}

export function appendCustomAxisItem(item: CustomAxisItem) {
  const next = [item, ...loadCustomAxisItems()];
  saveCustomAxisItems(next);
  return loadCustomAxisItems(item.axisSlug);
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
