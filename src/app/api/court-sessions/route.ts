import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { nullableString, readJsonObject, requiredString, requireAuth, requireWrite, withApiError } from "@/lib/api-helpers";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  return withApiError(async () => {
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
  }, "List court sessions");
}

export async function POST(request: Request) {
  const { error } = await requireWrite();
  if (error) return error;
  const { body, error: bodyError } = await readJsonObject(request);
  if (bodyError) return bodyError;
  const court = requiredString(body, { field: "court", label: "المحكمة" });
  if (court.error) return court.error;
  const date = requiredString(body, { field: "date", label: "تاريخ الجلسة" });
  if (date.error) return date.error;
  const caseNo = nullableString(body.caseNo);

  return withApiError(async () => {
    const relatedCase = caseNo
      ? await prisma.case.findUnique({ where: { caseNo }, select: { id: true, clientName: true } })
      : null;

    const created = await prisma.courtSession.create({
      data: {
        caseId: relatedCase?.id,
        caseNo,
        client: nullableString(body.client) ?? relatedCase?.clientName ?? null,
        court: court.value,
        room: nullableString(body.room),
        date: date.value,
        time: nullableString(body.time),
        type: nullableString(body.type) ?? "جلسة",
        status: nullableString(body.status) ?? "مجدولة",
        lawyer: nullableString(body.lawyer),
        notes: nullableString(body.notes),
      },
    });
    return NextResponse.json({ id: created.id }, { status: 201 });
  }, "Create court session");
}
