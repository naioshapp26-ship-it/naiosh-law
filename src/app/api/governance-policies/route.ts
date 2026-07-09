import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, prismaErrorResponse, readJsonObject, requireAuth, requireApprover } from "@/lib/api-helpers";
import { logAudit } from "@/lib/governance";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const policies = await prisma.governancePolicy.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json(
      policies.map((p) => ({
        id: p.id,
        title: p.title,
        category: p.category,
        description: p.description ?? "",
        version: p.version,
        status: p.status,
        effectiveDate: p.effectiveDate ?? "—",
      }))
    );
  } catch (error) {
    return prismaErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireApprover();
  if (error) return error;
  const { data: body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const title = String(body!.title ?? "").trim();
  if (!title) return jsonError("عنوان السياسة مطلوب", 400);

  try {
    const created = await prisma.governancePolicy.create({
      data: {
        title,
        category: String(body!.category ?? "عام"),
        description: body!.description ? String(body!.description) : null,
        version: String(body!.version ?? "1.0"),
        status: String(body!.status ?? "ساري"),
        effectiveDate: body!.effectiveDate ? String(body!.effectiveDate) : null,
      },
    });

    await logAudit({
      userId: session!.sub,
      action: "create_policy",
      entity: "governance_policy",
      entityId: created.id,
      details: created.title,
    });

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return prismaErrorResponse(error);
  }
}
