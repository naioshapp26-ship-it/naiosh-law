import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError, readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";

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
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  try {
    const created = await prisma.legalSpecialization.create({
      data: {
        name: String(body.name ?? ""),
        branchId: body.branchId ? String(body.branchId) : null,
        description: body.description ? String(body.description) : null,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    return handleApiError(error, "فشل إنشاء التخصص القانوني");
  }
}
