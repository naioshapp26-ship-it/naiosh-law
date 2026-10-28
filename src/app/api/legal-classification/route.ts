import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { mapEntryAttachments, serializeAttachments } from "@/lib/entry-attachments";
import { parseDialCodeOption } from "@/lib/person-contact";
import { ensureClientWithContact } from "@/lib/person-contact-server";

function mapEntry(e: {
  id: string;
  refNo: string;
  axisSlug: string;
  topicSlug: string;
  topicName: string;
  title: string;
  jurisdiction: string | null;
  country: string | null;
  category: string | null;
  status: string;
  clientName: string | null;
  clientId: string | null;
  clientPhone: string | null;
  clientPhoneDialCode: string | null;
  clientPhoneSecondary: string | null;
  clientPhoneSecondaryDialCode: string | null;
  clientCountry: string | null;
  clientCity: string | null;
  effectiveDate: string | null;
  source: string | null;
  description: string | null;
  notes: string | null;
  attachments: string | null;
  firstParty: string | null;
  firstPartyPhone: string | null;
  firstPartyDialCode: string | null;
  firstPartyCountry: string | null;
  firstPartyCity: string | null;
  firstPartyPhoneSecondary: string | null;
  firstPartyPhoneSecondaryDialCode: string | null;
  secondParty: string | null;
  secondPartyPhone: string | null;
  secondPartyDialCode: string | null;
  secondPartyCountry: string | null;
  secondPartyCity: string | null;
  secondPartyPhoneSecondary: string | null;
  secondPartyPhoneSecondaryDialCode: string | null;
}) {
  return {
    id: e.id,
    refNo: e.refNo,
    axisSlug: e.axisSlug,
    topicSlug: e.topicSlug,
    topicName: e.topicName,
    title: e.title,
    jurisdiction: e.jurisdiction ?? "—",
    country: e.country ?? "—",
    category: e.category ?? "—",
    status: e.status,
    client: e.clientName ?? "—",
    clientId: e.clientId ?? "",
    phone: e.clientPhone ?? "",
    phoneDialCode: e.clientPhoneDialCode ?? "",
    phoneSecondary: e.clientPhoneSecondary ?? "",
    phoneSecondaryDialCode: e.clientPhoneSecondaryDialCode ?? "",
    clientCountry: e.clientCountry ?? "",
    city: e.clientCity ?? "",
    country_client: e.clientCountry ?? "",
    effectiveDate: e.effectiveDate ?? "—",
    source: e.source ?? "—",
    description: e.description ?? "",
    notes: e.notes ?? "",
    attachments: mapEntryAttachments(e.attachments),
    firstParty: e.firstParty ?? "",
    firstPartyPhone: e.firstPartyPhone ?? "",
    firstPartyDialCode: e.firstPartyDialCode ?? "",
    firstPartyCountry: e.firstPartyCountry ?? "",
    firstPartyCity: e.firstPartyCity ?? "",
    firstPartyPhoneSecondary: e.firstPartyPhoneSecondary ?? "",
    firstPartyPhoneSecondaryDialCode: e.firstPartyPhoneSecondaryDialCode ?? "",
    secondParty: e.secondParty ?? "",
    secondPartyPhone: e.secondPartyPhone ?? "",
    secondPartyDialCode: e.secondPartyDialCode ?? "",
    secondPartyCountry: e.secondPartyCountry ?? "",
    secondPartyCity: e.secondPartyCity ?? "",
    secondPartyPhoneSecondary: e.secondPartyPhoneSecondary ?? "",
    secondPartyPhoneSecondaryDialCode: e.secondPartyPhoneSecondaryDialCode ?? "",
  };
}

function partyContactFromBody(body: Record<string, unknown>, which: "first" | "second") {
  const nameKey = which === "first" ? "firstParty" : "secondParty";
  const phoneKey = `${nameKey}Phone`;
  const dialKey = `${nameKey}DialCode`;
  const countryKey = `${nameKey}Country`;
  const cityKey = `${nameKey}City`;
  const secKey = `${nameKey}PhoneSecondary`;
  const secDialKey = `${nameKey}PhoneSecondaryDialCode`;
  return {
    [nameKey]: body[nameKey] ? String(body[nameKey]) : null,
    [phoneKey]: body[phoneKey] ? String(body[phoneKey]) : null,
    [dialKey]: body[dialKey] ? parseDialCodeOption(String(body[dialKey])) : null,
    [countryKey]: body[countryKey] ? String(body[countryKey]) : null,
    [cityKey]: body[cityKey] ? String(body[cityKey]) : null,
    [secKey]: body[secKey] ? String(body[secKey]) : null,
    [secDialKey]: body[secDialKey] ? parseDialCodeOption(String(body[secDialKey])) : null,
  };
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const axisSlug = searchParams.get("axisSlug");
  const topicSlug = searchParams.get("topicSlug");

  const entries = await prisma.legalClassificationEntry.findMany({
    where: {
      ...(axisSlug ? { axisSlug } : {}),
      ...(topicSlug ? { topicSlug } : {}),
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(entries.map((e) => mapEntry(e)));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const count = await prisma.legalClassificationEntry.count();
  const refNo = `LAW-${new Date().getFullYear()}-${String(count + 1).padStart(4, "0")}`;

  const clientName =
    body.client ? String(body.client) : body.clientName ? String(body.clientName) : "";
  let clientId: string | null = body.clientId ? String(body.clientId) : null;
  let clientPhone = body.phone ? String(body.phone) : null;
  let clientPhoneDialCode = body.phoneDialCode
    ? parseDialCodeOption(String(body.phoneDialCode))
    : null;
  let clientPhoneSecondary = body.phoneSecondary ? String(body.phoneSecondary) : null;
  let clientPhoneSecondaryDialCode = body.phoneSecondaryDialCode
    ? parseDialCodeOption(String(body.phoneSecondaryDialCode))
    : null;
  let clientCountry = body.clientCountry
    ? String(body.clientCountry)
    : body.country_client
      ? String(body.country_client)
      : null;
  let clientCity = body.city ? String(body.city) : null;

  if (clientName || clientPhone || clientCountry || clientCity) {
    const ensured = await ensureClientWithContact({
      name: clientName || "موكل تصنيف قانوني",
      clientId,
      body: {
        phone: clientPhone,
        phoneDialCode: clientPhoneDialCode,
        phoneSecondary: clientPhoneSecondary,
        phoneSecondaryDialCode: clientPhoneSecondaryDialCode,
        country: clientCountry,
        city: clientCity,
      },
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule: "legal-classification",
      requireComplete: Boolean(clientPhone || clientCountry || clientCity),
    });
    if (!ensured.ok) {
      return NextResponse.json({ error: ensured.error }, { status: ensured.status });
    }
    clientId = ensured.clientId;
    clientPhone = ensured.contact.phone;
    clientPhoneDialCode = ensured.contact.phoneDialCode;
    clientPhoneSecondary = ensured.contact.phoneSecondary;
    clientPhoneSecondaryDialCode = ensured.contact.phoneSecondaryDialCode;
    clientCountry = ensured.contact.country;
    clientCity = ensured.contact.city;
  }

  const first = partyContactFromBody(body, "first");
  const second = partyContactFromBody(body, "second");

  const created = await prisma.legalClassificationEntry.create({
    data: {
      refNo,
      axisSlug: String(body.axisSlug ?? ""),
      topicSlug: String(body.topicSlug ?? ""),
      topicName: String(body.topicName ?? body.title ?? ""),
      title: String(body.title ?? ""),
      jurisdiction: body.jurisdiction ? String(body.jurisdiction) : null,
      country: body.country ? String(body.country) : null,
      category: body.category ? String(body.category) : null,
      status: body.status ? String(body.status) : "نشط",
      clientName: clientName || null,
      clientId,
      clientPhone,
      clientPhoneDialCode,
      clientPhoneSecondary,
      clientPhoneSecondaryDialCode,
      clientCountry,
      clientCity,
      effectiveDate: body.effectiveDate ? String(body.effectiveDate) : null,
      source: body.source ? String(body.source) : null,
      description: body.description ? String(body.description) : null,
      notes: body.notes ? String(body.notes) : null,
      attachments: serializeAttachments(body.attachments),
      firstParty: first.firstParty as string | null,
      firstPartyPhone: first.firstPartyPhone as string | null,
      firstPartyDialCode: first.firstPartyDialCode as string | null,
      firstPartyCountry: first.firstPartyCountry as string | null,
      firstPartyCity: first.firstPartyCity as string | null,
      firstPartyPhoneSecondary: first.firstPartyPhoneSecondary as string | null,
      firstPartyPhoneSecondaryDialCode: first.firstPartyPhoneSecondaryDialCode as string | null,
      secondParty: second.secondParty as string | null,
      secondPartyPhone: second.secondPartyPhone as string | null,
      secondPartyDialCode: second.secondPartyDialCode as string | null,
      secondPartyCountry: second.secondPartyCountry as string | null,
      secondPartyCity: second.secondPartyCity as string | null,
      secondPartyPhoneSecondary: second.secondPartyPhoneSecondary as string | null,
      secondPartyPhoneSecondaryDialCode: second.secondPartyPhoneSecondaryDialCode as string | null,
    },
  });

  if (first.firstParty || second.secondParty) {
    await prisma.recordParty.upsert({
      where: {
        sourceModule_sourceId: { sourceModule: "legal-classification", sourceId: created.id },
      },
      create: {
        sourceModule: "legal-classification",
        sourceId: created.id,
        sourceRef: created.refNo,
        firstParty: created.firstParty,
        firstPartyPhone: created.firstPartyPhone,
        firstPartyDialCode: created.firstPartyDialCode,
        firstPartyCountry: created.firstPartyCountry,
        firstPartyCity: created.firstPartyCity,
        firstPartyPhoneSecondary: created.firstPartyPhoneSecondary,
        firstPartyPhoneSecondaryDialCode: created.firstPartyPhoneSecondaryDialCode,
        secondParty: created.secondParty,
        secondPartyPhone: created.secondPartyPhone,
        secondPartyDialCode: created.secondPartyDialCode,
        secondPartyCountry: created.secondPartyCountry,
        secondPartyCity: created.secondPartyCity,
        secondPartyPhoneSecondary: created.secondPartyPhoneSecondary,
        secondPartyPhoneSecondaryDialCode: created.secondPartyPhoneSecondaryDialCode,
        updatedBy: session!.name ?? session!.email,
      },
      update: {
        firstParty: created.firstParty,
        firstPartyPhone: created.firstPartyPhone,
        firstPartyDialCode: created.firstPartyDialCode,
        firstPartyCountry: created.firstPartyCountry,
        firstPartyCity: created.firstPartyCity,
        firstPartyPhoneSecondary: created.firstPartyPhoneSecondary,
        firstPartyPhoneSecondaryDialCode: created.firstPartyPhoneSecondaryDialCode,
        secondParty: created.secondParty,
        secondPartyPhone: created.secondPartyPhone,
        secondPartyDialCode: created.secondPartyDialCode,
        secondPartyCountry: created.secondPartyCountry,
        secondPartyCity: created.secondPartyCity,
        secondPartyPhoneSecondary: created.secondPartyPhoneSecondary,
        secondPartyPhoneSecondaryDialCode: created.secondPartyPhoneSecondaryDialCode,
        updatedBy: session!.name ?? session!.email,
      },
    });
  }

  return NextResponse.json(mapEntry(created), { status: 201 });
}
