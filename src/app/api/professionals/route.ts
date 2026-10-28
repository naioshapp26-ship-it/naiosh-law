import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { parseDialCodeOption, UNSPECIFIED_CONTACT } from "@/lib/person-contact";

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
      phone: p.phone ?? "",
      phoneDialCode: p.phoneDialCode ?? "",
      phoneSecondary: p.phoneSecondary ?? "",
      phoneSecondaryDialCode: p.phoneSecondaryDialCode ?? "",
      country: p.country ?? "",
      city: p.city ?? "",
      phoneDisplay: p.phone
        ? `${p.phoneDialCode ? p.phoneDialCode + " " : ""}${p.phone}`
        : UNSPECIFIED_CONTACT,
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
      phoneDialCode: body.phoneDialCode ? parseDialCodeOption(String(body.phoneDialCode)) : null,
      phoneSecondary: body.phoneSecondary ? String(body.phoneSecondary) : null,
      phoneSecondaryDialCode: body.phoneSecondaryDialCode
        ? parseDialCodeOption(String(body.phoneSecondaryDialCode))
        : null,
      country: body.country ? String(body.country) : null,
      city: body.city ? String(body.city) : null,
      email: body.email ? String(body.email) : null,
      status: String(body.status ?? "نشط"),
      bio: body.bio ? String(body.bio) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
