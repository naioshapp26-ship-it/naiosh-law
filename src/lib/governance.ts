import { prisma } from "@/lib/prisma";
import { createHash } from "crypto";

export async function logAudit(input: {
  userId?: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  severity?: string;
  ipAddress?: string;
}) {
  return prisma.auditLog.create({
    data: {
      userId: input.userId,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      details: input.details,
      severity: input.severity ?? "info",
      ipAddress: input.ipAddress,
    },
  });
}

export function generateSignatureHash(documentRef: string, signerName: string, signedAt: string) {
  return createHash("sha256").update(`${documentRef}:${signerName}:${signedAt}`).digest("hex").slice(0, 32);
}

export function generateRefNo(prefix: string, seq: number) {
  const year = new Date().getFullYear();
  return `${prefix}-${year}-${String(seq).padStart(4, "0")}`;
}

const approvalTypeLabels: Record<string, string> = {
  case_opening: "فتح قضية",
  fee_waiver: "إعفاء رسوم",
  document_release: "إصدار مستند",
  user_access: "صلاحية مستخدم",
  contract_signing: "توقيع عقد",
  other: "أخرى",
};

const approvalStatusLabels: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "معتمد",
  rejected: "مرفوض",
};

const signatureStatusLabels: Record<string, string> = {
  pending: "بانتظار التوقيع",
  signed: "موقّع",
  rejected: "مرفوض",
  expired: "منتهي",
};

export function labelApprovalType(type: string) {
  return approvalTypeLabels[type] ?? type;
}

export function labelApprovalStatus(status: string) {
  return approvalStatusLabels[status] ?? status;
}

export function labelSignatureStatus(status: string) {
  return signatureStatusLabels[status] ?? status;
}
