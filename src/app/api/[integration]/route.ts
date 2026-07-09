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

type RouteContext = {
  params: Promise<{ integration: string }>;
};

async function getIntegration(context: RouteContext) {
  const { integration } = await context.params;
  return { slug: integration, config: integrationCatalog[integration] };
}

async function requireSession(request: Request) {
  const cookieStore = await cookies();
  const user = await decodeSession(cookieStore.get(sessionCookieName)?.value);

  if (user) {
    return user;
  }

  const response = NextResponse.json({ message: "Authentication required." }, { status: 401 });
  response.cookies.set(sessionCookieName, "", {
    ...getSessionCookieOptions(request),
    expires: new Date(0),
    maxAge: 0,
  });

  return response;
}

async function parseOptionalJson(request: Request) {
  const contentType = request.headers.get("content-type");

  if (!contentType) {
    return null;
  }

  if (!contentType.toLocaleLowerCase().includes("application/json")) {
    return NextResponse.json({ message: "Content-Type must be application/json." }, { status: 415 });
  }

  try {
    return await request.json();
  } catch {
    return NextResponse.json({ message: "Invalid JSON payload." }, { status: 400 });
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
  const session = await requireSession(request);
  if (session instanceof NextResponse) {
    return session;
  }

  const { slug, config } = await getIntegration(context);

  if (!config) {
    return NextResponse.json({ message: "Unknown integration endpoint." }, { status: 404 });
  }

  return NextResponse.json(healthPayload(slug, config));
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireSession(request);
  if (session instanceof NextResponse) {
    return session;
  }

  const { slug, config } = await getIntegration(context);

  if (!config) {
    return NextResponse.json({ message: "Unknown integration endpoint." }, { status: 404 });
  }

  const body = await parseOptionalJson(request);
  if (body instanceof NextResponse) {
    return body;
  }

  return NextResponse.json({
    ...healthPayload(slug, config),
    accepted: true,
    requestId: `${slug}-${Date.now()}`,
    echo: body,
  });
}
