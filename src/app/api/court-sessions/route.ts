import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite, parseJsonBody } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const sessions = await prisma.courtSession.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(
    sessions.map((s) => ({
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
    }))
  );
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const parsed = await parseJsonBody(request);
  if (parsed.error) return parsed.error;
  const body = parsed.body;

  const created = await prisma.courtSession.create({
    data: {
      caseNo: body.caseNo ? String(body.caseNo) : null,
      client: body.client ? String(body.client) : null,
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
  return NextResponse.json({ id: created.id }, { status: 201 });
}
