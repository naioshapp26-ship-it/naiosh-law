import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  return withApiError(async () => {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { cases: true } } },
    });
    return NextResponse.json(
      clients.map((c) => ({
        id: c.id,
        name: c.name,
        type: c.type,
        phone: c.phone ?? "—",
        email: c.email ?? "—",
        cases: String(c._count.cases),
        status: c.status,
        since: c.since.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }),
      }))
    );
  }, "List clients");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const name = requiredString(body, { field: "name", label: "اسم الموكل" });
  if (name.error) return name.error;

  return withApiError(async () => {
    const created = await prisma.client.create({
      data: {
        name: name.value,
        type: nullableString(body.type) ?? "فرد",
        phone: nullableString(body.phone),
        email: nullableString(body.email),
        nationalId: nullableString(body.nationalId),
        notes: nullableString(body.notes),
        status: nullableString(body.status) ?? "نشط",
      },
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  }, "Create client");
}
