import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireWrite } from "@/lib/api-helpers";
import { persistCustomFieldsFromBody } from "@/lib/page-settings/record-custom-api";
import {
  assertPageAction,
  isGenericModuleKey,
} from "@/lib/page-settings/page-action-auth";
import type { Prisma } from "@/generated/prisma/client";
import { ensureClientWithContact } from "@/lib/person-contact-server";

type Ctx = { params: Promise<{ moduleKey: string; id: string }> };

function personNameFromData(data: Record<string, unknown>): string {
  for (const key of ["client", "clientName", "name", "requester"]) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function hasPersonFields(data: Record<string, unknown>): boolean {
  return Boolean(
    data.client ||
      data.clientName ||
      data.requester ||
      data.phone ||
      data.country ||
      data.city ||
      data.phoneDialCode ||
      data.phoneSecondary
  );
}

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
  let nextData: Record<string, unknown> = { ...prev, ...rest };
  const status = body.status != null ? String(body.status) : existing.status;

  // Keep central Client contact in sync when person/contact fields change
  if (hasPersonFields(nextData)) {
    const name = personNameFromData(nextData) || personNameFromData(prev);
    const existingClientId =
      typeof nextData.clientId === "string"
        ? nextData.clientId
        : typeof prev.clientId === "string"
          ? prev.clientId
          : null;
    if (name || existingClientId) {
      const ensured = await ensureClientWithContact({
        name: name || "طرف خارجي",
        clientId: existingClientId,
        body: nextData,
        role: session!.role,
        changedById: session!.sub,
        changedByName: session!.name ?? session!.email,
        sourceModule: moduleKey,
        sourceId: id,
        requireComplete: Boolean(nextData.phone || nextData.country || nextData.city),
      });
      if (!ensured.ok) {
        return NextResponse.json({ error: ensured.error }, { status: ensured.status });
      }
      nextData = {
        ...nextData,
        clientId: ensured.clientId,
        client: ensured.clientName,
        phone: ensured.contact.phone ?? "",
        phoneDialCode: ensured.contact.phoneDialCode ?? "",
        phoneSecondary: ensured.contact.phoneSecondary ?? "",
        phoneSecondaryDialCode: ensured.contact.phoneSecondaryDialCode ?? "",
        country: ensured.contact.country ?? "",
        city: ensured.contact.city ?? "",
      };
    }
  }

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

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    clientId: nextData.clientId ?? null,
    phone: nextData.phone ?? null,
    country: nextData.country ?? null,
    city: nextData.city ?? null,
  });
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
