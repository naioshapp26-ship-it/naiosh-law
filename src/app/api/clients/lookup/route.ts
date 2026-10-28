import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";
import { canViewPersonContact, toDisplayContact, dialCodeForCountry } from "@/lib/person-contact";

/** Lookup clients by name for form autofill of central contact fields. */
export async function GET(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;
  if (session!.role === "client") {
    return NextResponse.json({ error: "غير مصرح" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);
  const q = String(searchParams.get("q") ?? "").trim();
  const exact = searchParams.get("exact") === "1";
  if (!q) return NextResponse.json([]);

  const canView = canViewPersonContact(session!.role);
  const rows = await prisma.client.findMany({
    where: exact
      ? { name: q }
      : { name: { contains: q, mode: "insensitive" } },
    take: exact ? 5 : 12,
    orderBy: { updatedAt: "desc" },
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
      type: true,
    },
  });

  return NextResponse.json(
    rows.map((c) => {
      const display = toDisplayContact(c, { mask: !canView });
      const dial =
        c.phoneDialCode ||
        (c.country ? dialCodeForCountry(c.country) : "") ||
        "";
      return {
        id: c.id,
        name: c.name,
        type: c.type,
        clientId: c.id,
        phone: canView ? c.phone ?? "" : "",
        phoneDialCode: canView && dial ? (dial.includes("(") ? dial : `${dial}${c.country ? ` (${c.country})` : ""}`) : "",
        phoneSecondary: canView ? c.phoneSecondary ?? "" : "",
        phoneSecondaryDialCode: canView ? c.phoneSecondaryDialCode ?? "" : "",
        country: c.country ?? "",
        city: c.city ?? "",
        phoneDisplay: display.phone,
        countryDisplay: display.country,
        cityDisplay: display.city,
        contactIncomplete: display.incomplete,
      };
    })
  );
}
