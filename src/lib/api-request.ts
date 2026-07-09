import { NextResponse } from "next/server";

const defaultMaxJsonBodyBytes = 64 * 1024;

type JsonObjectResult =
  | { data: Record<string, unknown>; error?: never }
  | { data?: never; error: NextResponse };

export async function readJsonObject(
  request: Request,
  options: { maxBytes?: number } = {}
): Promise<JsonObjectResult> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    return {
      error: NextResponse.json(
        { ok: false, error: "Content-Type must be application/json" },
        { status: 415 }
      ),
    };
  }

  const rawBody = await request.text();
  const maxBytes = options.maxBytes ?? defaultMaxJsonBodyBytes;
  if (new TextEncoder().encode(rawBody).byteLength > maxBytes) {
    return {
      error: NextResponse.json(
        { ok: false, error: "JSON payload is too large" },
        { status: 413 }
      ),
    };
  }

  try {
    const parsed = JSON.parse(rawBody) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        error: NextResponse.json(
          { ok: false, error: "Payload must be a JSON object" },
          { status: 400 }
        ),
      };
    }

    return { data: parsed as Record<string, unknown> };
  } catch {
    return {
      error: NextResponse.json(
        { ok: false, error: "Invalid JSON payload" },
        { status: 400 }
      ),
    };
  }
}
