import { prisma } from "@/lib/prisma";
import { jsonResponse, readJsonBody, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  return jsonResponse(
    clients.map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      phone: c.phone ?? "—",
      email: c.email ?? "—",
      cases: String(c.casesCount),
      status: c.status,
      since: c.since.toLocaleDateString("ar-EG", { year: "numeric", month: "long", day: "numeric" }),
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const created = await prisma.client.create({
    data: {
      name: String(body.name ?? ""),
      type: String(body.type ?? "فرد"),
      phone: body.phone ? String(body.phone) : null,
      email: body.email ? String(body.email) : null,
      status: String(body.status ?? "نشط"),
    },
  });
  return jsonResponse({ id: created.id }, { status: 201 });
}
