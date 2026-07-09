import { NextResponse } from "next/server";
import { getSessionFromCookies, canWrite } from "@/lib/auth";
import type { UserRole } from "@/generated/prisma/client";

const JSON_BODY_LIMIT_BYTES = 64 * 1024;

type JsonParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

function noStoreHeaders(headers?: HeadersInit) {
  const responseHeaders = new Headers(headers);
  responseHeaders.set("Cache-Control", "private, no-store");
  return responseHeaders;
}

export function jsonResponse<T>(body: T, init: ResponseInit = {}) {
  return NextResponse.json(body, {
    ...init,
    headers: noStoreHeaders(init.headers),
  });
}

export async function requireAuth(roles?: UserRole[]) {
  const session = await getSessionFromCookies();
  if (!session) {
    return { error: jsonError("غير مصرح", 401), session: null };
  }
  if (roles && !roles.includes(session.role)) {
    return { error: jsonError("صلاحية غير كافية", 403), session: null };
  }
  return { error: null, session };
}

export async function requireWrite() {
  const result = await requireAuth();
  if (result.error) return result;
  if (!canWrite(result.session!.role)) {
    return { error: jsonError("صلاحية القراءة فقط", 403), session: null };
  }
  return result;
}

export function jsonError(message: string, status = 400) {
  return jsonResponse({ error: message }, { status });
}

export async function readJsonBody<T>(
  request: Request,
  { allowEmpty = false }: { allowEmpty?: boolean } = {}
): Promise<JsonParseResult<T>> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, response: jsonError("Content-Type must be application/json.", 415) };
  }

  let raw: string;
  try {
    raw = await request.text();
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body.", 400) };
  }

  if (raw.length > JSON_BODY_LIMIT_BYTES) {
    return { ok: false, response: jsonError("JSON body is too large.", 413) };
  }

  if (!raw.trim()) {
    if (allowEmpty) {
      return { ok: true, data: {} as T };
    }
    return { ok: false, response: jsonError("Invalid JSON body.", 400) };
  }

  try {
    return { ok: true, data: JSON.parse(raw) as T };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body.", 400) };
  }
}
