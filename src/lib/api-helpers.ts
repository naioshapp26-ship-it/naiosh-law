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

function getErrorCode(error: unknown) {
  if (typeof error === "object" && error !== null && "code" in error) {
    const code = (error as { code?: unknown }).code;
    return typeof code === "string" ? code : null;
  }
  return null;
}

export function handleApiError(error: unknown, fallback = "تعذر تنفيذ الطلب") {
  const code = getErrorCode(error);
  if (code === "P2025") {
    return jsonError("غير موجود", 404);
  }
  if (code === "P2002") {
    return jsonError("يوجد سجل بنفس البيانات الفريدة", 409);
  }
  if (error instanceof Error && error.message.includes("DATABASE_URL is not set")) {
    return jsonError("لم يتم ضبط اتصال قاعدة البيانات", 503);
  }

  console.error("API error:", error);
  return jsonError(fallback, 500);
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
