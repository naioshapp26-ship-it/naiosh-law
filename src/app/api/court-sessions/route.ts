import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import { assertPageAction } from "@/lib/page-settings/page-action-auth";
import {
  ensureClientWithContact,
  mapRowWithClientContact,
  findClientContactById,
  findClientContactByName,
  type ClientContactRow,
} from "@/lib/person-contact-server";
import { canViewPersonContact } from "@/lib/person-contact";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const role = session!.role;
  const canView = canViewPersonContact(role);

  const sessions = await prisma.courtSession.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      case: {
        include: {
          client: {
            select: {
              id: true,
              name: true,
              phone: true,
              phoneDialCode: true,
              phoneSecondary: true,
              phoneSecondaryDialCode: true,
              primaryPhoneSlot: true,
              country: true,
              city: true,
              countrySecondary: true,
              citySecondary: true,
              primaryAddressSlot: true,
            },
          },
        },
      },
    },
  });

  const nameCache = new Map<string, ClientContactRow | null>();
  const base = [];
  for (const s of sessions) {
    let contact = (s.case?.client as ClientContactRow | null | undefined) ?? null;
    if (!contact && s.client) {
      if (!nameCache.has(s.client)) {
        nameCache.set(s.client, await findClientContactByName(s.client));
      }
      contact = nameCache.get(s.client) ?? null;
    }
    const linkedCaseId = s.caseId ?? s.case?.id ?? null;
    const linkedCaseNo = s.case?.caseNo ?? s.caseNo ?? null;
    base.push(
      mapRowWithClientContact(
        {
          id: s.id,
          caseId: linkedCaseId ?? "",
          caseNo: linkedCaseNo ?? "لا توجد قضية مرتبطة",
          caseLinks:
            linkedCaseId && linkedCaseNo
              ? [{ id: linkedCaseId, caseNo: linkedCaseNo }]
              : [],
          caseLinkStatus: linkedCaseId && linkedCaseNo ? "linked" : linkedCaseNo ? "review" : "none",
          client: s.client ?? "—",
          court: s.court,
          room: s.room ?? "—",
          date: s.date,
          time: s.time ?? "—",
          type: s.type,
          status: s.status,
          lawyer: s.lawyer ?? "—",
        },
        contact,
        canView ? role : null
      )
    );
  }
  return NextResponse.json(await attachCustomValuesToRows("court-sessions", base));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const gate = await assertPageAction({
    pageKey: "court-sessions",
    action: "create",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;
  const body = await request.json();

  let caseId = body.caseId ? String(body.caseId) : null;
  let caseNo = body.caseNo ? String(body.caseNo) : null;
  let client = body.client ? String(body.client) : null;
  let linkedClientId: string | null = null;

  // Prefer canonical Case by id; else resolve exact caseNo — never invent a link
  if (!caseId && caseNo) {
    const byNo = await prisma.case.findFirst({
      where: { caseNo },
      select: { id: true },
    });
    if (byNo) caseId = byNo.id;
  }

  if (!caseId) {
    return NextResponse.json(
      { error: "يجب اختيار قضية من السجل المركزي (رقم القضية إلزامي)" },
      { status: 400 }
    );
  }

  {
    const linkedCase = await prisma.case.findUnique({
      where: { id: caseId },
      include: { client: true },
    });
    if (!linkedCase) return NextResponse.json({ error: "القضية غير موجودة" }, { status: 404 });
    caseNo = linkedCase.caseNo;
    client = client ?? linkedCase.clientName;
    linkedClientId = linkedCase.clientId;
  }

  const ensured = await ensureClientWithContact({
    name: client ?? "",
    clientId: body.clientId ? String(body.clientId) : linkedClientId,
    body: body as Record<string, unknown>,
    role: session!.role,
    changedById: session!.sub,
    changedByName: session!.name ?? session!.email,
    sourceModule: "court-sessions",
    requireComplete: true,
  });
  if (!ensured.ok) {
    return NextResponse.json({ error: ensured.error }, { status: ensured.status });
  }

  const created = await prisma.courtSession.create({
    data: {
      caseId,
      caseNo,
      client: ensured.clientName,
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

  void findClientContactById;
  return NextResponse.json(
    {
      id: created.id,
      caseId: created.caseId,
      clientId: ensured.clientId,
      phone: ensured.contact.phone,
      country: ensured.contact.country,
      city: ensured.contact.city,
    },
    { status: 201 }
  );
}
