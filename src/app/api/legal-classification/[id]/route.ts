import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { mergeAttachments } from "@/lib/entry-attachments";
import { parseDialCodeOption } from "@/lib/person-contact";
import { ensureClientWithContact } from "@/lib/person-contact-server";

type Params = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, { params }: Params) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  const body = await request.json();

  const existing = await prisma.legalClassificationEntry.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const data: Record<string, unknown> = {
    title: body.title !== undefined ? String(body.title) : undefined,
    topicName: body.topicName !== undefined ? String(body.topicName) : undefined,
    topicSlug: body.topicSlug !== undefined ? String(body.topicSlug) : undefined,
    jurisdiction: body.jurisdiction !== undefined ? String(body.jurisdiction) : undefined,
    country: body.country !== undefined ? String(body.country) : undefined,
    category: body.category !== undefined ? String(body.category) : undefined,
    status: body.status !== undefined ? String(body.status) : undefined,
    effectiveDate: body.effectiveDate !== undefined ? String(body.effectiveDate) : undefined,
    source: body.source !== undefined ? String(body.source) : undefined,
    description: body.description !== undefined ? String(body.description) : undefined,
    notes: body.notes !== undefined ? String(body.notes) : undefined,
    attachments:
      body.attachments !== undefined
        ? mergeAttachments(existing.attachments, body.attachments)
        : undefined,
  };

  const clientTouched =
    body.client !== undefined ||
    body.clientName !== undefined ||
    body.phone !== undefined ||
    body.phoneDialCode !== undefined ||
    body.phoneSecondary !== undefined ||
    body.clientCountry !== undefined ||
    body.city !== undefined;

  if (clientTouched) {
    const name =
      body.client !== undefined
        ? String(body.client)
        : body.clientName !== undefined
          ? String(body.clientName)
          : existing.clientName ?? "";
    const ensured = await ensureClientWithContact({
      name: name || existing.clientName || "موكل تصنيف قانوني",
      clientId: body.clientId ? String(body.clientId) : existing.clientId,
      body: {
        phone: body.phone,
        phoneDialCode: body.phoneDialCode,
        phoneSecondary: body.phoneSecondary,
        phoneSecondaryDialCode: body.phoneSecondaryDialCode,
        country: body.clientCountry,
        city: body.city,
      },
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "legal-classification",
      sourceId: id,
      requireComplete: Boolean(body.phone || body.clientCountry || body.city),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
    data.clientName = ensured.clientName;
    data.clientId = ensured.clientId;
    data.clientPhone = ensured.contact.phone;
    data.clientPhoneDialCode = ensured.contact.phoneDialCode;
    data.clientPhoneSecondary = ensured.contact.phoneSecondary;
    data.clientPhoneSecondaryDialCode = ensured.contact.phoneSecondaryDialCode;
    data.clientCountry = ensured.contact.country;
    data.clientCity = ensured.contact.city;
  }

  const partyKeys = [
    "firstParty",
    "firstPartyPhone",
    "firstPartyDialCode",
    "firstPartyCountry",
    "firstPartyCity",
    "firstPartyPhoneSecondary",
    "firstPartyPhoneSecondaryDialCode",
    "secondParty",
    "secondPartyPhone",
    "secondPartyDialCode",
    "secondPartyCountry",
    "secondPartyCity",
    "secondPartyPhoneSecondary",
    "secondPartyPhoneSecondaryDialCode",
  ] as const;
  for (const key of partyKeys) {
    if (body[key] !== undefined) {
      const raw = body[key];
      if (raw === null || raw === "") {
        data[key] = null;
      } else if (key.endsWith("DialCode")) {
        data[key] = parseDialCodeOption(String(raw));
      } else {
        data[key] = String(raw);
      }
    }
  }

  const updated = await prisma.legalClassificationEntry.update({
    where: { id },
    data,
  });

  if (partyKeys.some((k) => body[k] !== undefined)) {
    await prisma.recordParty.upsert({
      where: { sourceModule_sourceId: { sourceModule: "legal-classification", sourceId: id } },
      create: {
        sourceModule: "legal-classification",
        sourceId: id,
        sourceRef: updated.refNo,
        firstParty: updated.firstParty,
        firstPartyPhone: updated.firstPartyPhone,
        firstPartyDialCode: updated.firstPartyDialCode,
        firstPartyCountry: updated.firstPartyCountry,
        firstPartyCity: updated.firstPartyCity,
        firstPartyPhoneSecondary: updated.firstPartyPhoneSecondary,
        firstPartyPhoneSecondaryDialCode: updated.firstPartyPhoneSecondaryDialCode,
        secondParty: updated.secondParty,
        secondPartyPhone: updated.secondPartyPhone,
        secondPartyDialCode: updated.secondPartyDialCode,
        secondPartyCountry: updated.secondPartyCountry,
        secondPartyCity: updated.secondPartyCity,
        secondPartyPhoneSecondary: updated.secondPartyPhoneSecondary,
        secondPartyPhoneSecondaryDialCode: updated.secondPartyPhoneSecondaryDialCode,
        updatedBy: session!.name ?? session!.email,
      },
      update: {
        firstParty: updated.firstParty,
        firstPartyPhone: updated.firstPartyPhone,
        firstPartyDialCode: updated.firstPartyDialCode,
        firstPartyCountry: updated.firstPartyCountry,
        firstPartyCity: updated.firstPartyCity,
        firstPartyPhoneSecondary: updated.firstPartyPhoneSecondary,
        firstPartyPhoneSecondaryDialCode: updated.firstPartyPhoneSecondaryDialCode,
        secondParty: updated.secondParty,
        secondPartyPhone: updated.secondPartyPhone,
        secondPartyDialCode: updated.secondPartyDialCode,
        secondPartyCountry: updated.secondPartyCountry,
        secondPartyCity: updated.secondPartyCity,
        secondPartyPhoneSecondary: updated.secondPartyPhoneSecondary,
        secondPartyPhoneSecondaryDialCode: updated.secondPartyPhoneSecondaryDialCode,
        updatedBy: session!.name ?? session!.email,
      },
    });
  }

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const { error } = await requireWrite();
  if (error) return error;
  const { id } = await params;
  await prisma.legalClassificationEntry.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
