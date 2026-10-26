import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { loadPortalSessions } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const sessions = await loadPortalSessions(session);
  return NextResponse.json({ sessions });
}
