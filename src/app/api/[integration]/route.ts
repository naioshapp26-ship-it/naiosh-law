import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { decodeSession, getSessionCookieOptions, sessionCookieName } from "@/lib/auth-session";
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

type RouteContext = {
  params: Promise<{ integration: string }>;
};

async function getIntegration(context: RouteContext) {
  const { integration } = await context.params;
  const slug = integration.toLowerCase();

  return { slug, config: integrationCatalog[slug] };
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

async function requireAdminSession(request: Request) {
  const session = await requireSession(request);

  if (session instanceof NextResponse) {
    return session;
  }

  if (session.role !== "admin") {
    return NextResponse.json({ message: "Admin access required." }, { status: 403 });
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
    return NextResponse.json({ message: "Unknown integration endpoint." }, { status: 404 });
  }

  return NextResponse.json(healthPayload(slug, config));
}

export async function POST(request: Request, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (session instanceof NextResponse) {
    return session;
  }

  const { slug, config } = await getIntegration(context);

  if (!config) {
    return NextResponse.json({ message: "Unknown integration endpoint." }, { status: 404 });
  }

  const parsedBody = await readJsonBody<Record<string, unknown>>(request, {
    optional: true,
    emptyBodyValue: {},
  });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  return NextResponse.json(
    {
      ...healthPayload(slug, config),
      accepted: true,
      requestId: `${slug}-${Date.now()}`,
      receivedFields: Object.keys(parsedBody.data).slice(0, 20),
    },
    { status: 202 }
  );
}
