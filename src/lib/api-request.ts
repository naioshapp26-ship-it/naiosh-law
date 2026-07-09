import { NextRequest, NextResponse } from "next/server";

const defaultMaxBodyBytes = 64 * 1024;

export type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function readJsonBody(
  request: NextRequest,
  options: { maxBytes?: number; allowEmpty?: boolean } = {}
): Promise<JsonBodyResult> {
  const maxBytes = options.maxBytes ?? defaultMaxBodyBytes;
  const allowEmpty = options.allowEmpty ?? true;
  const contentType = request.headers.get("content-type");

  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "unsupported_media_type", message: "Only application/json is supported." },
        { status: 415 }
      ),
    };
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "payload_too_large", message: `Request body exceeds ${Math.round(maxBytes / 1024)}KB.` },
        { status: 413 }
      ),
    };
  }

  const body = await request.text();
  if (!body.trim()) {
    if (allowEmpty) return { ok: true, data: {} };
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid_json", message: "Request body must be valid JSON." },
        { status: 400 }
      ),
    };
  }

  if (new TextEncoder().encode(body).byteLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "payload_too_large", message: `Request body exceeds ${Math.round(maxBytes / 1024)}KB.` },
        { status: 413 }
      ),
    };
  }

  try {
    return { ok: true, data: JSON.parse(body) };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { error: "invalid_json", message: "Request body must be valid JSON." },
        { status: 400 }
      ),
    };
  }
}
