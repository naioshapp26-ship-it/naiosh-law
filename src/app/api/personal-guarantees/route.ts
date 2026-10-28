import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  ensureClientWithContact,
  findClientContactByName,
  mapRowWithClientContact,
} from "@/lib/person-contact-server";
import { canViewPersonContact, UNSPECIFIED_CONTACT } from "@/lib/person-contact";
import { displayResolvedCase } from "@/lib/case-identity";
import { resolveCaseById, resolveCaseRef } from "@/lib/case-identity-server";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;
  const canView = canViewPersonContact(session!.role);

  const items = await prisma.personalGuarantee.findMany({ orderBy: { createdAt: "desc" } });
  const nameCache = new Map<string, Awaited<ReturnType<typeof findClientContactByName>>>();
  const out = [];
  for (const g of items) {
    if (!nameCache.has(g.clientName)) {
      nameCache.set(g.clientName, await findClientContactByName(g.clientName));
    }
    if (g.guarantorName && !nameCache.has(g.guarantorName)) {
      nameCache.set(g.guarantorName, await findClientContactByName(g.guarantorName));
    }
    const clientContact = nameCache.get(g.clientName) ?? null;
    const guarantorContact = g.guarantorName ? nameCache.get(g.guarantorName) ?? null : null;
    const resolved = await resolveCaseRef(g.caseRef);
    const caseDisplay = displayResolvedCase(resolved);
    const mapped = mapRowWithClientContact(
      {
        id: g.id,
        caseRef: g.caseRef,
        caseNo: caseDisplay.caseNo,
        caseId: caseDisplay.caseId ?? "",
        caseLinks: caseDisplay.caseLinks,
        caseLinkStatus: caseDisplay.caseLinkStatus,
        client: g.clientName,
        guarantor: g.guarantorName,
        relationship: g.relationship ?? "—",
        status: g.status,
        documents: g.documents ?? "—",
        notes: g.notes ?? "",
        guarantorPhone: canView ? guarantorContact?.phone ?? "" : "",
        guarantorCountry: guarantorContact?.country || UNSPECIFIED_CONTACT,
        guarantorCity: guarantorContact?.city || UNSPECIFIED_CONTACT,
        guarantorPhoneDialCode: canView ? guarantorContact?.phoneDialCode ?? "" : "",
        guarantorPhoneSecondary: canView ? guarantorContact?.phoneSecondary ?? "" : "",
        guarantorPhoneSecondaryDialCode: canView
          ? guarantorContact?.phoneSecondaryDialCode ?? ""
          : "",
      },
      clientContact,
      canView ? session!.role : null
    );
    out.push(mapped);
  }
  return NextResponse.json(out);
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const clientNameIn = String(body.client ?? body.clientName ?? "").trim();
  const guarantorIn = String(body.guarantor ?? body.guarantorName ?? "").trim();
  let clientName = clientNameIn;
  let guarantorName = guarantorIn;

  if (clientNameIn || body.phone || body.country || body.city) {
    const ensured = await ensureClientWithContact({
      name: clientNameIn || "موكل ضمان",
      clientId: body.clientId ? String(body.clientId) : null,
      body,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "personal-guarantees",
      requireComplete: Boolean(body.phone || body.country || body.city),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
    clientName = ensured.clientName;
  }

  if (guarantorIn) {
    const gBody = {
      phone: body.guarantorPhone,
      phoneDialCode: body.guarantorPhoneDialCode,
      phoneSecondary: body.guarantorPhoneSecondary,
      phoneSecondaryDialCode: body.guarantorPhoneSecondaryDialCode,
      country: body.guarantorCountry,
      city: body.guarantorCity,
    };
    const ensuredG = await ensureClientWithContact({
      name: guarantorIn,
      body: gBody,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "personal-guarantees-guarantor",
      requireComplete: Boolean(gBody.phone || gBody.country || gBody.city),
    });
    if (!ensuredG.ok) {
      return NextResponse.json({ error: ensuredG.error }, { status: ensuredG.status });
    }
    guarantorName = ensuredG.clientName;
  }

  let caseRef = "";
  if (body.caseId) {
    const linked = await resolveCaseById(String(body.caseId));
    if (!linked) {
      return NextResponse.json({ error: "القضية غير موجودة في السجل المركزي" }, { status: 400 });
    }
    caseRef = linked.caseNo;
  } else if (body.caseNo || body.caseRef) {
    const resolved = await resolveCaseRef(String(body.caseNo ?? body.caseRef));
    if (resolved.status !== "linked") {
      return NextResponse.json(
        {
          error:
            "لا يُسمح بربط رقم قضية غير موجود — اختر من السجل الحقيقي أو أنشئ قضية جديدة",
        },
        { status: 400 }
      );
    }
    caseRef = resolved.case.caseNo;
  } else {
    return NextResponse.json(
      { error: "رقم القضية إلزامي — اختر قضية من السجل المركزي" },
      { status: 400 }
    );
  }

  const created = await prisma.personalGuarantee.create({
    data: {
      caseRef,
      clientName,
      guarantorName,
      relationship: body.relationship ? String(body.relationship) : null,
      status: String(body.status ?? "ساري"),
      documents: body.documents ? String(body.documents) : null,
      notes: body.notes ? String(body.notes) : null,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
