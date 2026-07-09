import { NextResponse } from "next/server";
import { readJsonRequest } from "@/lib/api-request";

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

  const body = await readJsonRequest(request, { allowEmpty: true });
  if (!body.ok) {
    return body.response;
  }

  return NextResponse.json(
    {
      ok: true,
      endpoint: `/api/${integration}`,
      acceptedAt: new Date().toISOString(),
      integration: config.name,
      payload: body.data,
    },
    { status: 202 }
  );
}
