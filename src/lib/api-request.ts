import { NextResponse } from "next/server";

type ReadJsonOptions = {
  allowEmpty?: boolean;
  maxBytes?: number;
};

type ReadJsonResult<T> =
  | { ok: true; data: T }
  | { ok: false; response: NextResponse };

const defaultMaxJsonBytes = 16 * 1024;

function hasRequestBody(request: Request) {
  const contentLength = request.headers.get("content-length");
  return contentLength === null || contentLength !== "0";
}

export async function readJsonRequest<T = unknown>(
  request: Request,
  options: ReadJsonOptions = {}
): Promise<ReadJsonResult<T>> {
  const maxBytes = options.maxBytes ?? defaultMaxJsonBytes;
  const contentLength = request.headers.get("content-length");
  const parsedLength = contentLength ? Number(contentLength) : 0;

  if (Number.isFinite(parsedLength) && parsedLength > maxBytes) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "JSON payload is too large" },
        { status: 413 }
      ),
    };
  }

  if (options.allowEmpty && !hasRequestBody(request)) {
    return { ok: true, data: null as T };
  }

  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";
  if (!contentType.includes("application/json")) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Content-Type must be application/json" },
        { status: 415 }
      ),
    };
  }

  try {
    return { ok: true, data: (await request.json()) as T };
  } catch {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Invalid JSON payload" },
        { status: 400 }
      ),
    };
  }
}
