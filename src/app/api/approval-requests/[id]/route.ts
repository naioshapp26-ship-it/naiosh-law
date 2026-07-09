import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApprover } from "@/lib/api-helpers";
import { logAudit } from "@/lib/governance";
import type { ApprovalStatus } from "@/generated/prisma/client";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireApprover();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const status = body.status as ApprovalStatus;
  if (!["approved", "rejected"].includes(status)) {
    return NextResponse.json({ error: "الحالة يجب أن تكون approved أو rejected" }, { status: 400 });
  }

  const updated = await prisma.approvalRequest.update({
    where: { id },
    data: {
      status,
      approverId: session!.sub,
      notes: body.notes ? String(body.notes) : undefined,
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
}
