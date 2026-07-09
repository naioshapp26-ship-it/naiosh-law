import { NextRequest } from "next/server";
import { sessionCookieName } from "@/data/auth";
import { jsonError, jsonResponse, readJsonBody } from "@/lib/api-response";
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
    const response = jsonError("Unauthenticated.", 401);
    if (token) {
      response.cookies.set(getExpiredSessionCookieOptions(request));
    }
    return { response };
  }
  if (user.role !== "admin") {
    return { response: jsonError("Forbidden.", 403) };
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
    return jsonError("Integration not found.", 404);
  }

  return jsonResponse({
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
    return jsonError("Integration not found.", 404);
  }

  const parsed = await readJsonBody<Record<string, unknown>>(request, { allowEmpty: true });
  if (!parsed.ok) {
    return parsed.response;
  }

  return jsonResponse(
    {
      integration,
      accepted: true,
      queuedAt: new Date().toISOString(),
    },
    { status: 202 }
  );
}
