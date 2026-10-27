import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, requireWrite } from "@/lib/api-helpers";
import {
  attachCustomValuesToRows,
  persistCustomFieldsFromBody,
} from "@/lib/page-settings/record-custom-api";
import {
  assertPageAction,
  isGenericModuleKey,
} from "@/lib/page-settings/page-action-auth";
import type { Prisma } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ moduleKey: string }> };

function flattenRow(id: string, data: Record<string, unknown>, status: string) {
  return { id, status, ...data };
}

export async function GET(_request: Request, ctx: Ctx) {
  const { moduleKey } = await ctx.params;
  const { error, session } = await requireAuth();
  if (error) return error;
  if (!isGenericModuleKey(moduleKey)) {
    return NextResponse.json({ error: "وحدة غير مدعومة لهذا الـAPI" }, { status: 404 });
  }

  const gate = await assertPageAction({
    pageKey: moduleKey,
    action: "view",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const rows = await prisma.moduleRecord.findMany({
    where: { moduleKey },
    orderBy: { createdAt: "desc" },
  });

  const base = rows.map((r) =>
    flattenRow(r.id, (r.data ?? {}) as Record<string, unknown>, r.status)
  );
  const withCustom = await attachCustomValuesToRows(moduleKey, base);
  return NextResponse.json(withCustom);
}

export async function POST(request: Request, ctx: Ctx) {
  const { moduleKey } = await ctx.params;
  const { error, session } = await requireWrite();
  if (error) return error;
  if (!isGenericModuleKey(moduleKey)) {
    return NextResponse.json({ error: "وحدة غير مدعومة لهذا الـAPI" }, { status: 404 });
  }

  const gate = await assertPageAction({
    pageKey: moduleKey,
    action: "create",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const status = body.status != null ? String(body.status) : "نشط";
  // Strip known top-level control keys; keep the rest as record data
  const { id: _id, ...rest } = body;
  void _id;

  const created = await prisma.moduleRecord.create({
    data: {
      moduleKey,
      data: rest as Prisma.InputJsonValue,
      status,
      createdById: session!.sub,
      updatedById: session!.sub,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: moduleKey,
    sourceId: created.id,
    body,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}
