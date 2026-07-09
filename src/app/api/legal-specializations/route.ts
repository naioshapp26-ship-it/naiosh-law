import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  return withApiError(async () => {
    const items = await prisma.legalSpecialization.findMany({
      where: branchId ? { branchId } : undefined,
      orderBy: { sortOrder: "asc" },
      include: { branch: true, _count: { select: { cases: true } } },
    });
    return NextResponse.json(items);
  }, "List legal specializations");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const name = requiredString(body, { field: "name", label: "اسم التخصص" });
  if (name.error) return name.error;

  return withApiError(async () => {
    const created = await prisma.legalSpecialization.create({
      data: {
        name: name.value,
        branchId: nullableString(body.branchId),
        description: nullableString(body.description),
      },
    });
    return NextResponse.json(created, { status: 201 });
  }, "Create legal specialization");
}
