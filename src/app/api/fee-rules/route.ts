import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const rules = await prisma.feeRule.findMany({
    orderBy: { createdAt: "desc" },
    include: { specialization: true },
  });

  return NextResponse.json(
    rules.map((r) => ({
      id: r.id,
      name: r.name,
      caseType: r.caseType ?? "—",
      specialization: r.specialization?.name ?? "—",
      stage: r.stage ?? "—",
      hourlyRate: r.hourlyRate ?? 0,
      fixedAmount: r.fixedAmount ?? 0,
      percentRate: r.percentRate ?? 0,
      active: r.active ? "نشط" : "موقوف",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.feeRule.create({
    data: {
      name: String(body.name),
      caseType: body.caseType ? String(body.caseType) : null,
      specializationId: body.specializationId ? String(body.specializationId) : null,
      stage: body.stage ? String(body.stage) : null,
      hourlyRate: body.hourlyRate != null ? Number(body.hourlyRate) : null,
      fixedAmount: body.fixedAmount != null ? Number(body.fixedAmount) : null,
      percentRate: body.percentRate != null ? Number(body.percentRate) : null,
      minAmount: body.minAmount != null ? Number(body.minAmount) : null,
      maxAmount: body.maxAmount != null ? Number(body.maxAmount) : null,
      description: body.description ? String(body.description) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
