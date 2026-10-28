import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  ensureClientWithContact,
  findClientContactByName,
  mapRowWithClientContact,
} from "@/lib/person-contact-server";
import { canViewPersonContact, UNSPECIFIED_CONTACT } from "@/lib/person-contact";

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
    const mapped = mapRowWithClientContact(
      {
        id: g.id,
        caseRef: g.caseRef,
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

  const created = await prisma.personalGuarantee.create({
    data: {
      caseRef: String(body.caseRef ?? ""),
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
