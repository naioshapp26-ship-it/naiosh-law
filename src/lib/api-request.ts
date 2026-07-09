import { NextResponse } from "next/server";

type ReadJsonOptions = {
  allowEmpty?: boolean;
  maxBytes?: number;
};

type ReadJsonResult =
  | { ok: true; data: Record<string, unknown> | null }
  | { ok: false; response: NextResponse };

const defaultMaxJsonBytes = 16 * 1024;
const textEncoder = new TextEncoder();

function jsonError(message: string, status: number) {
  return NextResponse.json({ ok: false, error: message }, { status });
}

function isJsonContentType(value: string | null) {
  if (!value) {
    return false;
  }

  const type = value.split(";")[0]?.trim().toLowerCase();
  return type === "application/json" || Boolean(type?.endsWith("+json"));
}

function getContentLength(request: Request) {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) {
    return null;
  }

  const length = Number(rawLength);
  return Number.isFinite(length) && length >= 0 ? length : null;
}

export async function readJsonObject(
  request: Request,
  { allowEmpty = false, maxBytes = defaultMaxJsonBytes }: ReadJsonOptions = {}
): Promise<ReadJsonResult> {
  const contentLength = getContentLength(request);
  if (contentLength !== null && contentLength > maxBytes) {
    return { ok: false, response: jsonError("JSON payload is too large", 413) };
  }

  const contentType = request.headers.get("content-type");
  const hasJsonContentType = isJsonContentType(contentType);
  if (!hasJsonContentType && !allowEmpty) {
    return { ok: false, response: jsonError("Content-Type must be application/json", 415) };
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, response: jsonError("Unable to read request body", 400) };
  }

  if (textEncoder.encode(rawBody).byteLength > maxBytes) {
    return { ok: false, response: jsonError("JSON payload is too large", 413) };
  }

  if (!rawBody.trim()) {
    if (allowEmpty) {
      return { ok: true, data: null };
    }

    return { ok: false, response: jsonError("JSON payload is required", 400) };
  }

  if (!hasJsonContentType) {
    return { ok: false, response: jsonError("Content-Type must be application/json", 415) };
  }

  try {
    const data = JSON.parse(rawBody) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) {
      return { ok: false, response: jsonError("Payload must be a JSON object", 400) };
    }

    return { ok: true, data: data as Record<string, unknown> };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON payload", 400) };
  }
}
