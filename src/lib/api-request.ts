import { NextResponse } from "next/server";

type JsonParseOptions = {
  required?: boolean;
  maxBytes?: number;
};

type JsonParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<{ error: string }> };

const defaultMaxBytes = 64 * 1024;
const encoder = new TextEncoder();

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

export async function parseJsonRequest<T = unknown>(
  request: Request,
  { required = true, maxBytes = defaultMaxBytes }: JsonParseOptions = {}
): Promise<JsonParseResult<T>> {
  const contentType = request.headers.get("content-type") || "";

  if (!contentType) {
    if (!required) {
      return { ok: true, data: {} as T };
    }
    return { ok: false, response: jsonError("Content-Type must be application/json.", 415) };
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return { ok: false, response: jsonError("Content-Type must be application/json.", 415) };
  }

  const contentLength = Number(request.headers.get("content-length") || "0");
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, response: jsonError("Request body is too large.", 413) };
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, response: jsonError("Unable to read request body.", 400) };
  }

  if (encoder.encode(rawBody).byteLength > maxBytes) {
    return { ok: false, response: jsonError("Request body is too large.", 413) };
  }

  if (!rawBody.trim()) {
    if (!required) {
      return { ok: true, data: {} as T };
    }
    return { ok: false, response: jsonError("Invalid JSON body.", 400) };
  }

  try {
    return { ok: true, data: JSON.parse(rawBody) as T };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON body.", 400) };
  }
}
