import type { FileAttachment } from "@/lib/file-upload";
import { ACCEPTED_FILE_TYPES as FILE_TYPES, MAX_FILE_BYTES } from "@/lib/file-upload";

export type ArchiveAttachment = FileAttachment;

export type ArchiveRecordDto = {
  id: string;
  refNo: string;
  title: string;
  description: string;
  sourceModule: string;
  sourceModuleLabel: string;
  sourceId: string;
  sourceRef: string;
  recordData: Record<string, unknown>;
  category: string;
  tags: string;
  status: string;
  archivedBy: string;
  notes: string;
  attachments: ArchiveAttachment[];
  createdAt: string;
  updatedAt: string;
};

export type ArchiveFromRecordPayload = {
  sourceModule: string;
  sourceModuleLabel: string;
  sourceId: string;
  title: string;
  sourceRef?: string;
  recordData: Record<string, unknown>;
  category?: string;
  notes?: string;
};

export const MODULE_LABELS: Record<string, string> = {
  "legal-classification": "القوانين الدولية والتصنيف",
  "case-management": "إدارة القضايا",
  "clients-management": "إدارة الموكلين",
  "court-sessions": "الجلسات والمتابعات",
  "legal-accounting": "المحاسبة القانونية",
  "notifications-center": "مركز الإشعارات",
  integrations: "التكاملات",
  archive: "الأرشيف",
};

export const ACCEPTED_FILE_TYPES = FILE_TYPES;
export const MAX_ATTACHMENT_BYTES = MAX_FILE_BYTES;
