import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const partners = await prisma.supplyChainPartner.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { shipments: true } } },
  });

  return NextResponse.json(
    partners.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      country: p.country ?? "—",
      contact: p.contactName ?? "—",
      phone: p.phone ?? "—",
      rating: p.rating,
      shipments: p._count.shipments,
      status: p.status,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.supplyChainPartner.create({
    data: {
      name: String(body.name ?? ""),
      type: String(body.type ?? "مورّد"),
      country: body.country ? String(body.country) : null,
      contactName: body.contact ? String(body.contact) : null,
      email: body.email ? String(body.email) : null,
      phone: body.phone ? String(body.phone) : null,
      rating: body.rating != null ? Number(body.rating) : 0,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
