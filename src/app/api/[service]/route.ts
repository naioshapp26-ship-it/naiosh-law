import { NextResponse } from "next/server";

const supportedServices = new Set([
  "sms",
  "email",
  "payments",
  "sign",
  "courts",
  "tax",
  "ocr",
  "analytics",
]);

type RouteContext = {
  params: Promise<{ service: string }>;
};

function serviceResponse(service: string, method: string, payload?: unknown) {
  if (!supportedServices.has(service)) {
    return NextResponse.json(
      { ok: false, error: "Unsupported integration service", service },
      { status: 404 }
    );
  }

  return NextResponse.json({
    ok: true,
    service,
    method,
    mode: "demo",
    status: service === "courts" ? "warning" : "connected",
    processedAt: new Date().toISOString(),
    payload: payload ?? null,
  });
}

export async function GET(_request: Request, context: RouteContext) {
  const { service } = await context.params;
  return serviceResponse(service, "GET");
}

export async function POST(request: Request, context: RouteContext) {
  const { service } = await context.params;
  let payload: unknown = null;

  try {
    payload = await request.json();
  } catch {
    payload = null;
  }

  return serviceResponse(service, "POST", payload);
}
