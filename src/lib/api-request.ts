import { NextResponse } from "next/server";

type ReadJsonOptions<T> = {
  allowEmptyBody?: boolean;
  emptyBodyValue?: T;
  limitBytes?: number;
};

type JsonReadResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

const jsonContentTypePattern = /(^application\/json$|\+json$)/u;
const encoder = new TextEncoder();

function isJsonContentType(contentType: string) {
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return jsonContentTypePattern.test(mediaType);
}

function getContentLength(request: Request) {
  const rawLength = request.headers.get("content-length");
  if (!rawLength) {
    return null;
  }

  const parsedLength = Number(rawLength);
  return Number.isFinite(parsedLength) && parsedLength >= 0 ? parsedLength : null;
}

export async function readJsonBody<T>(
  request: Request,
  {
    allowEmptyBody = false,
    emptyBodyValue,
    limitBytes = 16 * 1024,
  }: ReadJsonOptions<T> = {}
): Promise<JsonReadResult<T>> {
  const contentLength = getContentLength(request);

  if (contentLength !== null && contentLength > limitBytes) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Request body is too large." }, { status: 413 }),
    };
  }

  let rawBody: string;
  try {
    rawBody = await request.text();
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ message: "Unable to read request body." }, { status: 400 }),
    };
  }

  if (encoder.encode(rawBody).byteLength > limitBytes) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Request body is too large." }, { status: 413 }),
    };
  }

  if (!rawBody.trim()) {
    if (allowEmptyBody) {
      return { ok: true, data: emptyBodyValue as T };
    }

    return {
      ok: false,
      response: NextResponse.json({ message: "JSON request body is required." }, { status: 400 }),
    };
  }

  const contentType = request.headers.get("content-type");
  if (!contentType || !isJsonContentType(contentType)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Content-Type must be application/json." }, { status: 415 }),
    };
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
