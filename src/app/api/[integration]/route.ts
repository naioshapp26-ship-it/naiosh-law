import { NextRequest, NextResponse } from "next/server";
import { isRecord, readJsonBody } from "@/lib/api-request";
import {
  decodeSessionToken,
  getExpiredSessionCookieOptions,
  SessionConfigError,
  sessionCookieName,
} from "@/lib/session-token";

const integrations: Record<string, { name: string; type: string }> = {
  sms: { name: "SMS Gateway", type: "رسائل نصية" },
  email: { name: "Email Provider", type: "بريد إلكتروني" },
  payments: { name: "Payment Gateway", type: "مدفوعات" },
  sign: { name: "E-Signature", type: "توقيع إلكتروني" },
  courts: { name: "Court API", type: "بيانات محاكم" },
  tax: { name: "Tax Authority", type: "ضريبي" },
  ocr: { name: "Document OCR", type: "معالجة مستندات" },
  analytics: { name: "Analytics", type: "تحليلات" },
};

type RouteContext = {
  params: Promise<{ integration: string }>;
};

function integrationNotFound(integration: string) {
  return NextResponse.json(
    { error: "integration_not_found", message: `Unknown integration: ${integration}` },
    { status: 404 }
  );
}

function normalizeIntegrationSlug(integration: string) {
  return integration.trim().toLowerCase();
}

async function requireAdminSession(request: NextRequest) {
  try {
    const user = await decodeSessionToken(request.cookies.get(sessionCookieName)?.value);
    if (!user) {
      const response = NextResponse.json(
        { error: "unauthorized", message: "A valid session is required." },
        { status: 401 }
      );
      response.cookies.set(sessionCookieName, "", getExpiredSessionCookieOptions(request));
      return {
        ok: false as const,
        response,
      };
    }
    if (user.role !== "admin") {
      return {
        ok: false as const,
        response: NextResponse.json(
          { error: "forbidden", message: "Admin access is required for integrations." },
          { status: 403 }
        ),
      };
    }
    return { ok: true as const };
  } catch (error) {
    if (error instanceof SessionConfigError) {
      return {
        ok: false as const,
        response: NextResponse.json(
          { error: "session_configuration_error", message: error.message },
          { status: 503 }
        ),
      };
    }
    throw error;
  }
}

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  const { integration } = await context.params;
  const integrationSlug = normalizeIntegrationSlug(integration);
  const meta = integrations[integrationSlug];

  if (!meta) {
    return integrationNotFound(integration);
  }

  return NextResponse.json({
    integration: integrationSlug,
    ...meta,
    status: "connected",
    successRate: "99.2%",
    checkedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await requireAdminSession(request);
  if (!session.ok) return session.response;

  const { integration } = await context.params;
  const integrationSlug = normalizeIntegrationSlug(integration);
  const meta = integrations[integrationSlug];

  if (!meta) {
    return integrationNotFound(integration);
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }
  if (!isRecord(body.data)) {
    return NextResponse.json(
      { error: "invalid_payload", message: "Request body must be a JSON object." },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      integration: integrationSlug,
      ...meta,
      status: "accepted",
      receivedFields: Object.keys(body.data),
    },
    { status: 202 }
  );
}

