import { NextResponse } from "next/server";
import { getSessionFromCookies, canWrite } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/client";

type JsonObject = Record<string, unknown>;

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

export async function readJsonObject(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      body: null,
      error: jsonError("نوع المحتوى يجب أن يكون application/json", 415),
    };
  }

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return { body: null, error: jsonError("صيغة JSON غير صحيحة", 400) };
    }
    return { body: body as JsonObject, error: null };
  } catch {
    return { body: null, error: jsonError("تعذر قراءة JSON", 400) };
  }
}
