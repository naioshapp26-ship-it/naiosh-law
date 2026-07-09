import { NextResponse } from "next/server";
import { getSessionFromCookies, canWrite } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/client";

type JsonBodyResult =
  | { body: Record<string, unknown>; error: null }
  | { body: null; error: NextResponse };

export async function requireAuth(roles?: UserRole[]) {
  const session = await getSessionFromCookies();
  if (!session) {
    return { error: NextResponse.json({ error: "غير مصرح" }, { status: 401 }), session: null };
  }
  if (roles && !roles.includes(session.role)) {
    return { error: NextResponse.json({ error: "صلاحية غير كافية" }, { status: 403 }), session: null };
  }
  return { error: null, session };
}

export async function requireWrite() {
  const result = await requireAuth();
  if (result.error) return result;
  if (!canWrite(result.session!.role)) {
    return { error: NextResponse.json({ error: "صلاحية القراءة فقط" }, { status: 403 }), session: null };
  }
  return result;
}

export function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonBody(
  request: Request,
  options: { allowEmpty?: boolean } = {}
): Promise<JsonBodyResult> {
  const rawBody = await request.text();

  if (!rawBody.trim()) {
    if (options.allowEmpty) {
      return { body: {} as Record<string, unknown>, error: null };
    }
    return { body: null, error: jsonError("محتوى الطلب مطلوب", 400) };
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return { body: null, error: jsonError("نوع المحتوى يجب أن يكون application/json", 415) };
  }

  try {
    const body: unknown = JSON.parse(rawBody);
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { body: null, error: jsonError("صيغة JSON غير صالحة", 400) };
    }
    return { body: body as Record<string, unknown>, error: null };
  } catch {
    return { body: null, error: jsonError("صيغة JSON غير صالحة", 400) };
  }
}
