import { NextResponse } from "next/server";

const encoder = new TextEncoder();

type JsonRequestOptions = {
  required?: boolean;
  limitBytes?: number;
};

function isJsonContentType(contentType: string) {
  const mediaType = contentType.split(";")[0]?.trim().toLowerCase() ?? "";
  return mediaType === "application/json" || mediaType.endsWith("+json");
}

function contentLengthExceedsLimit(request: Request, limitBytes: number) {
  const contentLength = request.headers.get("content-length");
  if (!contentLength) {
    return false;
  }

  const parsed = Number(contentLength);
  return Number.isFinite(parsed) && parsed > limitBytes;
}

export async function readJsonRequest<T>(
  request: Request,
  { required = true, limitBytes = 64 * 1024 }: JsonRequestOptions = {}
): Promise<T | null | NextResponse> {
  const contentType = request.headers.get("content-type");

  if (contentLengthExceedsLimit(request, limitBytes)) {
    return NextResponse.json({ message: "JSON payload is too large." }, { status: 413 });
  }

  if (!contentType) {
    return required ? NextResponse.json({ message: "Content-Type must be application/json." }, { status: 415 }) : null;
  }

  if (!isJsonContentType(contentType)) {
    return NextResponse.json({ message: "Content-Type must be application/json." }, { status: 415 });
  }

  const text = await request.text();

  if (encoder.encode(text).byteLength > limitBytes) {
    return NextResponse.json({ message: "JSON payload is too large." }, { status: 413 });
  }

  if (!text.trim()) {
    return required ? NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 }) : null;
  }

  try {
    return JSON.parse(text) as T;
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
  }
}
