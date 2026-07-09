import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite, parseJsonBody } from "@/lib/api-helpers";
import type { NetworkRequestType } from "@/generated/prisma/client";

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

  return NextResponse.json(
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
  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const created = await prisma.professionalNetwork.create({
    data: {
      requesterId: session!.sub,
      receiverId: String(body.receiverId),
      type: (body.type ? String(body.type) : "collaboration") as NetworkRequestType,
      caseRef: body.caseRef ? String(body.caseRef) : null,
      message: body.message ? String(body.message) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
