import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { loadPortalDashboard } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const data = await loadPortalDashboard(session);
  if (!data) {
    return NextResponse.json({ error: "لم يتم العثور على ملف العميل" }, { status: 404 });
  }
  return NextResponse.json(data);
}
