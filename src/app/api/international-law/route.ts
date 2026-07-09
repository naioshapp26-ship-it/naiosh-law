import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const matters = await prisma.internationalLawMatter.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    matters.map((m) => ({
      id: m.id,
      refNo: m.refNo,
      title: m.title,
      jurisdiction: m.jurisdiction ?? "—",
      treaty: m.treaty ?? "—",
      client: m.clientName ?? "—",
      type: m.matterType ?? "—",
      status: m.status,
      openedDate: m.openedDate ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.internationalLawMatter.count();
  const refNo = `INT-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const created = await prisma.internationalLawMatter.create({
    data: {
      refNo,
      title: String(body.title ?? ""),
      jurisdiction: body.jurisdiction ? String(body.jurisdiction) : null,
      treaty: body.treaty ? String(body.treaty) : null,
      clientName: body.client ? String(body.client) : null,
      matterType: body.type ? String(body.type) : null,
      openedDate: body.openedDate ? String(body.openedDate) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
