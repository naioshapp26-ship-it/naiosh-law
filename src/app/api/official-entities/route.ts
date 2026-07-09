import { prisma } from "@/lib/prisma";
import { jsonResponse, readJsonBody, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const entities = await prisma.officialEntity.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { officials: true } } },
  });

  return jsonResponse(
    entities.map((e) => ({
      id: e.id,
      name: e.name,
      type: e.type,
      city: e.city ?? "—",
      phone: e.phone ?? "—",
      email: e.email ?? "—",
      officials: e._count.officials,
      status: e.status,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.officialEntity.create({
    data: {
      name: String(body.name),
      type: String(body.type ?? "جهة حكومية"),
      city: body.city ? String(body.city) : null,
      address: body.address ? String(body.address) : null,
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
    },
  });
  return jsonResponse(created, { status: 201 });
}
