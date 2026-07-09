import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { parseJsonRequest } from "@/lib/api-request";
import { clearSessionCookie } from "@/lib/auth-session";
import { verifySessionToken } from "@/lib/session-token";

const integrations = new Set(["sms", "email", "payments", "sign", "courts", "tax", "ocr", "analytics"]);

type Props = {
  params: Promise<{ integration: string }>;
};

async function requireAdmin(request: NextRequest) {
  const user = await verifySessionToken(request.cookies.get(sessionCookieName)?.value);
  if (!user) {
    const response = NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    if (request.cookies.has(sessionCookieName)) {
      clearSessionCookie(response, request);
    }
    return { response };
  }
  if (user.role !== "admin") {
    return { response: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }
  return { user };
}

export async function GET(request: NextRequest, { params }: Props) {
  const auth = await requireAdmin(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { integration: rawIntegration } = await params;
  const integration = rawIntegration.toLowerCase();
  if (!integrations.has(integration)) {
    return NextResponse.json({ error: "Integration not found." }, { status: 404 });
  }

  return NextResponse.json({
    integration,
    status: "connected",
    checkedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest, { params }: Props) {
  const auth = await requireAdmin(request);
  if ("response" in auth) {
    return auth.response;
  }

  const { integration: rawIntegration } = await params;
  const integration = rawIntegration.toLowerCase();
  if (!integrations.has(integration)) {
    return NextResponse.json({ error: "Integration not found." }, { status: 404 });
  }

  const parsedBody = await parseJsonRequest(request, { required: false });
  if (!parsedBody.ok) {
    return parsedBody.response;
  }

  return NextResponse.json(
    {
      integration,
      accepted: true,
      queuedAt: new Date().toISOString(),
    },
    { status: 202 }
  );
}
