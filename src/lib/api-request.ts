import { NextResponse } from "next/server";

type JsonParseOptions = {
  required?: boolean;
  maxBytes?: number;
};

type JsonParseResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse<{ error: string }> };

const defaultMaxBytes = 64 * 1024;
const textDecoder = new TextDecoder();

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status });
}

async function readCappedBody(request: Request, maxBytes: number) {
  if (!request.body) {
    return { ok: true as const, body: "" };
  }

  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        break;
      }

      totalBytes += value.byteLength;
      if (totalBytes > maxBytes) {
        await reader.cancel();
        return { ok: false as const, response: jsonError("Request body is too large.", 413) };
      }
      chunks.push(value);
    }
  } catch {
    return { ok: false as const, response: jsonError("Unable to read request body.", 400) };
  }

  const body = new Uint8Array(totalBytes);
  let offset = 0;
  chunks.forEach((chunk) => {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return { ok: true as const, body: textDecoder.decode(body) };
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

  const rawBodyResult = await readCappedBody(request, maxBytes);
  if (!rawBodyResult.ok) {
    return rawBodyResult;
  }
  const rawBody = rawBodyResult.body;

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
