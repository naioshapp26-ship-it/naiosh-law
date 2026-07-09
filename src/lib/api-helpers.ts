import { NextResponse } from "next/server";
import { getSessionFromCookies, canWrite } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/client";

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
    return { data: null, error: jsonError("نوع المحتوى يجب أن يكون application/json", 415) };
  }

  try {
    const data = await request.json();
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { data: null, error: jsonError("صيغة الطلب غير صحيحة", 400) };
    }
    return { data: data as Record<string, unknown>, error: null };
  } catch {
    return { data: null, error: jsonError("تعذر قراءة بيانات الطلب", 400) };
  }
}

export function prismaErrorResponse(error: unknown) {
  if (typeof error === "object" && error && "code" in error) {
    const code = (error as { code?: string }).code;
    if (code === "P2025") return jsonError("السجل غير موجود", 404);
    if (code === "P2002") return jsonError("يوجد سجل بنفس البيانات الفريدة", 409);
  }
  console.error("API error:", error);
  return jsonError("خطأ في الخادم", 500);
}

export function requestIp(request: Request) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || undefined;
}

export async function requireApprover() {
  return requireAuth(["admin", "industrial_agent"]);
}

export async function requireAdmin() {
  return requireAuth(["admin"]);
}
