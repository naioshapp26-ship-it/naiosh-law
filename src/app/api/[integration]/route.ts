import { NextRequest, NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { getExpiredSessionCookieOptions } from "@/lib/session-cookie";
import { verifySessionToken } from "@/lib/session-token";

const integrations = new Set(["sms", "email", "payments", "sign", "courts", "tax", "ocr", "analytics"]);

type Props = {
  params: Promise<{ integration: string }>;
};

async function requireAdmin(request: NextRequest) {
  const token = request.cookies.get(sessionCookieName)?.value;
  const user = await verifySessionToken(token);
  if (!user) {
    const response = NextResponse.json({ error: "Unauthenticated." }, { status: 401 });
    if (token) {
      response.cookies.set(getExpiredSessionCookieOptions(request));
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

  const integration = (await params).integration.toLowerCase();
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

  const integration = (await params).integration.toLowerCase();
  if (!integrations.has(integration)) {
    return NextResponse.json({ error: "Integration not found." }, { status: 404 });
  }

  const contentType = request.headers.get("content-type") || "";
  if (contentType) {
    if (!contentType.toLowerCase().includes("application/json")) {
      return NextResponse.json({ error: "Content-Type must be application/json." }, { status: 415 });
    }
    try {
      await request.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
    }
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
