import { NextResponse } from "next/server";

const defaultJsonLimitBytes = 16 * 1024;
const textEncoder = new TextEncoder();

type JsonBodyOptions = {
  required?: boolean;
  maxBytes?: number;
};

type JsonBodyResult<T> =
  | { ok: true; data: T | null }
  | { ok: false; response: NextResponse };

function hasJsonContentType(request: Request) {
  return request.headers.get("content-type")?.toLowerCase().includes("application/json") ?? false;
}

export async function readJsonBody<T = unknown>(
  request: Request,
  { required = true, maxBytes = defaultJsonLimitBytes }: JsonBodyOptions = {}
): Promise<JsonBodyResult<T>> {
  if (!hasJsonContentType(request)) {
    if (!required && !request.headers.has("content-type")) {
      return { ok: true, data: null };
    }

    return {
      ok: false,
      response: NextResponse.json({ message: "Content-Type must be application/json." }, { status: 415 }),
    };
  }

  const contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ message: "JSON payload is too large." }, { status: 413 }),
    };
  }

  const rawBody = await request.text();
  if (textEncoder.encode(rawBody).byteLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json({ message: "JSON payload is too large." }, { status: 413 }),
    };
  }

  if (!rawBody.trim()) {
    return required
      ? {
          ok: false,
          response: NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 }),
        }
      : { ok: true, data: null };
  }

  try {
    return { ok: true, data: JSON.parse(rawBody) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 }),
    };
  }
}
