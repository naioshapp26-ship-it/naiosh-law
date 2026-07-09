import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const branches = await prisma.officeBranch.findMany({
    orderBy: [{ isMain: "desc" }, { name: "asc" }],
    include: { _count: { select: { users: true, integrations: true } } },
  });

  return NextResponse.json(
    branches.map((b) => ({
      id: b.id,
      name: b.name,
      code: b.code,
      city: b.city ?? "—",
      phone: b.phone ?? "—",
      email: b.email ?? "—",
      manager: b.managerName ?? "—",
      status: b.status,
      isMain: b.isMain ? "رئيسي" : "فرع",
      users: b._count.users,
      integrations: b._count.integrations,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.officeBranch.create({
    data: {
      name: String(body.name ?? ""),
      code: String(body.code ?? "").toUpperCase(),
      city: body.city ? String(body.city) : null,
      address: body.address ? String(body.address) : null,
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      managerName: body.manager ? String(body.manager) : null,
      status: String(body.status ?? "نشط"),
      isMain: Boolean(body.isMain),
    },
  });
  return NextResponse.json(created, { status: 201 });
}
