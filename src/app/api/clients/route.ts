import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { formatDate, formatNumber } from "@/lib/format";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    clients.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      phone: c.phone ?? "—",
      email: c.email ?? "—",
      cases: formatNumber(c.casesCount, { maximumFractionDigits: 0 }),
      status: c.status,
      since: formatDate(c.since),
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const body = await request.json();
  const created = await prisma.client.create({
    data: {
      name: String(body.name ?? ""),
      type: String(body.type ?? "فرد"),
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      status: String(body.status ?? "نشط"),
    },
  });
  return NextResponse.json({ id: created.id }, { status: 201 });
}
