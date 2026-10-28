import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { formatDate, formatNumber } from "@/lib/format";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import { assertPageAction } from "@/lib/page-settings/page-action-auth";
import {
  contactFieldsFromBody,
  canViewPersonContact,
  toDisplayContact,
  validateMobileNumber,
  validateCountryCity,
  dialCodeForCountry,
  parseDialCodeOption,
} from "@/lib/person-contact";

export async function GET() {
  const { error, session } = await requireAuth();
  if (error) return error;

  const role = session!.role;
  const canView = canViewPersonContact(role);
  // Clients must never see other clients' contact data
  if (role === "client") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const clients = await prisma.client.findMany({ orderBy: { createdAt: "desc" } });
  const base = clients.map((c) => {
    const display = toDisplayContact(
      {
        phone: c.phone,
        phoneDialCode: c.phoneDialCode,
        phoneSecondary: c.phoneSecondary,
        phoneSecondaryDialCode: c.phoneSecondaryDialCode,
        primaryPhoneSlot: c.primaryPhoneSlot,
        country: c.country,
        city: c.city,
        countrySecondary: c.countrySecondary,
        citySecondary: c.citySecondary,
        primaryAddressSlot: c.primaryAddressSlot,
      },
      { mask: !canView }
    );
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      phone: display.phone,
      phoneDialCode: canView ? display.phoneDialCode ?? "" : "",
      phoneSecondary: canView ? c.phoneSecondary ?? "" : "",
      phoneSecondaryDialCode: canView ? c.phoneSecondaryDialCode ?? "" : "",
      country: display.country,
      city: display.city,
      email: c.email ?? "—",
      cases: formatNumber(c.casesCount, { maximumFractionDigits: 0 }),
      status: c.status,
      since: formatDate(c.since),
      contactIncomplete: display.incomplete,
    };
  });
  const withCustom = await attachCustomValuesToRows("clients-management", base);
  return NextResponse.json(withCustom);
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;

  const gate = await assertPageAction({
    pageKey: "clients-management",
    action: "create",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const body = await request.json();
  const patch = contactFieldsFromBody(body as Record<string, unknown>);
  const phone = patch.phone ?? (body.phone ? String(body.phone).trim() : null);
  const country = patch.country ?? (body.country ? String(body.country).trim() : null);
  const city = patch.city ?? (body.city ? String(body.city).trim() : null);
  const phoneDialCode =
    patch.phoneDialCode ??
    (body.phoneDialCode
      ? parseDialCodeOption(String(body.phoneDialCode))
      : dialCodeForCountry(country));

  if (phone) {
    const v = validateMobileNumber(phoneDialCode, phone);
    if (!v.ok) return NextResponse.json({ error: v.error }, { status: 400 });
  } else {
    return NextResponse.json({ error: "رقم الجوال مطلوب" }, { status: 400 });
  }
  const loc = validateCountryCity(country, city, { allowCustomCity: true, required: true });
  if (!loc.ok) return NextResponse.json({ error: loc.error }, { status: 400 });

  const created = await prisma.client.create({
    data: {
      name: String(body.name ?? ""),
      type: String(body.type ?? "فرد"),
      phone,
      phoneDialCode,
      country,
      city,
      email: body.email ? String(body.email) : null,
      status: String(body.status ?? "نشط"),
      phoneSecondary: patch.phoneSecondary ?? null,
      phoneSecondaryDialCode: patch.phoneSecondaryDialCode ?? null,
      primaryPhoneSlot: patch.primaryPhoneSlot ?? 0,
      countrySecondary: patch.countrySecondary ?? null,
      citySecondary: patch.citySecondary ?? null,
      primaryAddressSlot: patch.primaryAddressSlot ?? 0,
    },
  });

  await prisma.personContactChange.createMany({
    data: [
      { clientId: created.id, field: "phone", oldValue: null, newValue: phone, changedById: session!.sub, changedByName: session!.name ?? session!.email, sourceModule: "clients-management", sourceId: created.id },
      { clientId: created.id, field: "phoneDialCode", oldValue: null, newValue: phoneDialCode, changedById: session!.sub, changedByName: session!.name ?? session!.email, sourceModule: "clients-management", sourceId: created.id },
      { clientId: created.id, field: "country", oldValue: null, newValue: country, changedById: session!.sub, changedByName: session!.name ?? session!.email, sourceModule: "clients-management", sourceId: created.id },
      { clientId: created.id, field: "city", oldValue: null, newValue: city, changedById: session!.sub, changedByName: session!.name ?? session!.email, sourceModule: "clients-management", sourceId: created.id },
    ],
  });

  await persistCustomFieldsFromBody({
    sourceModule: "clients-management",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
