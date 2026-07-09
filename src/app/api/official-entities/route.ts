import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  return withApiError(async () => {
    const entities = await prisma.officialEntity.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { officials: true } } },
    });

    return NextResponse.json(
      entities.map((e) => ({
        id: e.id,
        name: e.name,
        type: e.type,
        city: e.city ?? "—",
        phone: e.phone ?? "—",
        email: e.email ?? "—",
        officials: e._count.officials,
        status: e.status,
      }))
    );
  }, "List official entities");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const name = requiredString(body, { field: "name", label: "اسم الجهة" });
  if (name.error) return name.error;

  return withApiError(async () => {
    const created = await prisma.officialEntity.create({
      data: {
        name: name.value,
        type: nullableString(body.type) ?? "جهة حكومية",
        city: nullableString(body.city),
        address: nullableString(body.address),
        phone: nullableString(body.phone),
        email: nullableString(body.email),
      },
    });
    return NextResponse.json(created, { status: 201 });
  }, "Create official entity");
}
