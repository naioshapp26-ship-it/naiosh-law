import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { prismaErrorResponse, readJsonObject, requireApprover } from "@/lib/api-helpers";
import { logAudit } from "@/lib/governance";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireApprover();
  if (error) return error;
  const { id } = await params;
  const { data: body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  try {
    const updated = await prisma.governancePolicy.update({
      where: { id },
      data: {
        title: body!.title !== undefined ? String(body!.title) : undefined,
        category: body!.category !== undefined ? String(body!.category) : undefined,
        description: body!.description !== undefined ? String(body!.description) : undefined,
        version: body!.version !== undefined ? String(body!.version) : undefined,
        status: body!.status !== undefined ? String(body!.status) : undefined,
        effectiveDate: body!.effectiveDate !== undefined ? String(body!.effectiveDate) : undefined,
      },
    });

    await logAudit({
      userId: session!.sub,
      action: "update_policy",
      entity: "governance_policy",
      entityId: id,
      details: updated.title,
    });

    return NextResponse.json(updated);
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error, session } = await requireApprover();
  if (error) return error;
  const { id } = await params;
  try {
    const deleted = await prisma.governancePolicy.delete({ where: { id } });
    await logAudit({
      userId: session!.sub,
      action: "delete_policy",
      entity: "governance_policy",
      entityId: id,
      details: deleted.title,
      severity: "warning",
    });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
