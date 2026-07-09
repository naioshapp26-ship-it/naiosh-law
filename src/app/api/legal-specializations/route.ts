import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite, parseJsonBody } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  const items = await prisma.legalSpecialization.findMany({
    where: branchId ? { branchId } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { branch: true, _count: { select: { cases: true } } },
  });
  return NextResponse.json(items);
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
  const created = await prisma.legalSpecialization.create({
    data: {
      name: String(body.name),
      branchId: body.branchId ? String(body.branchId) : null,
      description: body.description ? String(body.description) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
