import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { getPrisma } from "@/lib/prisma";
import { isDemoPortalSession } from "@/lib/client-portal";
import { loadPortalNotifications, loadPortalProfile } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const notifications = await loadPortalNotifications(session);
  return NextResponse.json({ notifications });
}

export async function PATCH(request: Request) {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  if (isDemoPortalSession(session)) {
    return NextResponse.json({ ok: true, demo: true });
  }
  const body = await request.json();
  const id = String(body.id ?? "");
  const profile = await loadPortalProfile(session);
  if (!profile) return NextResponse.json({ error: "غير موجود" }, { status: 404 });
  try {
    const prisma = getPrisma();
    const n = await prisma.clientPortalNotification.findFirst({ where: { id, clientId: profile.id } });
    if (!n) return NextResponse.json({ error: "الإشعار غير موجود" }, { status: 404 });
    await prisma.clientPortalNotification.update({ where: { id }, data: { read: true } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
