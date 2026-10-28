import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { parseDialCodeOption } from "@/lib/person-contact";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const entityId = searchParams.get("entityId");

  const officials = await prisma.courtOfficial.findMany({
    where: entityId ? { entityId } : undefined,
    orderBy: { createdAt: "desc" },
    include: { entity: true },
  });

  return NextResponse.json(officials);
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.courtOfficial.create({
    data: {
      name: String(body.name ?? ""),
      role: String(body.role ?? "مسؤول"),
      entityId: body.entityId ? String(body.entityId) : null,
      court: body.court ? String(body.court) : null,
      chamber: body.chamber ? String(body.chamber) : null,
      phone: body.phone ? String(body.phone) : null,
      phoneDialCode: body.phoneDialCode ? parseDialCodeOption(String(body.phoneDialCode)) : null,
      phoneSecondary: body.phoneSecondary ? String(body.phoneSecondary) : null,
      phoneSecondaryDialCode: body.phoneSecondaryDialCode
        ? parseDialCodeOption(String(body.phoneSecondaryDialCode))
        : null,
      country: body.country ? String(body.country) : null,
      city: body.city ? String(body.city) : null,
      status: String(body.status ?? "نشط"),
    },
    include: { entity: true },
  });

  return NextResponse.json(created, { status: 201 });
}
