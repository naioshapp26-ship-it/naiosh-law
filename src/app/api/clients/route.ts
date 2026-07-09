import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite, parseJsonBody } from "@/lib/api-helpers";

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
      cases: String(c.casesCount),
      status: c.status,
      since: c.since.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }),
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;
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
