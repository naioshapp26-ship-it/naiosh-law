import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import {
  SessionConfigurationError,
  decodeSession,
  getSessionCookieOptions,
  sessionCookieName,
} from "@/lib/auth-session";
import { readJsonBody } from "@/lib/api-request";

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

const integrationResponseHeaders = {
  "Cache-Control": "no-store, private",
  Vary: "Cookie",
};

type RouteContext = {
  params: Promise<{ integration: string }>;
};

async function getIntegration(context: RouteContext) {
  const { integration } = await context.params;
  const slug = integration.trim().toLowerCase();

  return { slug, config: integrationCatalog[slug] };
}

async function requireSession(request: Request) {
  const cookieStore = await cookies();
  let user;

  try {
    user = await decodeSession(cookieStore.get(sessionCookieName)?.value);
  } catch (error) {
    if (error instanceof SessionConfigurationError) {
      return NextResponse.json(
        { message: "Authentication is not configured." },
        { status: 503, headers: integrationResponseHeaders }
      );
    }

    throw error;
  }

  if (user) {
    return user;
  }

  const response = NextResponse.json(
    { message: "Authentication required." },
    { status: 401, headers: integrationResponseHeaders }
  );
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
    return NextResponse.json(
      { message: "Admin access required." },
      { status: 403, headers: integrationResponseHeaders }
    );
  }

  return session;
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
    return NextResponse.json(
      { message: "Unknown integration endpoint." },
      { status: 404, headers: integrationResponseHeaders }
    );
  }

  return NextResponse.json(healthPayload(slug, config), { headers: integrationResponseHeaders });
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (session instanceof NextResponse) {
    return session;
  }

  const { slug, config } = await getIntegration(context);

  if (!config) {
    return NextResponse.json(
      { message: "Unknown integration endpoint." },
      { status: 404, headers: integrationResponseHeaders }
    );
  }

  const parsedBody = await readJsonBody<Record<string, unknown>>(request, {
    allowEmptyBody: true,
    emptyBodyValue: {},
    limitBytes: 32 * 1024,
  });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  return NextResponse.json({
    ...healthPayload(slug, config),
    accepted: true,
    requestId: `${slug}-${Date.now()}`,
  }, { status: 202, headers: integrationResponseHeaders });
}
