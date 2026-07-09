import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const branches = await prisma.naiochBranch.findMany({
    orderBy: [{ isHQ: "desc" }, { name: "asc" }],
    include: { _count: { select: { alerts: true } } },
  });

  return NextResponse.json(
    branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      country: b.country,
      city: b.city ?? "—",
      manager: b.managerName ?? "—",
      phone: b.phone ?? "—",
      isHQ: b.isHQ ? "المقر" : "فرع",
      alerts: b._count.alerts,
      status: b.status,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.naiochBranch.create({
    data: {
      name: String(body.name ?? ""),
      code: String(body.code ?? "").toUpperCase(),
      country: String(body.country ?? ""),
      city: body.city ? String(body.city) : null,
      managerName: body.manager ? String(body.manager) : null,
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      isHQ: Boolean(body.isHQ),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
