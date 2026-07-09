import { NextResponse } from "next/server";

const serviceCatalog = {
  sms: { name: "SMS Gateway", capability: "transactional messaging" },
  email: { name: "Email Provider", capability: "email delivery" },
  payments: { name: "Payment Gateway", capability: "payment processing" },
  sign: { name: "E-Signature", capability: "digital signatures" },
  courts: { name: "Court API", capability: "court data sync" },
  tax: { name: "Tax Authority", capability: "tax authority integration" },
  ocr: { name: "Document OCR", capability: "document processing" },
  analytics: { name: "Analytics", capability: "usage analytics" },
} as const;

type ServiceKey = keyof typeof serviceCatalog;
type RouteContext = {
  params: Promise<{ service: string }>;
};

async function resolveService(context: RouteContext) {
  const { service } = await context.params;
  const normalized = service.toLowerCase();

  if (!Object.hasOwn(serviceCatalog, normalized)) {
    return null;
  }

  return {
    key: normalized as ServiceKey,
    ...serviceCatalog[normalized as ServiceKey],
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const service = await resolveService(context);

  if (!service) {
    return NextResponse.json(
      { ok: false, error: "Unsupported integration service." },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    service: service.key,
    name: service.name,
    capability: service.capability,
    status: "connected",
    environment: "demo",
    checkedAt: new Date().toISOString(),
  });
}

export async function POST(request: Request, context: RouteContext) {
  const service = await resolveService(context);

  if (!service) {
    return NextResponse.json(
      { ok: false, error: "Unsupported integration service." },
      { status: 404 }
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  const payload = contentType.includes("application/json")
    ? await request.json().catch(() => null)
    : null;

  return NextResponse.json(
    {
      ok: true,
      service: service.key,
      name: service.name,
      status: "accepted",
      environment: "demo",
      received: payload,
      processedAt: new Date().toISOString(),
    },
    { status: 202 }
  );
}
