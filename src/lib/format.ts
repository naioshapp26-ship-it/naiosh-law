/** تنسيق موحّد: أرقام لاتينية (0-9) وعملة الدولار في كل النظام */

export const SYSTEM_LOCALE = "en-US";
export const SYSTEM_CURRENCY = "USD";
/** تواريخ عربية مع أرقام إنجليزية */
export const DATE_LOCALE = "ar-EG";

const latn = { numberingSystem: "latn" as const };

export function toFiniteNumber(value: unknown): number {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null || value === "") return 0;
  const n = Number(String(value).replace(/,/g, "").trim());
  return Number.isFinite(n) ? n : 0;
}

/** أرقام إنجليزية مع فواصل آلاف */
export function formatNumber(
  value: unknown,
  options?: Intl.NumberFormatOptions
): string {
  return toFiniteNumber(value).toLocaleString(SYSTEM_LOCALE, {
    ...latn,
    ...options,
  });
}

/** عملة الدولار دائمًا — مثال: $1,250.00 */
export function formatCurrency(
  value: unknown,
  options?: Intl.NumberFormatOptions
): string {
  return toFiniteNumber(value).toLocaleString(SYSTEM_LOCALE, {
    style: "currency",
    currency: SYSTEM_CURRENCY,
    currencyDisplay: "symbol",
    ...latn,
    ...options,
  });
}

/** تاريخ بأرقام إنجليزية (أسماء الأشهر بالعربية إن لزم) */
export function formatDate(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleDateString(DATE_LOCALE, {
    ...latn,
    year: "numeric",
    month: "long",
    day: "numeric",
    ...options,
  });
}

export function formatDateTime(
  value: Date | string | number,
  options?: Intl.DateTimeFormatOptions
): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString(DATE_LOCALE, {
    ...latn,
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  });
}

/** تحويل أي أرقام عربية-هندية داخل نص إلى لاتينية */
export function toLatinDigits(input: string): string {
  return input
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0));
}
