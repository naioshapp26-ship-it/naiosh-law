import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { getSessionFromCookies } from "@/lib/auth";
import { formatDate } from "@/lib/format";

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
      date: formatDate(n.createdAt, { month: "numeric", day: "numeric", year: "numeric" }),
    }))
  );
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const created = await prisma.professionalNetwork.create({
    data: {
      requesterId: session!.sub,
      receiverId: String(body.receiverId),
      type: body.type ?? "collaboration",
      caseRef: body.caseRef ? String(body.caseRef) : null,
      message: body.message ? String(body.message) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
