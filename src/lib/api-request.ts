import { NextResponse } from "next/server";

type JsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

type ReadJsonOptions<T> = {
  optional?: boolean;
  emptyBodyValue?: T;
  maxBytes?: number;
};

const defaultMaxJsonBytes = 64 * 1024;
const jsonContentType = "application/json";
const textEncoder = new TextEncoder();

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function hasJsonContentType(request: Request) {
  const mediaType = request.headers.get("content-type")?.split(";")[0]?.trim().toLocaleLowerCase();
  return mediaType === jsonContentType;
}

export async function readJsonBody<T>(
  request: Request,
  { optional = false, emptyBodyValue, maxBytes = defaultMaxJsonBytes }: ReadJsonOptions<T> = {}
): Promise<JsonResult<T>> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");

  if (Number.isFinite(contentLength) && contentLength > maxBytes) {
    return { ok: false, response: jsonError("JSON payload is too large.", 413) };
  }

  if (!hasJsonContentType(request)) {
    if (optional && !request.headers.get("content-type")) {
      return { ok: true, data: emptyBodyValue as T };
    }

    return { ok: false, response: jsonError("Content-Type must be application/json.", 415) };
  }

  let rawBody: string;

  try {
    rawBody = await request.text();
  } catch {
    return { ok: false, response: jsonError("Invalid JSON payload.", 400) };
  }

  if (textEncoder.encode(rawBody).byteLength > maxBytes) {
    return { ok: false, response: jsonError("JSON payload is too large.", 413) };
  }

  if (!rawBody.trim()) {
    if (optional) {
      return { ok: true, data: emptyBodyValue as T };
    }

    return { ok: false, response: jsonError("Invalid JSON payload.", 400) };
  }

  try {
    return { ok: true, data: JSON.parse(rawBody) as T };
  } catch {
    return { ok: false, response: jsonError("Invalid JSON payload.", 400) };
  }
}
