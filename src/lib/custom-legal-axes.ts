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

export type AxisPresentationOverride = {
  title?: string;
  subtitle?: string;
  icon?: string;
  color?: string;
  description?: string;
  updatedAt?: string;
};

const STORAGE_KEY = "naiosh.custom-legal-axes.v1";
const OVERRIDES_KEY = "naiosh.legal-axis-overrides.v1";
const HIDDEN_KEY = "naiosh.legal-axis-hidden.v1";

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

export function loadCustomLegalAxes(): CustomLegalAxis[] {
  const parsed = readJson<CustomLegalAxis[]>(STORAGE_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveCustomLegalAxes(axes: CustomLegalAxis[]) {
  writeJson(STORAGE_KEY, axes);
}

export function loadAxisOverrides(): Record<string, AxisPresentationOverride> {
  const parsed = readJson<Record<string, AxisPresentationOverride>>(OVERRIDES_KEY, {});
  return parsed && typeof parsed === "object" ? parsed : {};
}

export function saveAxisOverrides(map: Record<string, AxisPresentationOverride>) {
  writeJson(OVERRIDES_KEY, map);
}

export function loadHiddenAxisSlugs(): string[] {
  const parsed = readJson<string[]>(HIDDEN_KEY, []);
  return Array.isArray(parsed) ? parsed : [];
}

export function saveHiddenAxisSlugs(slugs: string[]) {
  writeJson(HIDDEN_KEY, [...new Set(slugs)]);
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

function pickPresentation(data: Record<string, unknown>, fallback?: Partial<CustomLegalAxis>) {
  const title = String(data.title ?? fallback?.title ?? "").trim() || "محور جديد";
  const subtitle = String(data.subtitle ?? fallback?.subtitle ?? "").trim() || "محور مخصص";
  const description =
    String(data.description ?? fallback?.description ?? "").trim() ||
    "محور قانوني مخصص تمت إضافته من لوحة التحكم.";
  const icon = String(data.icon ?? fallback?.icon ?? "").trim() || "⚖️";
  const color =
    String(data.color ?? fallback?.color ?? "").trim() ||
    AXIS_COLORS[Math.floor(Math.random() * AXIS_COLORS.length)];
  return { title, subtitle, description, icon, color };
}

export function createCustomLegalAxis(
  data: Record<string, unknown>,
  source: CustomLegalAxis["source"]
): CustomLegalAxis {
  const presentation = pickPresentation(data);
  const slugBase = slugify(String(data.slug ?? presentation.title));
  const slug = `custom-${slugBase}-${Date.now().toString(36)}`;
  const existing = loadCustomLegalAxes();
  const nextId = Math.max(8, ...existing.map((a) => a.id), 8) + 1;

  return {
    id: nextId,
    slug,
    ...presentation,
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

export function updateCustomLegalAxis(slug: string, data: Record<string, unknown>): CustomLegalAxis[] {
  const existing = loadCustomLegalAxes();
  const idx = existing.findIndex((a) => a.slug === slug);
  if (idx < 0) return existing;
  const current = existing[idx];
  const presentation = pickPresentation(data, current);
  const next = [...existing];
  next[idx] = { ...current, ...presentation };
  saveCustomLegalAxes(next);
  return next;
}

export function removeCustomLegalAxis(slug: string): CustomLegalAxis[] {
  const next = loadCustomLegalAxes().filter((a) => a.slug !== slug);
  saveCustomLegalAxes(next);
  return next;
}

/** Persist presentation edits for built-in axes (and optional custom override cache). */
export function upsertAxisOverride(slug: string, data: Record<string, unknown>) {
  const map = loadAxisOverrides();
  const current = map[slug] ?? {};
  const presentation = pickPresentation(data, {
    title: current.title,
    subtitle: current.subtitle,
    description: current.description,
    icon: current.icon,
    color: current.color,
  });
  map[slug] = { ...presentation, updatedAt: new Date().toISOString() };
  saveAxisOverrides(map);
  return map[slug];
}

export function hideAxis(slug: string): string[] {
  const next = [...loadHiddenAxisSlugs(), slug];
  saveHiddenAxisSlugs(next);
  return next;
}

export function isAxisHidden(slug: string): boolean {
  return loadHiddenAxisSlugs().includes(slug);
}

export function applyAxisOverride<T extends {
  slug: string;
  title: string;
  subtitle: string;
  icon: string;
  color: string;
  description: string;
}>(axis: T): T {
  const override = loadAxisOverrides()[axis.slug];
  if (!override) return axis;
  return {
    ...axis,
    title: override.title?.trim() || axis.title,
    subtitle: override.subtitle?.trim() || axis.subtitle,
    icon: override.icon?.trim() || axis.icon,
    color: override.color?.trim() || axis.color,
    description: override.description?.trim() || axis.description,
  };
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
