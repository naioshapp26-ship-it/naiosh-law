import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { parseDialCodeOption, UNSPECIFIED_CONTACT } from "@/lib/person-contact";
import { ensureClientWithContact } from "@/lib/person-contact-server";

type PartyRow = {
  id: string;
  sourceModule: string;
  sourceId: string;
  sourceRef: string | null;
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
  firstPartyClientId: string | null;
  secondPartyClientId: string | null;
  updatedBy: string | null;
  updatedAt: Date;
};

function mapParty(row: PartyRow) {
  return {
    id: row.id,
    sourceModule: row.sourceModule,
    sourceId: row.sourceId,
    sourceRef: row.sourceRef ?? "",
    firstParty: row.firstParty ?? "",
    firstPartyPhone: row.firstPartyPhone ?? "",
    firstPartyDialCode: row.firstPartyDialCode ?? "",
    firstPartyCountry: row.firstPartyCountry ?? "",
    firstPartyCity: row.firstPartyCity ?? "",
    firstPartyPhoneSecondary: row.firstPartyPhoneSecondary ?? "",
    firstPartyPhoneSecondaryDialCode: row.firstPartyPhoneSecondaryDialCode ?? "",
    secondParty: row.secondParty ?? "",
    secondPartyPhone: row.secondPartyPhone ?? "",
    secondPartyDialCode: row.secondPartyDialCode ?? "",
    secondPartyCountry: row.secondPartyCountry ?? "",
    secondPartyCity: row.secondPartyCity ?? "",
    secondPartyPhoneSecondary: row.secondPartyPhoneSecondary ?? "",
    secondPartyPhoneSecondaryDialCode: row.secondPartyPhoneSecondaryDialCode ?? "",
    firstPartyClientId: row.firstPartyClientId ?? "",
    secondPartyClientId: row.secondPartyClientId ?? "",
    firstPartyPhoneDisplay: row.firstPartyPhone
      ? `${row.firstPartyDialCode ? row.firstPartyDialCode + " " : ""}${row.firstPartyPhone}`
      : UNSPECIFIED_CONTACT,
    firstPartyCountryDisplay: row.firstPartyCountry || UNSPECIFIED_CONTACT,
    firstPartyCityDisplay: row.firstPartyCity || UNSPECIFIED_CONTACT,
    secondPartyPhoneDisplay: row.secondPartyPhone
      ? `${row.secondPartyDialCode ? row.secondPartyDialCode + " " : ""}${row.secondPartyPhone}`
      : UNSPECIFIED_CONTACT,
    secondPartyCountryDisplay: row.secondPartyCountry || UNSPECIFIED_CONTACT,
    secondPartyCityDisplay: row.secondPartyCity || UNSPECIFIED_CONTACT,
    updatedBy: row.updatedBy ?? "",
    updatedAt: row.updatedAt.toISOString(),
  };
}

async function linkPartyClient(opts: {
  name: string | null;
  clientId: string | null;
  phone: string | null;
  phoneDialCode: string | null;
  phoneSecondary: string | null;
  phoneSecondaryDialCode: string | null;
  country: string | null;
  city: string | null;
  role: string;
  changedById: string;
  changedByName: string;
  sourceModule: string;
  sourceId: string;
  which: "first" | "second";
}): Promise<{ ok: true; clientId: string | null } | { ok: false; error: string; status: number }> {
  const name = String(opts.name ?? "").trim();
  if (!name && !opts.phone && !opts.country && !opts.city) {
    return { ok: true, clientId: opts.clientId };
  }
  if (!name) return { ok: true, clientId: opts.clientId };
  const ensured = await ensureClientWithContact({
    name,
    clientId: opts.clientId,
    body: {
      phone: opts.phone,
      phoneDialCode: opts.phoneDialCode,
      phoneSecondary: opts.phoneSecondary,
      phoneSecondaryDialCode: opts.phoneSecondaryDialCode,
      country: opts.country,
      city: opts.city,
    },
    role: opts.role,
    changedById: opts.changedById,
    changedByName: opts.changedByName,
    sourceModule: `${opts.sourceModule}-party-${opts.which}`,
    sourceId: opts.sourceId,
    requireComplete: Boolean(opts.phone || opts.country || opts.city),
  });
  if (!ensured.ok) return { ok: false, error: ensured.error, status: ensured.status };
  return { ok: true, clientId: ensured.clientId };
}

export async function GET(request: Request) {
  const { error } = await requireAuth();
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const sourceModule = searchParams.get("sourceModule");
    const sourceId = searchParams.get("sourceId");
    if (!sourceModule || !sourceId) {
      return NextResponse.json({ error: "sourceModule و sourceId مطلوبان" }, { status: 400 });
    }

    const row = await prisma.recordParty.findUnique({
      where: { sourceModule_sourceId: { sourceModule, sourceId } },
    });
    return NextResponse.json(row ? mapParty(row as PartyRow) : null);
  } catch (e) {
    console.error("[record-parties GET]", e);
    return NextResponse.json({ error: "تعذر تحميل بيانات الأطراف" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  try {
    const body = await request.json();
    const sourceModule = String(body.sourceModule ?? "");
    const sourceId = String(body.sourceId ?? "");
    if (!sourceModule || !sourceId) {
      return NextResponse.json({ error: "بيانات المرجع ناقصة" }, { status: 400 });
    }

    const firstLink = await linkPartyClient({
      name: body.firstParty ? String(body.firstParty) : null,
      clientId: body.firstPartyClientId ? String(body.firstPartyClientId) : null,
      phone: body.firstPartyPhone ? String(body.firstPartyPhone) : null,
      phoneDialCode: body.firstPartyDialCode ? String(body.firstPartyDialCode) : null,
      phoneSecondary: body.firstPartyPhoneSecondary ? String(body.firstPartyPhoneSecondary) : null,
      phoneSecondaryDialCode: body.firstPartyPhoneSecondaryDialCode
        ? String(body.firstPartyPhoneSecondaryDialCode)
        : null,
      country: body.firstPartyCountry ? String(body.firstPartyCountry) : null,
      city: body.firstPartyCity ? String(body.firstPartyCity) : null,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule,
      sourceId,
      which: "first",
    });
    if (!firstLink.ok) {
      return NextResponse.json({ error: firstLink.error }, { status: firstLink.status });
    }

    const secondLink = await linkPartyClient({
      name: body.secondParty ? String(body.secondParty) : null,
      clientId: body.secondPartyClientId ? String(body.secondPartyClientId) : null,
      phone: body.secondPartyPhone ? String(body.secondPartyPhone) : null,
      phoneDialCode: body.secondPartyDialCode ? String(body.secondPartyDialCode) : null,
      phoneSecondary: body.secondPartyPhoneSecondary ? String(body.secondPartyPhoneSecondary) : null,
      phoneSecondaryDialCode: body.secondPartyPhoneSecondaryDialCode
        ? String(body.secondPartyPhoneSecondaryDialCode)
        : null,
      country: body.secondPartyCountry ? String(body.secondPartyCountry) : null,
      city: body.secondPartyCity ? String(body.secondPartyCity) : null,
      role: session!.role,
      changedById: session!.sub,
      changedByName: session!.name ?? session!.email,
      sourceModule,
      sourceId,
      which: "second",
    });
    if (!secondLink.ok) {
      return NextResponse.json({ error: secondLink.error }, { status: secondLink.status });
    }

    const data = {
      sourceRef: body.sourceRef ? String(body.sourceRef) : null,
      firstParty: body.firstParty ? String(body.firstParty) : null,
      firstPartyPhone: body.firstPartyPhone ? String(body.firstPartyPhone) : null,
      firstPartyDialCode: body.firstPartyDialCode
        ? parseDialCodeOption(String(body.firstPartyDialCode))
        : null,
      firstPartyCountry: body.firstPartyCountry ? String(body.firstPartyCountry) : null,
      firstPartyCity: body.firstPartyCity ? String(body.firstPartyCity) : null,
      firstPartyPhoneSecondary: body.firstPartyPhoneSecondary
        ? String(body.firstPartyPhoneSecondary)
        : null,
      firstPartyPhoneSecondaryDialCode: body.firstPartyPhoneSecondaryDialCode
        ? parseDialCodeOption(String(body.firstPartyPhoneSecondaryDialCode))
        : null,
      secondParty: body.secondParty ? String(body.secondParty) : null,
      secondPartyPhone: body.secondPartyPhone ? String(body.secondPartyPhone) : null,
      secondPartyDialCode: body.secondPartyDialCode
        ? parseDialCodeOption(String(body.secondPartyDialCode))
        : null,
      secondPartyCountry: body.secondPartyCountry ? String(body.secondPartyCountry) : null,
      secondPartyCity: body.secondPartyCity ? String(body.secondPartyCity) : null,
      secondPartyPhoneSecondary: body.secondPartyPhoneSecondary
        ? String(body.secondPartyPhoneSecondary)
        : null,
      secondPartyPhoneSecondaryDialCode: body.secondPartyPhoneSecondaryDialCode
        ? parseDialCodeOption(String(body.secondPartyPhoneSecondaryDialCode))
        : null,
      firstPartyClientId: firstLink.clientId,
      secondPartyClientId: secondLink.clientId,
      updatedBy: session?.name ?? session?.email ?? null,
    };

    const row = await prisma.recordParty.upsert({
      where: { sourceModule_sourceId: { sourceModule, sourceId } },
      create: { sourceModule, sourceId, ...data },
      update: data,
    });

    return NextResponse.json(mapParty(row as PartyRow), { status: 201 });
  } catch (e) {
    console.error("[record-parties POST]", e);
    return NextResponse.json({ error: "تعذر حفظ بيانات الأطراف" }, { status: 500 });
  }
}
