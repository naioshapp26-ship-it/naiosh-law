import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import { labelIntegrationType } from "@/lib/notifications";
import type { IntegrationType } from "@/generated/prisma/client";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";

export async function GET() {
  const { error } = await requireAuth();
  if (error) return error;

  const items = await prisma.integration.findMany({
    orderBy: { createdAt: "desc" },
    include: { officeBranch: true },
  });

  const base = items.map((i) => ({
    id: i.id,
    name: i.name,
    type: labelIntegrationType(i.type),
    provider: i.provider,
    endpoint: i.endpoint ?? "—",
    callsToday: i.callsToday,
    successRate: `${i.successRate}%`,
    lastChecked: i.lastChecked ?? "—",
    branch: i.officeBranch?.name ?? "عام",
    status: i.status,
  }));
  return NextResponse.json(await attachCustomValuesToRows("integrations", base));
}

export async function POST(request: Request) {
  const { error, session } = await requireWrite();
  if (error) return error;
  const body = await request.json();

  const apiKey = body.apiKey ? String(body.apiKey) : null;
  const masked = apiKey ? `${apiKey.slice(0, 4)}••••${apiKey.slice(-4)}` : null;

  const created = await prisma.integration.create({
    data: {
      name: String(body.name ?? ""),
      type: (body.type as IntegrationType) ?? "other",
      provider: String(body.provider ?? "custom"),
      endpoint: body.endpoint ? String(body.endpoint) : null,
      apiKeyMasked: masked,
      status: String(body.status ?? "متصل"),
      officeBranchId: body.officeBranchId ? String(body.officeBranchId) : null,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: "integrations",
    sourceId: created.id,
    body: body as Record<string, unknown>,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json(created, { status: 201 });
}
