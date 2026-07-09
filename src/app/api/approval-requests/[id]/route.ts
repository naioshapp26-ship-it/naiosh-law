import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, prismaErrorResponse, readJsonObject, requireApprover } from "@/lib/api-helpers";
import { logAudit } from "@/lib/governance";
import type { ApprovalStatus } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireApprover();
  if (error) return error;
  const { id } = await params;
  const { data: body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const status = body!.status as ApprovalStatus;
  if (!["approved", "rejected"].includes(status)) {
    return jsonError("الحالة يجب أن تكون approved أو rejected", 400);
  }

  try {
    const existing = await prisma.approvalRequest.findUnique({ where: { id } });
    if (!existing) return jsonError("طلب الاعتماد غير موجود", 404);
    if (existing.status !== "pending") return jsonError("تمت معالجة هذا الطلب مسبقاً", 400);
    if (existing.requesterId === session!.sub) return jsonError("لا يمكن اعتماد طلب قمت بإنشائه", 403);

    const updated = await prisma.approvalRequest.update({
      where: { id },
      data: {
        status,
        approverId: session!.sub,
        notes: body!.notes ? String(body!.notes) : undefined,
        resolvedAt: new Date().toISOString().slice(0, 10),
      },
    });

    await logAudit({
      userId: session!.sub,
      action: status === "approved" ? "approve_request" : "reject_request",
      entity: "approval",
      entityId: id,
      details: `${updated.refNo}: ${updated.title}`,
      severity: status === "approved" ? "info" : "warning",
    });

    return NextResponse.json(updated);
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
