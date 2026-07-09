import { NextResponse } from "next/server";
import { getSessionFromCookies, canWrite } from "@/lib/auth";
import { Prisma, type UserRole } from "@/generated/prisma/client";

type JsonObject = Record<string, unknown>;
type FieldLabel = { field: string; label: string };

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

export function requiredString(body: JsonObject, { field, label }: FieldLabel) {
  const value = String(body[field] ?? "").trim();
  if (!value) {
    return {
      value: "",
      error: jsonError(`${label} مطلوب`, 400),
    };
  }
  return { value, error: null };
}

export function nullableString(value: unknown) {
  const text = String(value ?? "").trim();
  return text || null;
}

export function handleApiError(error: unknown, context: string) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2025") {
      return jsonError("غير موجود", 404);
    }
    if (error.code === "P2002") {
      return jsonError("يوجد سجل بنفس البيانات الفريدة", 409);
    }
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    console.error(`${context}: database initialization failed`, error);
    return jsonError("قاعدة البيانات غير متاحة حالياً", 503);
  }

  if (error instanceof Error && error.message.includes("DATABASE_URL")) {
    console.error(`${context}: database configuration missing`, error);
    return jsonError("إعدادات قاعدة البيانات غير مكتملة", 503);
  }

  console.error(`${context}:`, error);
  return jsonError("خطأ في الخادم", 500);
}

export async function withApiError(action: () => Promise<NextResponse>, context: string) {
  try {
    return await action();
  } catch (error) {
    return handleApiError(error, context);
  }
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
