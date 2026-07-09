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

function jsonError(message: string, status: number) {
  return NextResponse.json({ message }, { status });
}

function hasJsonContentType(request: Request) {
  return request.headers.get("content-type")?.toLowerCase().includes(jsonContentType) ?? false;
}

async function readTextWithByteLimit(request: Request, maxBytes: number): Promise<JsonResult<string>> {
  if (!request.body) {
    return { ok: true, data: "" };
  }

  const reader = request.body.getReader();
  const decoder = new TextDecoder();
  let receivedBytes = 0;
  let body = "";

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        break;
      }

      receivedBytes += value.byteLength;
      if (receivedBytes > maxBytes) {
        await reader.cancel();
        return { ok: false, response: jsonError("JSON payload is too large.", 413) };
      }

      body += decoder.decode(value, { stream: true });
    }

    body += decoder.decode();
  } finally {
    reader.releaseLock();
  }

  return { ok: true, data: body };
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

  const rawBodyResult = await readTextWithByteLimit(request, maxBytes);
  if (!rawBodyResult.ok) {
    return rawBodyResult;
  }
  const rawBody = rawBodyResult.data;

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
