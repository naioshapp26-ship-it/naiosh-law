import type { ArchiveAttachment } from "@/lib/archive-types";

export type RecordSupplementPayload = {
  sourceModule: string;
  sourceId: string;
  sourceRef?: string;
  title?: string;
  notes: string;
  attachments: ArchiveAttachment[];
};

export async function saveRecordSupplement(payload: RecordSupplementPayload) {
  const res = await fetch("/api/record-supplements", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    return { ok: false as const, message: (data.error as string) ?? "فشل حفظ المعلومات الإضافية" };
  }
  return { ok: true as const, message: "✅ تمت إضافة المعلومات بنجاح", data };
}

export async function fetchRecordSupplements(sourceModule: string, sourceId: string) {
  const params = new URLSearchParams({ sourceModule, sourceId });
  const res = await fetch(`/api/record-supplements?${params}`, { credentials: "include" });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data) ? data : [];
}
