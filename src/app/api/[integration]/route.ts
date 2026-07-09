import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, getSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";

const integrationCatalog: Record<string, { name: string; latencyMs: number }> = {
  sms: { name: "SMS Gateway", latencyMs: 142 },
  email: { name: "Email Provider", latencyMs: 96 },
  payments: { name: "Payment Gateway", latencyMs: 188 },
  sign: { name: "E-Signature", latencyMs: 164 },
  courts: { name: "Court API", latencyMs: 231 },
  tax: { name: "Tax Authority", latencyMs: 119 },
  ocr: { name: "Document OCR", latencyMs: 276 },
  analytics: { name: "Analytics", latencyMs: 84 },
};

const noStoreHeaders = { "Cache-Control": "no-store" };

type RouteContext = {
  params: Promise<{ integration: string }>;
};

function jsonResponse(body: unknown, status?: number) {
  return NextResponse.json(body, { status, headers: noStoreHeaders });
}

async function getIntegration(context: RouteContext) {
  const { integration } = await context.params;
  const slug = integration.trim().toLowerCase();
  return { slug, config: integrationCatalog[slug] };
}

async function requireSession(request: Request) {
  const cookieStore = await cookies();
  const user = await decodeSession(cookieStore.get(sessionCookieName)?.value);

  if (user) {
    return user;
  }

  const response = jsonResponse({ message: "Authentication required." }, 401);
  response.cookies.set(sessionCookieName, "", {
    ...getSessionCookieOptions(request),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}

async function requireAdminSession(request: Request) {
  const session = await requireSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  if (session.role !== "admin") {
    return jsonResponse({ message: "Admin access required." }, 403);
  }

  return session;
}

async function parseOptionalJson(request: Request) {
  const contentType = request.headers.get("content-type");

  if (!contentType) {
    return null;
  }

  if (!contentType.toLowerCase().includes("application/json")) {
    return jsonResponse({ message: "Content-Type must be application/json." }, 415);
  }

  try {
    const text = await request.text();
    return text.trim() ? JSON.parse(text) : null;
  } catch {
    return jsonResponse({ message: "Invalid JSON payload." }, 400);
  }
}

function healthPayload(slug: string, config: { name: string; latencyMs: number }) {
  return {
    ok: true,
    integration: slug,
    name: config.name,
    status: "connected",
    latencyMs: config.latencyMs,
    checkedAt: new Date().toISOString(),
  };
}

export async function GET(request: Request, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (session instanceof NextResponse) {
    return session;
  }

  const { slug, config } = await getIntegration(context);

  if (!config) {
    return jsonResponse({ message: "Unknown integration endpoint." }, 404);
  }

  return jsonResponse(healthPayload(slug, config));
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (session instanceof NextResponse) {
    return session;
  }

  const { slug, config } = await getIntegration(context);

  if (!config) {
    return jsonResponse({ message: "Unknown integration endpoint." }, 404);
  }

  const body = await parseOptionalJson(request);
  if (body instanceof NextResponse) {
    return body;
  }

  return jsonResponse(
    {
      ...healthPayload(slug, config),
      accepted: true,
      requestId: `${slug}-${crypto.randomUUID()}`,
      payloadReceived: body !== null,
    },
    202
  );
}
