import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const items = await prisma.personalGuarantee.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    items.map((g) => ({
      id: g.id,
      caseRef: g.caseRef,
      client: g.clientName,
      guarantor: g.guarantorName,
      relationship: g.relationship ?? "—",
      status: g.status,
      documents: g.documents ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.personalGuarantee.create({
    data: {
      caseRef: String(body.caseRef ?? ""),
      clientName: String(body.client ?? body.clientName ?? ""),
      guarantorName: String(body.guarantor ?? body.guarantorName ?? ""),
      relationship: body.relationship ? String(body.relationship) : null,
      status: String(body.status ?? "ساري"),
      documents: body.documents ? String(body.documents) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
