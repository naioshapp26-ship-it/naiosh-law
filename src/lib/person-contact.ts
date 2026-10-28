/**
 * Permanent design rule — person contact fields
 * ─────────────────────────────────────────────
 * Any form, table, report, or document that names a موكل / عميل / طرف / شخص
 * MUST support display + capture of: name, mobile (+ dial code), country, city,
 * without deleting existing fields. Source of truth is the central Client /
 * RecordParty / PersonContactChange layer in PostgreSQL — never page-local copies.
 * Missing values render as «غير مسجل» (never fabricated). Contact visibility is
 * gated by role (see canViewPersonContact / canEditPersonContact).
 */

import type { FormField, Column } from "@/data/module-configs";
import type { UserRole } from "@/generated/prisma/client";

export const UNSPECIFIED_CONTACT = "غير مسجل";

export const PERSON_CONTACT_DESIGN_RULE =
  "Any person-bearing UI must expose name + mobile(+dial) + country + city from the central registry.";

/** Country catalog: name → default ITU dial code */
export const COUNTRY_DIAL_CODES: { country: string; dialCode: string }[] = [
  { country: "مصر", dialCode: "+20" },
  { country: "السعودية", dialCode: "+966" },
  { country: "الإمارات", dialCode: "+971" },
  { country: "الكويت", dialCode: "+965" },
  { country: "قطر", dialCode: "+974" },
  { country: "البحرين", dialCode: "+973" },
  { country: "عُمان", dialCode: "+968" },
  { country: "الأردن", dialCode: "+962" },
  { country: "لبنان", dialCode: "+961" },
  { country: "العراق", dialCode: "+964" },
  { country: "سوريا", dialCode: "+963" },
  { country: "فلسطين", dialCode: "+970" },
  { country: "المغرب", dialCode: "+212" },
  { country: "تونس", dialCode: "+216" },
  { country: "الجزائر", dialCode: "+213" },
  { country: "ليبيا", dialCode: "+218" },
  { country: "السودان", dialCode: "+249" },
  { country: "اليمن", dialCode: "+967" },
  { country: "تركيا", dialCode: "+90" },
  { country: "المملكة المتحدة", dialCode: "+44" },
  { country: "الولايات المتحدة", dialCode: "+1" },
  { country: "فرنسا", dialCode: "+33" },
  { country: "ألمانيا", dialCode: "+49" },
  { country: "أخرى", dialCode: "+" },
];

export const COUNTRY_NAMES = COUNTRY_DIAL_CODES.map((c) => c.country);

export const CITIES_BY_COUNTRY: Record<string, string[]> = {
  مصر: ["القاهرة", "الجيزة", "الإسكندرية", "المنصورة", "طنطا", "أسيوط", "الأقصر", "أسوان", "بورسعيد", "السويس", "شرم الشيخ"],
  السعودية: ["الرياض", "جدة", "مكة المكرمة", "المدينة المنورة", "الدمام", "الخبر", "الطائف", "تبوك", "أبها"],
  الإمارات: ["دبي", "أبوظبي", "الشارقة", "عجمان", "رأس الخيمة", "الفجيرة", "أم القيوين"],
  الكويت: ["مدينة الكويت", "حولي", "الفروانية", "الجهراء", "الأحمدي"],
  قطر: ["الدوحة", "الوكرة", "الخور", "الريان"],
  البحرين: ["المنامة", "المحرق", "الرفاع"],
  "عُمان": ["مسقط", "صلالة", "صحار", "نزوى"],
  الأردن: ["عمّان", "إربد", "الزرقاء", "العقبة"],
  لبنان: ["بيروت", "طرابلس", "صيدا", "جونية"],
  العراق: ["بغداد", "البصرة", "أربيل", "الموصل", "النجف"],
  سوريا: ["دمشق", "حلب", "حمص", "اللاذقية"],
  فلسطين: ["القدس", "رام الله", "غزة", "نابلس", "الخليل"],
  المغرب: ["الرباط", "الدار البيضاء", "فاس", "مراكش", "طنجة"],
  تونس: ["تونس", "صفاقس", "سوسة"],
  الجزائر: ["الجزائر", "وهران", "قسنطينة"],
  ليبيا: ["طرابلس", "بنغازي", "مصراتة"],
  السودان: ["الخرطوم", "أم درمان", "بورتسودان"],
  اليمن: ["صنعاء", "عدن", "تعز"],
  تركيا: ["إسطنبول", "أنقرة", "إزمير", "أنطاليا"],
  "المملكة المتحدة": ["لندن", "مانشستر", "برمنغهام"],
  "الولايات المتحدة": ["نيويورك", "واشنطن", "لوس أنجلوس", "شيكاغو"],
  فرنسا: ["باريس", "ليون", "مارسيليا"],
  ألمانيا: ["برلين", "ميونخ", "هامبورغ", "فرانكفورت"],
  أخرى: [],
};

export type PersonContactSnapshot = {
  phoneDialCode: string | null;
  phone: string | null;
  phoneSecondary: string | null;
  phoneSecondaryDialCode: string | null;
  primaryPhoneSlot: number;
  country: string | null;
  city: string | null;
  countrySecondary: string | null;
  citySecondary: string | null;
  primaryAddressSlot: number;
};

export type DisplayContact = {
  phone: string;
  phoneRaw: string | null;
  phoneDialCode: string | null;
  country: string;
  city: string;
  countryRaw: string | null;
  cityRaw: string | null;
  incomplete: boolean;
};

/** Roles that may see contact details of persons they are authorized for */
const VIEW_CONTACT_ROLES: ReadonlySet<string> = new Set([
  "admin",
  "lawyer",
  "consultant",
  "employee",
  "judge",
  "industrial_agent",
]);

const EDIT_CONTACT_ROLES: ReadonlySet<string> = new Set([
  "admin",
  "lawyer",
  "consultant",
  "employee",
]);

export function canViewPersonContact(
  role: string | UserRole | null | undefined,
  opts?: { isOwnRecord?: boolean; sameClient?: boolean }
): boolean {
  if (!role) return false;
  if (role === "client") {
    return Boolean(opts?.isOwnRecord || opts?.sameClient);
  }
  return VIEW_CONTACT_ROLES.has(String(role));
}

export function canEditPersonContact(role: string | UserRole | null | undefined): boolean {
  if (!role) return false;
  return EDIT_CONTACT_ROLES.has(String(role));
}

export function displayOrUnspecified(value: string | null | undefined): string {
  const v = String(value ?? "").trim();
  return v ? v : UNSPECIFIED_CONTACT;
}

export function dialCodeForCountry(country: string | null | undefined): string {
  if (!country) return "+20";
  const hit = COUNTRY_DIAL_CODES.find((c) => c.country === country);
  return hit?.dialCode ?? "+20";
}

export function citiesForCountry(country: string | null | undefined): string[] {
  if (!country) return [];
  return CITIES_BY_COUNTRY[country] ?? [];
}

export function formatPhoneDisplay(
  dialCode: string | null | undefined,
  phone: string | null | undefined
): string {
  const p = String(phone ?? "").trim();
  if (!p) return UNSPECIFIED_CONTACT;
  const d = String(dialCode ?? "").trim();
  if (!d) return p;
  // Avoid double-prefix if phone already starts with +
  if (p.startsWith("+")) return p;
  return `${d} ${p}`;
}

export function resolvePrimaryPhone(c: PersonContactSnapshot): {
  dialCode: string | null;
  phone: string | null;
} {
  if (c.primaryPhoneSlot === 1 && c.phoneSecondary) {
    return {
      dialCode: c.phoneSecondaryDialCode ?? c.phoneDialCode,
      phone: c.phoneSecondary,
    };
  }
  return { dialCode: c.phoneDialCode, phone: c.phone };
}

export function resolvePrimaryAddress(c: PersonContactSnapshot): {
  country: string | null;
  city: string | null;
} {
  if (c.primaryAddressSlot === 1 && (c.countrySecondary || c.citySecondary)) {
    return { country: c.countrySecondary, city: c.citySecondary };
  }
  return { country: c.country, city: c.city };
}

export function toDisplayContact(
  raw: Partial<PersonContactSnapshot> | null | undefined,
  opts?: { mask?: boolean }
): DisplayContact {
  const snap: PersonContactSnapshot = {
    phoneDialCode: raw?.phoneDialCode ?? null,
    phone: raw?.phone ?? null,
    phoneSecondary: raw?.phoneSecondary ?? null,
    phoneSecondaryDialCode: raw?.phoneSecondaryDialCode ?? null,
    primaryPhoneSlot: raw?.primaryPhoneSlot ?? 0,
    country: raw?.country ?? null,
    city: raw?.city ?? null,
    countrySecondary: raw?.countrySecondary ?? null,
    citySecondary: raw?.citySecondary ?? null,
    primaryAddressSlot: raw?.primaryAddressSlot ?? 0,
  };
  const { dialCode, phone } = resolvePrimaryPhone(snap);
  const { country, city } = resolvePrimaryAddress(snap);
  const incomplete = !phone || !country || !city;
  if (opts?.mask) {
    return {
      phone: phone ? "••••••••" : UNSPECIFIED_CONTACT,
      phoneRaw: null,
      phoneDialCode: null,
      country: displayOrUnspecified(country),
      city: displayOrUnspecified(city),
      countryRaw: country,
      cityRaw: city,
      incomplete,
    };
  }
  return {
    phone: formatPhoneDisplay(dialCode, phone),
    phoneRaw: phone,
    phoneDialCode: dialCode,
    country: displayOrUnspecified(country),
    city: displayOrUnspecified(city),
    countryRaw: country,
    cityRaw: city,
    incomplete,
  };
}

/** E.164-ish / regional mobile validation — digits only after optional + */
export function validateMobileNumber(
  dialCode: string | null | undefined,
  phone: string | null | undefined
): { ok: boolean; error?: string } {
  const p = String(phone ?? "").trim();
  if (!p) return { ok: false, error: "رقم الجوال مطلوب" };
  const digits = p.replace(/[\s\-()]/g, "");
  const normalized = digits.startsWith("+") ? digits.slice(1) : digits;
  if (!/^\d{7,15}$/.test(normalized)) {
    return { ok: false, error: "رقم الجوال غير صالح (7–15 رقمًا)" };
  }
  const d = String(dialCode ?? "").trim();
  if (d && d !== "+" && !/^\+\d{1,4}$/.test(d)) {
    return { ok: false, error: "مفتاح الدولة غير صالح" };
  }
  return { ok: true };
}

export function validateCountryCity(
  country: string | null | undefined,
  city: string | null | undefined,
  opts?: { allowCustomCity?: boolean; required?: boolean }
): { ok: boolean; error?: string } {
  const required = opts?.required !== false;
  const c = String(country ?? "").trim();
  const cityVal = String(city ?? "").trim();
  if (!c) {
    return required ? { ok: false, error: "الدولة مطلوبة" } : { ok: true };
  }
  if (!COUNTRY_NAMES.includes(c) && c !== "أخرى") {
    // Allow free-text country names that aren't in the catalog
  }
  if (!cityVal) {
    return required ? { ok: false, error: "المدينة مطلوبة" } : { ok: true };
  }
  const known = citiesForCountry(c);
  if (known.length && !known.includes(cityVal) && opts?.allowCustomCity === false) {
    return { ok: false, error: "المدينة غير مرتبطة بالدولة المحددة" };
  }
  return { ok: true };
}

/** Keys that identify a person/party name field on forms */
export const PERSON_NAME_FIELD_KEYS = [
  "client",
  "clientName",
  "name",
  "requester",
  "firstParty",
  "secondParty",
] as const;

const DIAL_OPTIONS = COUNTRY_DIAL_CODES.map((c) => `${c.dialCode} (${c.country})`);

/** Standard contact form fields (after person name field) — permanent design rule */
export function personContactFormFields(opts?: {
  required?: boolean;
  prefix?: string;
  includeSecondary?: boolean;
}): FormField[] {
  const required = opts?.required !== false;
  const p = opts?.prefix ?? "";
  const fields: FormField[] = [
    {
      key: `${p}phoneDialCode`,
      label: "مفتاح الدولة",
      type: "select",
      required,
      options: DIAL_OPTIONS,
    },
    {
      key: `${p}phone`,
      label: "رقم الجوال",
      type: "tel",
      required,
      placeholder: "5XXXXXXXX",
    },
    {
      key: `${p}country`,
      label: "الدولة",
      type: "select",
      required,
      options: COUNTRY_NAMES,
    },
    {
      key: `${p}city`,
      label: "المدينة",
      type: "text",
      required,
      placeholder: "المدينة (أو أدخل مدينة غير مدرجة)",
      dependsOn: `${p}country`,
    },
  ];
  if (opts?.includeSecondary !== false) {
    fields.push(
      {
        key: `${p}phoneSecondaryDialCode`,
        label: "مفتاح الجوال الإضافي",
        type: "select",
        required: false,
        options: DIAL_OPTIONS,
      },
      {
        key: `${p}phoneSecondary`,
        label: "رقم جوال إضافي",
        type: "tel",
        required: false,
        placeholder: "اختياري — 5XXXXXXXX",
      }
    );
  }
  return fields;
}

/** Modules whose forms name a real person/party (not a template/report title). */
export const PERSON_BEARING_MODULE_SLUGS = new Set([
  "case-management",
  "clients-management",
  "court-sessions",
  "follow-up-center",
  "legal-accounting",
  "legal-services",
  "legal-consultations",
  "complaints-management",
  "internal-requests",
  "administration",
]);

/**
 * Ensure a form that names a person also exposes contact fields.
 * Inserts after the first person-name field; never removes existing fields.
 */
export function ensurePersonContactOnFormFields(
  fields: FormField[],
  opts?: { required?: boolean; force?: boolean; nameKeys?: readonly string[] }
): FormField[] {
  const nameKeys = opts?.nameKeys ?? PERSON_NAME_FIELD_KEYS;
  const nameIdx = fields.findIndex((f) => (nameKeys as readonly string[]).includes(f.key));
  if (nameIdx < 0 && !opts?.force) return fields;

  const hasPhone = fields.some((f) => f.key === "phone");
  const hasDial = fields.some((f) => f.key === "phoneDialCode");
  const hasCountry = fields.some((f) => f.key === "country");
  const hasCity = fields.some((f) => f.key === "city");
  const hasSec = fields.some((f) => f.key === "phoneSecondary");
  const hasSecDial = fields.some((f) => f.key === "phoneSecondaryDialCode");

  const needed = personContactFormFields({
    required: opts?.required !== false,
    includeSecondary: true,
  }).filter((f) => {
    if (f.key === "phone" && hasPhone) return false;
    if (f.key === "phoneDialCode" && hasDial) return false;
    if (f.key === "country" && hasCountry) return false;
    if (f.key === "city" && hasCity) return false;
    if (f.key === "phoneSecondary" && hasSec) return false;
    if (f.key === "phoneSecondaryDialCode" && hasSecDial) return false;
    return true;
  });

  if (needed.length === 0) return fields;

  // Insert after the last primary contact field when present; otherwise right after the name.
  const contactOrder = ["phoneDialCode", "phone", "country", "city"];
  let at = nameIdx >= 0 ? nameIdx + 1 : 0;
  for (let i = 0; i < fields.length; i++) {
    if (contactOrder.includes(fields[i]!.key)) at = i + 1;
  }
  return [...fields.slice(0, at), ...needed, ...fields.slice(at)];
}

/** Labels for view/detail panels — always show contact block */
export const PERSON_CONTACT_VIEW_FIELDS: { key: string; label: string }[] = [
  { key: "phoneDialCode", label: "مفتاح الدولة" },
  { key: "phone", label: "رقم الجوال" },
  { key: "phoneSecondaryDialCode", label: "مفتاح الجوال الإضافي" },
  { key: "phoneSecondary", label: "رقم جوال إضافي" },
  { key: "country", label: "الدولة" },
  { key: "city", label: "المدينة" },
];

/** Case-management mandatory column order (RTL visual: right→left) */
export const CASE_PERSON_CONTACT_COLUMNS: Column[] = [
  { key: "phone", label: "رقم الجوال" },
  { key: "country", label: "الدولة" },
  { key: "city", label: "المدينة" },
];

export const PERSON_CONTACT_COLUMN_KEYS = ["phone", "country", "city"] as const;

export const PERSON_CONTACT_FIELD_KEYS = [
  "phoneDialCode",
  "phone",
  "country",
  "city",
  "phoneSecondary",
  "phoneSecondaryDialCode",
  "primaryPhoneSlot",
  "countrySecondary",
  "citySecondary",
  "primaryAddressSlot",
] as const;

export type PersonContactFieldKey = (typeof PERSON_CONTACT_FIELD_KEYS)[number];

/** Parse dial select option " +20 (مصر) " → "+20" */
export function parseDialCodeOption(value: string | null | undefined): string {
  const v = String(value ?? "").trim();
  if (!v) return "";
  const m = v.match(/^(\+\d{1,4}|\+)/);
  return m ? m[1] : v.startsWith("+") ? v.split(/\s/)[0] : v;
}

export function contactFieldsFromBody(body: Record<string, unknown>): {
  phoneDialCode?: string | null;
  phone?: string | null;
  country?: string | null;
  city?: string | null;
  phoneSecondary?: string | null;
  phoneSecondaryDialCode?: string | null;
  primaryPhoneSlot?: number;
  countrySecondary?: string | null;
  citySecondary?: string | null;
  primaryAddressSlot?: number;
} {
  const out: ReturnType<typeof contactFieldsFromBody> = {};
  if (body.phoneDialCode !== undefined) {
    out.phoneDialCode = body.phoneDialCode
      ? parseDialCodeOption(String(body.phoneDialCode))
      : null;
  }
  if (body.phone !== undefined) {
    out.phone = body.phone ? String(body.phone).trim() : null;
  }
  if (body.country !== undefined) {
    out.country = body.country ? String(body.country).trim() : null;
  }
  if (body.city !== undefined) {
    out.city = body.city ? String(body.city).trim() : null;
  }
  if (body.phoneSecondary !== undefined) {
    out.phoneSecondary = body.phoneSecondary ? String(body.phoneSecondary).trim() : null;
  }
  if (body.phoneSecondaryDialCode !== undefined) {
    out.phoneSecondaryDialCode = body.phoneSecondaryDialCode
      ? parseDialCodeOption(String(body.phoneSecondaryDialCode))
      : null;
  }
  if (body.primaryPhoneSlot !== undefined) {
    out.primaryPhoneSlot = Number(body.primaryPhoneSlot) === 1 ? 1 : 0;
  }
  if (body.countrySecondary !== undefined) {
    out.countrySecondary = body.countrySecondary
      ? String(body.countrySecondary).trim()
      : null;
  }
  if (body.citySecondary !== undefined) {
    out.citySecondary = body.citySecondary ? String(body.citySecondary).trim() : null;
  }
  if (body.primaryAddressSlot !== undefined) {
    out.primaryAddressSlot = Number(body.primaryAddressSlot) === 1 ? 1 : 0;
  }
  return out;
}

/** Attach display contact onto a row; masks when viewer lacks permission */
export function attachContactToRow<T extends Record<string, unknown>>(
  row: T,
  contact: Partial<PersonContactSnapshot> | null | undefined,
  opts: { canView: boolean }
): T & { phone: string; country: string; city: string; contactIncomplete: boolean } {
  const display = toDisplayContact(contact, { mask: !opts.canView });
  return {
    ...row,
    phone: opts.canView || !contact?.phone ? display.phone : "••••••••",
    country: display.country,
    city: display.city,
    phoneDialCode: opts.canView ? display.phoneDialCode ?? "" : "",
    phoneSecondary: opts.canView ? contact?.phoneSecondary ?? "" : "",
    phoneSecondaryDialCode: opts.canView ? contact?.phoneSecondaryDialCode ?? "" : "",
    contactIncomplete: display.incomplete,
  };
}
