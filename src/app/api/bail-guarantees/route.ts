import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const items = await prisma.bailGuarantee.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    items.map((b) => ({
      id: b.id,
      caseRef: b.caseRef,
      client: b.clientName,
      amount: String(b.amount),
      court: b.court,
      status: b.status,
      depositDate: b.depositDate,
      refundDate: b.refundDate ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.bailGuarantee.create({
    data: {
      caseRef: String(body.caseRef ?? ""),
      clientName: String(body.client ?? body.clientName ?? ""),
      amount: Number(body.amount ?? 0),
      court: String(body.court ?? ""),
      status: String(body.status ?? "نشط"),
      depositDate: String(body.depositDate ?? ""),
      refundDate: body.refundDate ? String(body.refundDate) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
