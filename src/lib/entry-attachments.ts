import type { FileAttachment } from "@/lib/file-upload";
import { parseAttachments } from "@/lib/file-upload";

export function serializeAttachments(attachments: unknown): string | null {
  const list = parseAttachments(attachments);
  return list.length ? JSON.stringify(list) : null;
}

export function mergeAttachments(existing: string | null | undefined, incoming: unknown): string | null {
  const current = parseAttachments(existing);
  const added = parseAttachments(incoming);
  if (!added.length) return current.length ? JSON.stringify(current) : null;
  const merged = [...current, ...added];
  return JSON.stringify(merged);
}

export function mapEntryAttachments(raw: string | null | undefined): FileAttachment[] {
  return parseAttachments(raw);
}
