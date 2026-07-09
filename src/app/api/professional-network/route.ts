import { prisma } from "@/lib/prisma";
import { jsonResponse, readJsonBody, requireAuth, requireWrite } from "@/lib/api-helpers";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const items = await prisma.professionalNetwork.findMany({
    where: {
      OR: [{ requesterId: session!.sub }, { receiverId: session!.sub }],
    },
    orderBy: { createdAt: "desc" },
    include: { requester: true, receiver: true },
  });

  return jsonResponse(
    items.map((n) => ({
      id: n.id,
      type: n.type,
      status: n.status,
      caseRef: n.caseRef ?? "—",
      message: n.message ?? "",
      from: n.requester.name,
      to: n.receiver.name,
      date: n.createdAt.toLocaleDateString("ar-EG"),
    }))
  );
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const parsed = await readJsonBody<Record<string, unknown>>(request);
  if (!parsed.ok) return parsed.response;
  const body = parsed.data;

  const created = await prisma.professionalNetwork.create({
    data: {
      requesterId: session!.sub,
      receiverId: String(body.receiverId),
      type: body.type ?? "collaboration",
      caseRef: body.caseRef ? String(body.caseRef) : null,
      message: body.message ? String(body.message) : null,
    },
  });
  return jsonResponse(created, { status: 201 });
}
