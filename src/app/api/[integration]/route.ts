import { NextResponse } from "next/server";
import { sessionCookieName } from "@/data/auth";

export const dynamic = "force-dynamic";

const integrations = {
  sms: { name: "SMS Gateway", type: "رسائل نصية", status: "متصل" },
  email: { name: "Email Provider", type: "بريد إلكتروني", status: "متصل" },
  payments: { name: "Payment Gateway", type: "مدفوعات", status: "متصل" },
  sign: { name: "E-Signature", type: "توقيع إلكتروني", status: "متصل" },
  courts: { name: "Court API", type: "بيانات محاكم", status: "تحذير" },
  tax: { name: "Tax Authority", type: "ضريبي", status: "متصل" },
  ocr: { name: "Document OCR", type: "معالجة مستندات", status: "متصل" },
  analytics: { name: "Analytics", type: "تحليلات", status: "متصل" },
} as const;

type IntegrationSlug = keyof typeof integrations;
type RouteContext = { params: Promise<{ integration: string }> };

function getIntegration(slug: string) {
  if (slug in integrations) {
    return integrations[slug as IntegrationSlug];
  }
  return null;
}

function hasSessionCookie(request: Request) {
  const cookieHeader = request.headers.get("cookie") ?? "";
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith(`${sessionCookieName}=`));
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { integration } = await params;
  const config = getIntegration(integration);

  if (!config) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unknown integration endpoint",
        supported: Object.keys(integrations).map((slug) => `/api/${slug}`),
      },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    endpoint: `/api/${integration}`,
    checkedAt: new Date().toISOString(),
    ...config,
  });
}

export async function POST(request: Request, { params }: RouteContext) {
  const { integration } = await params;
  const config = getIntegration(integration);

  if (!config) {
    return NextResponse.json(
      { ok: false, error: "Unknown integration endpoint" },
      { status: 404 }
    );
  }

  if (!hasSessionCookie(request)) {
    return NextResponse.json(
      { ok: false, error: "Authentication required" },
      { status: 401 }
    );
  }

  let payload: unknown = null;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON payload" },
      { status: 400 }
    );
  }

  if (payload !== null && (typeof payload !== "object" || Array.isArray(payload))) {
    return NextResponse.json(
      { ok: false, error: "Payload must be a JSON object" },
      { status: 400 }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      endpoint: `/api/${integration}`,
      acceptedAt: new Date().toISOString(),
      integration: config.name,
      payload,
    },
    { status: 202 }
  );
}
