import type { FileAttachment } from "@/lib/file-upload";
import { saveRecordSupplement } from "@/lib/record-supplement-client";

export async function persistFormAttachments(opts: {
  sourceModule: string;
  sourceId: string;
  sourceRef?: string;
  title?: string;
  attachments: FileAttachment[];
  notes?: string;
}) {
  if (!opts.attachments.length) return { ok: true as const };
  return saveRecordSupplement({
    sourceModule: opts.sourceModule,
    sourceId: opts.sourceId,
    sourceRef: opts.sourceRef,
    title: opts.title,
    notes: opts.notes ?? "مرفقات من نموذج الإدخال",
    attachments: opts.attachments,
  });
}

export function extractAttachments(data: Record<string, unknown>): FileAttachment[] {
  const raw = data.attachments;
  if (!Array.isArray(raw)) return [];
  return raw as FileAttachment[];
}

export function stripAttachments(data: Record<string, unknown>) {
  const { attachments: _a, ...rest } = data;
  return rest;
}
