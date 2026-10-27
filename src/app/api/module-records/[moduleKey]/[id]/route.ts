import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { persistCustomFieldsFromBody } from "@/lib/page-settings/record-custom-api";
import {
  assertPageAction,
  isGenericModuleKey,
} from "@/lib/page-settings/page-action-auth";
import type { Prisma } from "@/generated/prisma/client";

type Ctx = { params: Promise<{ moduleKey: string; id: string }> };

export async function PATCH(request: Request, ctx: Ctx) {
  const { moduleKey, id } = await ctx.params;
  const { error, session } = await requireWrite();
  if (error) return error;
  if (!isGenericModuleKey(moduleKey)) {
    return NextResponse.json({ error: "وحدة غير مدعومة لهذا الـAPI" }, { status: 404 });
  }

  const gate = await assertPageAction({
    pageKey: moduleKey,
    action: "edit",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const existing = await prisma.moduleRecord.findFirst({ where: { id, moduleKey } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  const prev = (existing.data ?? {}) as Record<string, unknown>;
  const { id: _id, ...rest } = body;
  void _id;
  const nextData = { ...prev, ...rest };
  const status = body.status != null ? String(body.status) : existing.status;

  const updated = await prisma.moduleRecord.update({
    where: { id },
    data: {
      data: nextData as Prisma.InputJsonValue,
      status,
      updatedById: session!.sub,
    },
  });

  await persistCustomFieldsFromBody({
    sourceModule: moduleKey,
    sourceId: id,
    body,
    userId: session!.sub,
    role: session!.role,
  });

  return NextResponse.json({ id: updated.id, status: updated.status });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const { moduleKey, id } = await ctx.params;
  const { error, session } = await requireWrite();
  if (error) return error;
  if (!isGenericModuleKey(moduleKey)) {
    return NextResponse.json({ error: "وحدة غير مدعومة لهذا الـAPI" }, { status: 404 });
  }

  const gate = await assertPageAction({
    pageKey: moduleKey,
    action: "delete",
    role: session!.role,
    userId: session!.sub,
  });
  if (!gate.ok) return gate.response;

  const existing = await prisma.moduleRecord.findFirst({ where: { id, moduleKey } });
  if (!existing) return NextResponse.json({ error: "غير موجود" }, { status: 404 });

  await prisma.moduleRecord.delete({ where: { id } });
  // Soft-safe: do not cascade-delete client business data elsewhere; only this module row
  await prisma.recordCustomValue.deleteMany({
    where: { sourceModule: moduleKey, sourceId: id },
  });

  return NextResponse.json({ ok: true });
}
