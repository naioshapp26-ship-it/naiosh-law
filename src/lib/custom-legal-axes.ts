/** Custom legal axes added from dashboard / international-laws UI (client-side). */

export type CustomLegalAxis = {
  id: number;
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
  href: string;
  source: "dashboard" | "international" | "both";
  createdAt: string;
};

const STORAGE_KEY = "naiosh.custom-legal-axes.v1";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function loadCustomLegalAxes(): CustomLegalAxis[] {
  if (!canUseStorage()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as CustomLegalAxis[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveCustomLegalAxes(axes: CustomLegalAxis[]) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(axes));
}

function slugify(title: string) {
  const base = title
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\u0600-\u06FFa-z0-9\-]+/gi, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base || `axis-${Date.now()}`;
}

const AXIS_COLORS = [
  "#c3152a",
  "#0ea5e9",
  "#8b5cf6",
  "#22c55e",
  "#f59e0b",
  "#06b6d4",
  "#ec4899",
  "#64748b",
];

export function createCustomLegalAxis(
  data: Record<string, unknown>,
  source: CustomLegalAxis["source"]
): CustomLegalAxis {
  const title = String(data.title ?? "").trim() || "محور جديد";
  const subtitle = String(data.subtitle ?? "").trim() || "محور مخصص";
  const description = String(data.description ?? "").trim() || "محور قانوني مخصص تمت إضافته من لوحة التحكم.";
  const icon = String(data.icon ?? "").trim() || "⚖️";
  const color = String(data.color ?? "").trim() || AXIS_COLORS[Math.floor(Math.random() * AXIS_COLORS.length)];
  const slugBase = slugify(String(data.slug ?? title));
  const slug = `custom-${slugBase}-${Date.now().toString(36)}`;
  const existing = loadCustomLegalAxes();
  const nextId = Math.max(8, ...existing.map((a) => a.id), 8) + 1;

  return {
    id: nextId,
    slug,
    title,
    subtitle,
    icon,
    color,
    description,
    href: `/app/international-laws`,
    source,
    createdAt: new Date().toISOString(),
  };
}

export function appendCustomLegalAxis(axis: CustomLegalAxis) {
  const next = [axis, ...loadCustomLegalAxes()];
  saveCustomLegalAxes(next);
  return next;
}

export const ADD_AXIS_FORM_FIELDS = [
  { key: "title", label: "عنوان المحور", type: "text" as const, required: true, placeholder: "مثال: قانون الملكية الفكرية" },
  { key: "subtitle", label: "العنوان الفرعي", type: "text" as const, placeholder: "مثال: المحور التاسع" },
  {
    key: "icon",
    label: "الأيقونة",
    type: "select" as const,
    options: ["⚖️", "🌐", "👑", "📚", "💰", "🤝", "🛡️", "⚙️", "🏛️", "📋"],
  },
  {
    key: "color",
    label: "لون المحور",
    type: "text" as const,
    placeholder: "#c3152a",
  },
  { key: "description", label: "وصف المحور", type: "textarea" as const, placeholder: "وصف مختصر للمحور القانوني" },
  { key: "notes", label: "ملاحظات", type: "textarea" as const },
];
