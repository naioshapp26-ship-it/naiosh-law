import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { generateRefNo, labelApprovalStatus, labelApprovalType, logAudit } from "@/lib/governance";
import type { ApprovalType } from "@/generated/prisma/client";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const items = await prisma.approvalRequest.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      requester: { select: { name: true } },
      approver: { select: { name: true } },
    },
  });

  return NextResponse.json(
    items.map((a) => ({
      id: a.id,
      refNo: a.refNo,
      type: labelApprovalType(a.type),
      title: a.title,
      requester: a.requester.name,
      approver: a.approver?.name ?? "—",
      priority: a.priority,
      status: labelApprovalStatus(a.status),
      statusRaw: a.status,
      requestedAt: a.requestedAt,
      resolvedAt: a.resolvedAt ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.approvalRequest.count();
  const refNo = generateRefNo("APR", count + 1);

  const created = await prisma.approvalRequest.create({
    data: {
      refNo,
      type: (body.type as ApprovalType) ?? "other",
      title: String(body.title ?? ""),
      description: body.description ? String(body.description) : null,
      requesterId: session!.sub,
      entity: body.entity ? String(body.entity) : null,
      entityId: body.entityId ? String(body.entityId) : null,
      priority: String(body.priority ?? "متوسط"),
      requestedAt: new Date().toISOString().slice(0, 10),
    },
  });

  await logAudit({
    userId: session!.sub,
    action: "create_approval",
    entity: "approval",
    entityId: created.id,
    details: `طلب اعتماد: ${created.title}`,
  });

  return NextResponse.json(created, { status: 201 });
}
