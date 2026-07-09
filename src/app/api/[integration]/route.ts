import { jsonError, jsonResponse, readJsonBody, requireAuth } from "@/lib/api-helpers";

const integrations = new Set(["sms", "email", "payments", "sign", "courts", "tax", "ocr", "analytics"]);

type Props = {
  params: Promise<{ integration: string }>;
};

async function requireIntegrationAdmin() {
  return requireAuth(["admin", "industrial_agent"]);
}

export async function GET(_request: Request, { params }: Props) {
  const { error } = await requireIntegrationAdmin();
  if (error) return error;

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

export async function POST(request: Request, { params }: Props) {
  const { error } = await requireIntegrationAdmin();
  if (error) return error;

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
