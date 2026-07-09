import { NextResponse } from "next/server";
import { readJsonObject } from "@/lib/api-request";
import {
  getCookieValue,
  readSessionToken,
  sessionCookieName,
} from "@/lib/session-shared";

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

async function requireAdminSession(request: Request) {
  const token = getCookieValue(request.headers.get("cookie"), sessionCookieName);
  const user = await readSessionToken(token);

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Authentication required" },
        { status: 401 }
      ),
    } as const;
  }

  if (user.role !== "admin") {
    return {
      ok: false,
      response: NextResponse.json(
        { ok: false, error: "Admin access required" },
        { status: 403 }
      ),
    } as const;
  }

  return { ok: true, user } as const;
}

export async function GET(request: Request, { params }: RouteContext) {
  const session = await requireAdminSession(request);
  if (!session.ok) {
    return session.response;
  }

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
  const session = await requireAdminSession(request);
  if (!session.ok) {
    return session.response;
  }

  const { integration } = await params;
  const config = getIntegration(integration);

  if (!config) {
    return NextResponse.json(
      { ok: false, error: "Unknown integration endpoint" },
      { status: 404 }
    );
  }

  const parsedPayload = await readJsonObject(request, { allowEmpty: true });
  if (!parsedPayload.ok) {
    return parsedPayload.response;
  }

  return NextResponse.json(
    {
      ok: true,
      endpoint: `/api/${integration}`,
      acceptedAt: new Date().toISOString(),
      integration: config.name,
      payload: parsedPayload.data ?? {},
    },
    { status: 202 }
  );
}
