import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const sessions = await prisma.courtSession.findMany({ orderBy: { createdAt: "desc" } });
  const base = sessions.map((s) => ({
    id: s.id,
    caseNo: s.caseNo ?? "—",
    client: s.client ?? "—",
    court: s.court,
    room: s.room ?? "—",
    date: s.date,
    time: s.time ?? "—",
    type: s.type,
    status: s.status,
    lawyer: s.lawyer ?? "—",
  }));
  return NextResponse.json(await attachCustomValuesToRows("court-sessions", base));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const caseId = body.caseId ? String(body.caseId) : null;
  let caseNo = body.caseNo ? String(body.caseNo) : null;
  let client = body.client ? String(body.client) : null;
  if (caseId) {
    const linkedCase = await prisma.case.findUnique({ where: { id: caseId } });
    if (!linkedCase) return NextResponse.json({ error: "القضية غير موجودة" }, { status: 404 });
    caseNo = caseNo ?? linkedCase.caseNo;
    client = client ?? linkedCase.clientName;
  }

  const created = await prisma.courtSession.create({
    data: {
      caseId,
      caseNo,
      client,
      court: String(body.court ?? ""),
      room: body.room ? String(body.room) : null,
      date: String(body.date ?? ""),
      time: body.time ? String(body.time) : null,
      type: String(body.type ?? "جلسة"),
      status: String(body.status ?? "مجدولة"),
      lawyer: body.lawyer ? String(body.lawyer) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "court-sessions",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json({ id: created.id, caseId: created.caseId }, { status: 201 });
}
