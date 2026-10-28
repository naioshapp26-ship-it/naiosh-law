import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalProfile } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const profile = await loadPortalProfile(session);
  if (!profile) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });
  return NextResponse.json({ profile });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;

  if (isDemoPortalSession(session)) {
    return NextResponse.json(
      { error: "الحساب التجريبي للقراءة/العرض — لا يمكن تعديل بيانات الإنتاج أو التجربة المعزولة من هنا بشكل دائم." },
      { status: 403 }
    );
  }

  const body = await request.json();
  try {
    const prisma = getPrisma();
    const { ensurePortalClientRecord } = await import("@/lib/client-portal-data");
    let client = await prisma.client.findFirst({ where: { userId: session.sub } });
    if (!client) {
      client = await ensurePortalClientRecord(session);
    }
    if (!client) return NextResponse.json({ error: "الملف غير موجود" }, { status: 404 });

    const data: Record<string, unknown> = {};
    const fields = [
      "name",
      "phone",
      "phoneDialCode",
      "type",
      "country",
      "city",
      "address",
      "preferredLanguage",
      "companyName",
      "authorizedPerson",
      "authorizedPhone",
      "avatarUrl",
      "notificationPrefs",
      "phoneSecondary",
      "phoneSecondaryDialCode",
      "primaryPhoneSlot",
      "countrySecondary",
      "citySecondary",
      "primaryAddressSlot",
    ] as const;

    for (const key of fields) {
      if (body[key] !== undefined) {
        data[key] = key === "notificationPrefs" ? JSON.stringify(body[key]) : body[key];
      }
    }

    const name = String(data.name ?? client.name);
    const phone = (data.phone as string | null | undefined) ?? client.phone;
    const city = (data.city as string | null | undefined) ?? client.city;
    const country = (data.country as string | null | undefined) ?? client.country;
    data.profileComplete = Boolean(name && phone && city && country);

    const updated = await prisma.client.update({ where: { id: client.id }, data });
    if (typeof data.name === "string") {
      await prisma.user.update({ where: { id: session.sub }, data: { name: data.name, phone: phone ?? undefined } });
    }

    return NextResponse.json({ ok: true, profileComplete: updated.profileComplete });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: "تعذر حفظ الملف", details: message }, { status: 500 });
  }
}
