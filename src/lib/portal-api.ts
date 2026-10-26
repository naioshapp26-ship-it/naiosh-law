import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import type { AuthPayload } from "@/lib/auth";

export async function requireClientSession() {
  const result = await requireAuth(["client"]);
  if (result.error || !result.session) {
    return { error: result.error ?? NextResponse.json({ error: "غير مصرح" }, { status: 401 }), session: null as AuthPayload | null };
  }
  return { error: null, session: result.session };
}
