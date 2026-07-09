import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

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
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const created = await prisma.client.create({
    data: {
      name: String(body.name ?? ""),
      type: String(body.type ?? "فرد"),
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      nationalId: body.nationalId ? String(body.nationalId) : null,
      notes: body.notes ? String(body.notes) : null,
      status: String(body.status ?? "نشط"),
    },
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
