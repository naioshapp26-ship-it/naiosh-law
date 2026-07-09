import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const shipments = await prisma.supplyChainShipment.findMany({
    orderBy: { createdAt: "desc" },
    include: { partner: true },
  });

  return NextResponse.json(
    shipments.map((s) => ({
      id: s.id,
      refNo: s.refNo,
      partner: s.partner?.name ?? "—",
      caseRef: s.caseRef ?? "—",
      description: s.description ?? "—",
      origin: s.origin ?? "—",
      destination: s.destination ?? "—",
      status: s.status,
      shipDate: s.shipDate ?? "—",
      eta: s.eta ?? "—",
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.supplyChainShipment.count();
  const refNo = `SHP-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const created = await prisma.supplyChainShipment.create({
    data: {
      refNo,
      partnerId: body.partnerId ? String(body.partnerId) : null,
      caseRef: body.caseRef ? String(body.caseRef) : null,
      description: body.description ? String(body.description) : null,
      origin: body.origin ? String(body.origin) : null,
      destination: body.destination ? String(body.destination) : null,
      status: String(body.status ?? "قيد الشحن"),
      shipDate: body.shipDate ? String(body.shipDate) : null,
      eta: body.eta ? String(body.eta) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
