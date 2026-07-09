import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";
import type { ProfessionalType } from "@/generated/prisma/client";

const professionalTypes: ProfessionalType[] = ["lawyer", "consultant", "judge"];

function normalizeProfessionalType(value: unknown): ProfessionalType {
  const type = String(value ?? "lawyer") as ProfessionalType;
  return professionalTypes.includes(type) ? type : "lawyer";
}

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  return withApiError(async () => {
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
  }, "List professionals");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const name = requiredString(body, { field: "name", label: "اسم المحترف" });
  if (name.error) return name.error;

  return withApiError(async () => {
    const created = await prisma.professional.create({
      data: {
        name: name.value,
        type: normalizeProfessionalType(body.type),
        licenseNo: nullableString(body.licenseNo),
        phone: nullableString(body.phone),
        email: nullableString(body.email),
        status: nullableString(body.status) ?? "نشط",
        bio: nullableString(body.bio),
      },
    });
    return NextResponse.json(created, { status: 201 });
  }, "Create professional");
}
