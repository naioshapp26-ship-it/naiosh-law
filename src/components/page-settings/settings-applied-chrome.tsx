"use client";

import type { AppliedPageSettings } from "@/lib/page-settings/use-page-settings";

/** Preview banner + settings link — shared chrome for staff pages. */
export function SettingsAppliedChrome({
  pageKey,
  settings,
}: {
  pageKey: string;
  settings: AppliedPageSettings;
}) {
  return (
    <>
      {settings.previewMode ? (
        <div
          className="mb-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-amber-900 font-bold text-sm"
          role="status"
        >
          معاينة إعدادات الصفحة — لم تُحفظ بعد ·{" "}
          <a className="underline" href={`/app/page-settings/${pageKey}`}>
            العودة للمحرر
          </a>
        </div>
      ) : null}
    </>
  );
}

export function SettingsLinkButton({ pageKey }: { pageKey: string }) {
  return (
    <a
      href={`/app/page-settings/${pageKey}`}
      className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-extrabold text-[#101D32] hover:border-[#B79A61]"
    >
      ⚙️ إعدادات الصفحة
    </a>
  );
}

export function specBool(
  settings: AppliedPageSettings,
  key: string,
  fallback = true
): boolean {
  const v = settings.specialized?.[key];
  if (typeof v === "boolean") return v;
  return fallback;
}

export function specNumber(
  settings: AppliedPageSettings,
  key: string,
  fallback: number
): number {
  const v = settings.specialized?.[key];
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() && !Number.isNaN(Number(v))) return Number(v);
  return fallback;
}

export function specString(
  settings: AppliedPageSettings,
  key: string,
  fallback: string
): string {
  const v = settings.specialized?.[key];
  if (typeof v === "string" && v.trim()) return v;
  return fallback;
}
