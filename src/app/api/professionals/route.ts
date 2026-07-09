import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const professionals = await prisma.professional.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      specializations: { include: { specialization: true } },
      courtOfficial: true,
    },
  });

  return NextResponse.json(
    professionals.map((p) => ({
      id: p.id,
      name: p.name,
      type: p.type,
      licenseNo: p.licenseNo ?? "—",
      phone: p.phone ?? "—",
      email: p.email ?? "—",
      rating: p.rating.toFixed(1),
      status: p.status,
      specializations: p.specializations.map((s) => s.specialization.name).join("، "),
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.professional.create({
    data: {
      name: String(body.name),
      type: body.type ?? "lawyer",
      licenseNo: body.licenseNo ? String(body.licenseNo) : null,
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      status: String(body.status ?? "نشط"),
      bio: body.bio ? String(body.bio) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
