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
import {
  ensureClientWithContact,
  findClientContactByName,
  mapRowWithClientContact,
} from "@/lib/person-contact-server";
import {
  canViewPersonContact,
  formatPhoneDisplay,
  UNSPECIFIED_CONTACT,
} from "@/lib/person-contact";

type Ctx = { params: Promise<{ moduleKey: string }> };

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
      data.phone ||
      data.country ||
      data.city ||
      data.phoneDialCode
  );
}

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

  const role = session!.role;
  const canView = canViewPersonContact(role);

  const rows = await prisma.moduleRecord.findMany({
    where: { moduleKey },
    orderBy: { createdAt: "desc" },
  });

  const base = [];
  for (const r of rows) {
    const data = (r.data ?? {}) as Record<string, unknown>;
    const flat = flattenRow(r.id, data, r.status);
    const name = personNameFromData(data);
    const clientId = typeof data.clientId === "string" ? data.clientId : null;
    if (name || clientId) {
      const contact = clientId
        ? await prisma.client.findUnique({
            where: { id: clientId },
            select: {
              id: true,
              name: true,
              phone: true,
              phoneDialCode: true,
              phoneSecondary: true,
              phoneSecondaryDialCode: true,
              primaryPhoneSlot: true,
              country: true,
              city: true,
              countrySecondary: true,
              citySecondary: true,
              primaryAddressSlot: true,
            },
          })
        : await findClientContactByName(name);
      if (contact) {
        base.push(mapRowWithClientContact(flat, contact, canView ? role : null));
        continue;
      }
    }
    // Prefer stored display fields; never invent values
    base.push({
      ...flat,
      phone:
        typeof data.phone === "string" && data.phone
          ? formatPhoneDisplay(
              typeof data.phoneDialCode === "string" ? data.phoneDialCode : null,
              data.phone
            )
          : UNSPECIFIED_CONTACT,
      country:
        typeof data.country === "string" && data.country ? data.country : UNSPECIFIED_CONTACT,
      city: typeof data.city === "string" && data.city ? data.city : UNSPECIFIED_CONTACT,
      contactIncomplete: true,
    });
  }
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
  const { id: _id, ...rest } = body;
  void _id;

  let dataPayload: Record<string, unknown> = { ...rest };

  if (hasPersonFields(body)) {
    const name = personNameFromData(body);
    if (name || body.phone || body.country || body.city) {
      const ensured = await ensureClientWithContact({
        name: name || "طرف خارجي",
        clientId: body.clientId ? String(body.clientId) : null,
        body,
        role: session!.role,
        changedById: session!.sub,
        changedByName: session!.name ?? session!.email,
        sourceModule: moduleKey,
        requireComplete: Boolean(body.phone || body.country || body.city),
      });
      if (!ensured.ok) {
        return NextResponse.json({ error: ensured.error }, { status: ensured.status });
      }
      dataPayload = {
        ...dataPayload,
        clientId: ensured.clientId,
        client: ensured.clientName,
        phone: ensured.contact.phone ?? "",
        phoneDialCode: ensured.contact.phoneDialCode ?? "",
        country: ensured.contact.country ?? "",
        city: ensured.contact.city ?? "",
      };
    }
  }

  const created = await prisma.moduleRecord.create({
    data: {
      moduleKey,
      data: dataPayload as Prisma.InputJsonValue,
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

  return NextResponse.json(
    {
      id: created.id,
      clientId: dataPayload.clientId ?? null,
      phone: dataPayload.phone ?? null,
      country: dataPayload.country ?? null,
      city: dataPayload.city ?? null,
    },
    { status: 201 }
  );
}
