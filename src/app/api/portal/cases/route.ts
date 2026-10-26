import { NextResponse } from "next/server";
import { requireClientSession } from "@/lib/portal-api";
import { loadPortalCases } from "@/lib/client-portal-data";

export async function GET() {
  const { error, session } = await requireClientSession();
  if (error || !session) return error!;
  const cases = await loadPortalCases(session);
  return NextResponse.json({ cases });
}
