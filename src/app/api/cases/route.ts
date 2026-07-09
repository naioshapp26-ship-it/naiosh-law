import { prisma } from "@/lib/prisma";
import { jsonResponse, readJsonBody, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const cases = await prisma.case.findMany({
    orderBy: { createdAt: "desc" },
    include: { client: true, branch: true, specialization: true },
  });

  return jsonResponse(
    cases.map((c) => ({
      id: c.id,
      caseNo: c.caseNo,
      client: c.clientName,
      type: c.type,
      court: c.court,
      status: c.status,
      nextDate: c.nextDate ?? "—",
      fees: c.fees ?? "0",
      branch: c.branch?.name,
      specialization: c.specialization?.name,
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;

  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;
  const count = await prisma.case.count();
  const caseNo = String(body.caseNo ?? `#${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`);

  const created = await prisma.case.create({
    data: {
      caseNo,
      clientName: String(body.client ?? ""),
      type: String(body.type ?? "مدني"),
      court: String(body.court ?? ""),
      status: String(body.status ?? "نشطة"),
      nextDate: body.nextDate ? String(body.nextDate) : null,
      fees: body.fees != null ? String(body.fees) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  return jsonResponse({ id: created.id, caseNo: created.caseNo }, { status: 201 });
}
