import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { jsonError, readJsonObject, requireAuth, requireWrite } from "@/lib/api-helpers";
import type { NetworkRequestType } from "@/generated/prisma/client";

const networkRequestTypes: NetworkRequestType[] = ["collaboration", "case_referral", "opinion_request"];

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
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;

  const receiverId = String(body.receiverId ?? "");
  const receiver = receiverId
    ? await prisma.user.findUnique({ where: { id: receiverId }, select: { id: true } })
    : null;
  if (!receiver) {
    return jsonError("المستلم غير موجود", 400);
  }
  const type = networkRequestTypes.includes(String(body.type) as NetworkRequestType)
    ? (String(body.type) as NetworkRequestType)
    : "collaboration";

  const created = await prisma.professionalNetwork.create({
    data: {
      requesterId: session!.sub,
      receiverId: receiver.id,
      type,
      caseRef: body.caseRef ? String(body.caseRef) : null,
      message: body.message ? String(body.message) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
