import { prisma } from "@/lib/prisma";
import { jsonResponse, readJsonBody, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const branchId = searchParams.get("branchId");

  const items = await prisma.legalSpecialization.findMany({
    where: branchId ? { branchId } : undefined,
    orderBy: { sortOrder: "asc" },
    include: { branch: true, _count: { select: { cases: true } } },
  });
  return jsonResponse(items);
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const created = await prisma.legalSpecialization.create({
    data: {
      name: String(body.name),
      branchId: body.branchId ? String(body.branchId) : null,
      description: body.description ? String(body.description) : null,
    },
  });
  return jsonResponse(created, { status: 201 });
}
