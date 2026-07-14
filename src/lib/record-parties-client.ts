import type { PartyFields } from "@/lib/party-fields";
import { hasPartyValues } from "@/lib/party-fields";

export async function upsertRecordParties(opts: {
  sourceModule: string;
  sourceId: string;
  sourceRef?: string;
  parties: PartyFields;
}) {
  if (!hasPartyValues(opts.parties)) return { ok: true as const };
  const res = await fetch("/api/record-parties", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sourceModule: opts.sourceModule,
      sourceId: opts.sourceId,
      sourceRef: opts.sourceRef,
      ...opts.parties,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    return { ok: false as const, message: (data.error as string) ?? "فشل حفظ بيانات الأطراف" };
  }
  return { ok: true as const };
}

export async function fetchRecordParties(sourceModule: string, sourceId: string) {
  const params = new URLSearchParams({ sourceModule, sourceId });
  const res = await fetch(`/api/record-parties?${params}`, { credentials: "include" });
  if (!res.ok) return null;
  const data = await res.json();
  return data && typeof data === "object" ? data : null;
}
