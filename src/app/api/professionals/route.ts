import { prisma } from "@/lib/prisma";
import { jsonResponse, readJsonBody, requireAuth, requireWrite } from "@/lib/api-helpers";
import type { ProfessionalType } from "@/generated/prisma/client";

const professionalTypes = new Set<ProfessionalType>(["lawyer", "consultant", "judge"]);

function parseProfessionalType(value: unknown): ProfessionalType {
  return typeof value === "string" && professionalTypes.has(value as ProfessionalType)
    ? (value as ProfessionalType)
    : "lawyer";
}

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

  return jsonResponse(
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
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.professional.create({
    data: {
      name: String(body.name),
      type: parseProfessionalType(body.type),
      licenseNo: body.licenseNo ? String(body.licenseNo) : null,
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      status: String(body.status ?? "نشط"),
      bio: body.bio ? String(body.bio) : null,
    },
  });
  return jsonResponse(created, { status: 201 });
}
