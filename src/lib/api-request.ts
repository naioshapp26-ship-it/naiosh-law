import { NextRequest, NextResponse } from "next/server";

const defaultMaxBodyBytes = 64 * 1024;

export type JsonBodyResult =
  | { ok: true; data: unknown }
  | { ok: false; response: NextResponse };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function payloadTooLarge(maxBytes: number) {
  return NextResponse.json(
    { error: "payload_too_large", message: `Request body exceeds ${Math.round(maxBytes / 1024)}KB.` },
    { status: 413 }
  );
}

async function readLimitedText(request: NextRequest, maxBytes: number): Promise<JsonBodyResult & { text?: string }> {
  const reader = request.body?.getReader();
  if (!reader) return { ok: true, data: {}, text: "" };

  const chunks: Uint8Array[] = [];
  let receivedBytes = 0;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    receivedBytes += value.byteLength;
    if (receivedBytes > maxBytes) {
      return { ok: false, response: payloadTooLarge(maxBytes) };
    }
    chunks.push(value);
  }

  const body = new Uint8Array(receivedBytes);
  let offset = 0;
  chunks.forEach((chunk) => {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  });

  return { ok: true, data: {}, text: new TextDecoder().decode(body) };
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
      response: payloadTooLarge(maxBytes),
    };
  }

  const limitedBody = await readLimitedText(request, maxBytes);
  if (!limitedBody.ok) return limitedBody;

  const body = limitedBody.text ?? "";
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
