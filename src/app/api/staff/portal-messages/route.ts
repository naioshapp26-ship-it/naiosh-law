import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { listStaffConversations } from "@/lib/portal-messages";

/** Staff inbox — all non-demo client conversations */
export async function GET() {
  const { error, session } = await requireAuth();
  if (error || !session) return error!;
  if (session.role === "client") {
    return NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 });
  }
  const conversations = await listStaffConversations();
  return NextResponse.json({ conversations });
}
