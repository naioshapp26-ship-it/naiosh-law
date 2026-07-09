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

export async function requireApprover() {
  return requireAuth(["admin", "industrial_agent"]);
}

export async function requireAdmin() {
  return requireAuth(["admin"]);
}
