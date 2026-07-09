import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, prismaErrorResponse, readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";
import { generateRefNo, labelApprovalStatus, labelApprovalType, logAudit } from "@/lib/governance";
import type { ApprovalType } from "@/generated/prisma/client";

const approvalTypes = ["case_opening", "fee_waiver", "document_release", "user_access", "contract_signing", "other"] as const;
const approverRoles = new Set(["admin", "industrial_agent"]);

async function nextApprovalRefNo() {
  const year = new Date().getFullYear();
  const prefix = `APR-${year}-`;
  const latest = await prisma.approvalRequest.findFirst({
    where: { refNo: { startsWith: prefix } },
    orderBy: { refNo: "desc" },
    select: { refNo: true },
  });
  const latestSeq = latest ? Number.parseInt(latest.refNo.slice(prefix.length), 10) : 0;
  return generateRefNo("APR", Number.isFinite(latestSeq) ? latestSeq + 1 : 1);
}

async function createApprovalWithRef(data: {
  type: ApprovalType;
  title: string;
  description: string | null;
  requesterId: string;
  entity: string | null;
  entityId: string | null;
  priority: string;
  requestedAt: string;
}) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await prisma.approvalRequest.create({
        data: {
          ...data,
          refNo: await nextApprovalRefNo(),
        },
      });
    } catch (error) {
      if (typeof error === "object" && error && "code" in error && (error as { code?: string }).code === "P2002") {
        continue;
      }
      throw error;
    }
  }
  throw new Error("Unable to allocate approval reference");
}

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  try {
    const items = await prisma.approvalRequest.findMany({
      where: approverRoles.has(session!.role)
        ? undefined
        : {
            OR: [{ requesterId: session!.sub }, { approverId: session!.sub }],
          },
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
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { data: body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const title = String(body!.title ?? "").trim();
  if (!title) return jsonError("عنوان طلب الاعتماد مطلوب", 400);

  const type = body!.type === undefined ? "other" : String(body!.type);
  if (!approvalTypes.includes(type as ApprovalType)) {
    return jsonError("نوع طلب الاعتماد غير صحيح", 400);
  }

  try {
    const created = await createApprovalWithRef({
      type: type as ApprovalType,
      title,
      description: body!.description ? String(body!.description) : null,
      requesterId: session!.sub,
      entity: body!.entity ? String(body!.entity) : null,
      entityId: body!.entityId ? String(body!.entityId) : null,
      priority: String(body!.priority ?? "متوسط"),
      requestedAt: new Date().toISOString().slice(0, 10),
    });

    await logAudit({
      userId: session!.sub,
      action: "create_approval",
      entity: "approval",
      entityId: created.id,
      details: `طلب اعتماد: ${created.title}`,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
