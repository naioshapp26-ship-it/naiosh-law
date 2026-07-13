import type { ArchiveFromRecordPayload } from "@/lib/archive-types";

export async function sendRecordToArchive(payload: ArchiveFromRecordPayload) {
  const res = await fetch("/api/archive/from-record", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message =
      res.status === 409
        ? "هذا السجل موجود في الأرشيف مسبقاً"
        : (data.error as string) ?? "فشل الأرشفة";
    return { ok: false as const, message, data };
  }

  return { ok: true as const, message: "📦 تم نقل السجل إلى الأرشيف بنجاح", data };
}

export function buildArchiveTitle(row: Record<string, unknown>, fallback = "سجل") {
  const candidates = ["title", "name", "caseNo", "refNo", "clientName", "client"];
  for (const key of candidates) {
    const val = row[key];
    if (val && String(val).trim() && String(val) !== "—") return String(val);
  }
  return fallback;
}

export function buildArchiveRef(row: Record<string, unknown>) {
  const candidates = ["refNo", "caseNo", "invoiceNo", "id"];
  for (const key of candidates) {
    const val = row[key];
    if (val && String(val).trim() && String(val) !== "—") return String(val);
  }
  return undefined;
}
