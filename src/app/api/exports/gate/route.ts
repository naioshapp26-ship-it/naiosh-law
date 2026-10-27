import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-helpers";
import { assertPageAction } from "@/lib/page-settings/page-action-auth";

/**
 * Server gate for print/export — UI hiding alone is not enough.
 * Body: { pageKey: string }
 */
export async function POST(request: Request) {
  const { error, session } = await requireAuth();
  if (error) return error;

  const body = (await request.json().catch(() => ({}))) as { pageKey?: string };
  const pageKey = String(body.pageKey || "").trim();
  if (!pageKey) {
    return NextResponse.json({ error: "pageKey مطلوب" }, { status: 400 });
  }

  const gate = await assertPageAction({
    pageKey,
    action: "export",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  return NextResponse.json({ ok: true, pageKey, role: session!.role });
}
