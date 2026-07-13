import type { ArchiveAttachment } from "@/lib/archive-types";
import type { ArchiveRecord } from "@/generated/prisma/client";

export function parseAttachments(raw: string | null | undefined): ArchiveAttachment[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function parseRecordData(raw: string | null | undefined): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function mapArchiveRecord(row: ArchiveRecord) {
  return {
    id: row.id,
    refNo: row.refNo,
    title: row.title,
    description: row.description ?? "",
    sourceModule: row.sourceModule,
    sourceModuleLabel: row.sourceModuleLabel ?? row.sourceModule,
    sourceId: row.sourceId ?? "",
    sourceRef: row.sourceRef ?? "—",
    recordData: parseRecordData(row.recordData),
    category: row.category ?? "—",
    tags: row.tags ?? "",
    status: row.status,
    archivedBy: row.archivedBy ?? "—",
    notes: row.notes ?? "",
    attachments: parseAttachments(row.attachments),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
