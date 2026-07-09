import { NextRequest, NextResponse } from "next/server";

const MAX_BODY_BYTES = 64 * 1024;

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

async function readJsonBody(request: NextRequest) {
  const contentType = request.headers.get("content-type");

  if (contentType && !contentType.toLowerCase().includes("application/json")) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "unsupported_media_type", message: "Only application/json is supported." },
        { status: 415 }
      ),
    };
  }

  const body = await request.text();
  if (!body.trim()) {
    return { ok: true as const, data: {} };
  }

  if (new TextEncoder().encode(body).byteLength > MAX_BODY_BYTES) {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "payload_too_large", message: "Request body exceeds 64KB." },
        { status: 413 }
      ),
    };
  }

  try {
    return { ok: true as const, data: JSON.parse(body) as Record<string, unknown> };
  } catch {
    return {
      ok: false as const,
      response: NextResponse.json(
        { error: "invalid_json", message: "Request body must be valid JSON." },
        { status: 400 }
      ),
    };
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const { integration } = await context.params;
  const meta = integrations[integration];

  if (!meta) {
    return integrationNotFound(integration);
  }

  return NextResponse.json({
    integration,
    ...meta,
    status: "connected",
    successRate: "99.2%",
    checkedAt: new Date().toISOString(),
  });
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { integration } = await context.params;
  const meta = integrations[integration];

  if (!meta) {
    return integrationNotFound(integration);
  }

  const body = await readJsonBody(request);
  if (!body.ok) {
    return body.response;
  }

  return NextResponse.json(
    {
      integration,
      ...meta,
      status: "accepted",
      receivedFields: Object.keys(body.data),
    },
    { status: 202 }
  );
}

